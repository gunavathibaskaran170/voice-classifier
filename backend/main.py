"""
main.py  —  FastAPI backend server
Run: uvicorn main:app --reload --port 8000
"""

import io
import json
import os
import tempfile

import joblib
import librosa
import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from features import extract_features

# ── App Setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="Voice Classifier API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load Model ────────────────────────────────────────────────────────────────
model, scaler = None, None

def load_model():
    global model, scaler
    try:
        model = joblib.load("model.pkl")
        scaler = joblib.load("scaler.pkl")
        print("✓ Model and scaler loaded successfully")
        return True
    except FileNotFoundError:
        print("⚠ model.pkl / scaler.pkl not found. Run train.py first.")
        return False

load_model()

# ── Decision Logic ─────────────────────────────────────────────────────────────
def make_decision(confidence: float, pred_label: str) -> dict:
    """Three-tier confidence-based decision system."""
    if confidence >= 0.85:
        tier = "High Confidence"
        tier_code = "high"
        message = f"The audio is almost certainly {pred_label}."
        color = "green"
    elif confidence >= 0.65:
        tier = "Needs Review"
        tier_code = "review"
        message = "The prediction is ambiguous. Consider re-recording in a quieter environment."
        color = "amber"
    else:
        tier = "Uncertain"
        tier_code = "uncertain"
        message = "The model is not confident. The audio may be noisy, too short, or atypical."
        color = "red"

    return {
        "tier": tier,
        "tier_code": tier_code,
        "message": message,
        "color": color
    }

# ── Helpers ────────────────────────────────────────────────────────────────────
def normalize_radar(radar: dict) -> dict:
    """Normalize radar values to 0-100 scale for frontend chart."""
    raw = {
        "mfcc_energy": min(radar.get("mfcc_energy", 0) / 50.0, 1.0),
        "pitch_stability": min(radar.get("pitch_stability", 0) / 500.0, 1.0),
        "spectral_brightness": min(radar.get("spectral_brightness", 0), 1.0),
        "zcr_level": min(radar.get("zcr_level", 0) / 0.3, 1.0),
        "rms_energy": min(radar.get("rms_energy", 0) / 0.5, 1.0),
        "chroma_consistency": max(radar.get("chroma_consistency", 0), 0.0)
    }
    return {k: round(v * 100, 1) for k, v in raw.items()}

def predict_from_audio(audio: np.ndarray, sr: int) -> dict:
    """Core prediction logic, shared by both endpoints."""
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run train.py first.")

    result = extract_features(audio_data=audio)
    feat, spec_data, radar = result

    if feat is None:
        raise HTTPException(status_code=422, detail="Could not extract features. Audio may be too short or silent.")

    feat = np.nan_to_num(feat.reshape(1, -1))
    feat_scaled = scaler.transform(feat)

    pred = int(model.predict(feat_scaled)[0])
    prob = model.predict_proba(feat_scaled)[0]
    confidence = float(np.max(prob))
    confidence_pct = round(confidence * 100, 2)

    label = "Machine Voice" if pred == 1 else "Human Voice"
    icon = "🤖" if pred == 1 else "🧑"

    decision = make_decision(confidence, label)
    radar_normalized = normalize_radar(radar) if radar else {}

    return {
        "prediction": label,
        "icon": icon,
        "class_id": pred,
        "confidence": confidence_pct,
        "confidence_raw": confidence,
        "probabilities": {
            "human": round(float(prob[0]) * 100, 2),
            "machine": round(float(prob[1]) * 100, 2)
        },
        "decision": decision,
        "spectrogram": spec_data,
        "radar": radar_normalized,
        "audio_info": {
            "sample_rate": sr,
            "duration_sec": round(len(audio) / sr, 2)
        }
    }

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Voice Classifier API v2"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None
    }

@app.get("/metrics")
def get_metrics():
    """Return training metrics from metrics.json."""
    if not os.path.exists("metrics.json"):
        raise HTTPException(status_code=404, detail="metrics.json not found. Run train.py first.")
    with open("metrics.json") as f:
        return json.load(f)

@app.post("/predict/upload")
async def predict_upload(file: UploadFile = File(...)):
    """Predict from an uploaded .wav file."""
    if not file.filename.endswith(".wav"):
        raise HTTPException(status_code=400, detail="Only .wav files are supported.")

    content = await file.read()
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        audio, sr = librosa.load(tmp_path, sr=22050)
        os.unlink(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read audio file: {e}")

    return predict_from_audio(audio, sr)

@app.post("/predict/record")
async def predict_record(file: UploadFile = File(...)):
    """Predict from a live-recorded audio blob (webm/wav)."""
    content = await file.read()
    try:
        audio_bytes = io.BytesIO(content)
        data, samplerate = sf.read(audio_bytes)
        if len(data.shape) > 1:
            data = np.mean(data, axis=1)
        # Resample to 22050 if needed
        if samplerate != 22050:
            data = librosa.resample(data.astype(float), orig_sr=samplerate, target_sr=22050)
            samplerate = 22050
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse recorded audio: {e}")

    return predict_from_audio(data.astype(float), samplerate)
