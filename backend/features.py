import numpy as np
import librosa


def extract_features(file_path=None, audio_data=None, sr=22050):
    """
    Extract a rich feature vector from an audio file or numpy array.
    Returns (feature_vector, spectrogram_data) tuple.
    """
    try:
        if file_path is not None:
            audio, sr = librosa.load(file_path, sr=sr)
        else:
            audio = audio_data

        # Preprocessing
        audio, _ = librosa.effects.trim(audio, top_db=20)
        if len(audio) == 0:
            return None, None
        audio = librosa.util.normalize(audio)

        # --- MFCC (40 coefficients, mean + std) ---
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=40)

        # --- Mel Spectrogram (128 bands, mean + std) ---
        mel = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=128)
        mel_db = librosa.power_to_db(mel, ref=np.max)

        # --- Chroma ---
        chroma = librosa.feature.chroma_stft(y=audio, sr=sr)

        # --- Spectral Contrast ---
        spec_contrast = librosa.feature.spectral_contrast(y=audio, sr=sr)

        # --- Spectral Centroid & Rolloff ---
        spec_centroid = librosa.feature.spectral_centroid(y=audio, sr=sr)
        spec_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)

        # --- Zero Crossing Rate ---
        zcr = librosa.feature.zero_crossing_rate(audio)

        # --- RMS Energy ---
        rms = librosa.feature.rms(y=audio)

        # --- Tonnetz (tonal centroid features) ---
        harmonic = librosa.effects.harmonic(audio)
        tonnetz = librosa.feature.tonnetz(y=harmonic, sr=sr)

        # --- Pitch variance (F0 stability) ---
        f0, voiced_flag, _ = librosa.pyin(audio, fmin=50, fmax=500, sr=sr)
        f0_voiced = f0[voiced_flag] if voiced_flag is not None and f0 is not None else np.array([0.0])
        if len(f0_voiced) == 0:
            f0_voiced = np.array([0.0])
        pitch_mean = np.nanmean(f0_voiced)
        pitch_std = np.nanstd(f0_voiced)

        feature_vector = np.hstack([
            np.mean(mfcc, axis=1), np.std(mfcc, axis=1),           # 80
            np.mean(mel_db, axis=1), np.std(mel_db, axis=1),       # 256
            np.mean(chroma, axis=1), np.std(chroma, axis=1),       # 24
            np.mean(spec_contrast, axis=1), np.std(spec_contrast, axis=1),  # 14
            np.mean(spec_centroid), np.std(spec_centroid),          # 2
            np.mean(spec_rolloff), np.std(spec_rolloff),            # 2
            np.mean(zcr), np.std(zcr),                              # 2
            np.mean(rms), np.std(rms),                              # 2
            np.mean(tonnetz, axis=1), np.std(tonnetz, axis=1),     # 12
            pitch_mean, pitch_std                                   # 2
        ])

        # Spectrogram data for visualization (return condensed mel_db)
        spectrogram_data = mel_db[:64, :128].tolist()  # 64 bands, max 128 frames

        # Radar chart data (6 normalized axes)
        radar = {
            "mfcc_energy": float(np.mean(np.abs(mfcc))),
            "pitch_stability": float(1.0 / (pitch_std + 1e-6)),
            "spectral_brightness": float(np.mean(spec_centroid) / (sr / 2)),
            "zcr_level": float(np.mean(zcr)),
            "rms_energy": float(np.mean(rms)),
            "chroma_consistency": float(1.0 - np.std(np.mean(chroma, axis=1)))
        }

        return feature_vector, spectrogram_data, radar

    except Exception as e:
        print(f"Feature extraction error: {e}")
        return None, None, None
