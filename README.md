# 🎙️ Voice Authenticity Detector

> Classify audio as **Human Voice** or **AI-Generated Voice** using a XGBoost + Random Forest ensemble model — with a sleek neon-themed React frontend.

![Voice Authenticity Detector](https://img.shields.io/badge/ML-XGBoost%20%2B%20Random%20Forest-blue?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.14-green?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite)

---

## 📌 Overview

Voice Authenticity Detector is a full-stack machine learning web application that analyzes audio files and determines whether a voice is **human** or **machine-generated (AI)**. It uses a soft-voting ensemble of XGBoost and Random Forest classifiers trained on 366 audio features extracted via a custom signal processing pipeline.

---

## ✨ Features

- 🎵 **Audio Upload & Analysis** — Drag & drop or browse to upload `.wav` / `.mp3` files
- 🤖 **AI vs Human Classification** — Ensemble model with confidence scoring
- 📊 **Spectrogram Visualization** — Real-time visual of audio frequency data
- 🎯 **Confidence Ring** — Visual confidence tier (High / Review / Uncertain)
- 📡 **Radar Chart** — Voice fingerprint across multiple audio dimensions
- 📈 **Model Performance Metrics** — Accuracy, Precision, Recall, F1 Score displayed live
- 🌊 **Waveform Animation** — Animated wave bars during analysis
- 🌙 **Neon Dark UI** — Glassmorphism design with cyan/purple neon theme

---

## 🧠 ML Model

| Property         | Details                                       |
| ---------------- | --------------------------------------------- |
| Model            | XGBoost + RandomForest Ensemble (Soft Voting) |
| Features         | 366 dimensions                                |
| Train/Test Split | 77/23                                         |
| Accuracy         | ~97%                                          |
| Precision        | ~97%                                          |
| Recall           | ~97%                                          |
| F1 Score         | ~97%                                          |
| Validation       | Cross-Validation (5-fold), ±0.81%             |

### Feature Pipeline

- MFCC coefficients (mean + std) × 800
- Spectral Centroid/Bandwidth/Rolloff × 300
- Chroma (13 bins) × mean/std × 26D
- Spectral Contrast (7 bands × mean/std × 14D)
- Pitch (F0mean + std + yin + pyin) × 4D
- ZCR + RMS/ESD (each × 4D)
- Total → **366 dimensions**

---

## 🗂️ Project Structure

```
voice-classifier/
├── backend/
│   ├── main.py              # FastAPI app — prediction, health, metrics endpoints
│   ├── model.pkl            # Trained ensemble model (joblib)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html           # Vite entry point
│   ├── vite.config.js       # Vite + proxy config
│   ├── tailwind.config.js   # Tailwind custom theme
│   ├── postcss.config.js    # PostCSS config
│   ├── src/
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx         # React entry point
│   │   ├── index.css        # Global styles + Tailwind
│   │   └── components/
│   │       ├── ConfidenceRing.jsx
│   │       ├── RadarChart.jsx
│   │       ├── ResultCard.jsx
│   │       ├── SpectrogramView.jsx
│   │       ├── TrainPanel.jsx
│   │       ├── WaveAnimation.jsx
│   │       └── WaveBars.jsx
└── venv/                    # Python virtual environment
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.10+
- npm v9+

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/voice-classifier.git
cd voice-classifier
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at → `http://localhost:8000`

---

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start the dev server
npm run dev
```

Frontend runs at → `http://localhost:3000`

---

### 4. Open the App

Navigate to `http://localhost:3000` in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint          | Description                          |
| ------ | ----------------- | ------------------------------------ |
| `GET`  | `/health`         | Health check                         |
| `GET`  | `/metrics`        | Model performance metrics            |
| `POST` | `/predict/upload` | Upload audio file for classification |

### Example Response — `/predict/upload`

```json
{
  "prediction": "Machine",
  "confidence": 0.97,
  "label": "AI-Generated Voice",
  "tier": "High Confidence",
  "features": { ... }
}
```

---

## 🖥️ Tech Stack

### Frontend

| Technology     | Purpose                  |
| -------------- | ------------------------ |
| React 18       | UI framework             |
| Vite 5         | Build tool & dev server  |
| Tailwind CSS 3 | Utility-first styling    |
| Framer Motion  | Animations               |
| Recharts       | Radar/performance charts |
| Axios          | HTTP client              |
| Lucide React   | Icons                    |

### Backend

| Technology   | Purpose                       |
| ------------ | ----------------------------- |
| FastAPI      | REST API framework            |
| Uvicorn      | ASGI server                   |
| XGBoost      | Gradient boosting classifier  |
| Scikit-learn | Random Forest + preprocessing |
| Librosa      | Audio feature extraction      |
| Joblib       | Model serialization           |
| NumPy        | Numerical computing           |

---

## ⚠️ Known Issues & Notes

- The `model.pkl` was trained with scikit-learn `1.5.0` and XGBoost older version. Running on newer versions may show `InconsistentVersionWarning` — this is non-critical but for best results, retrain the model with your current library versions.
- To retrain: export the model using `Booster.save_model()` in the original environment, then reload in the new environment.

---

## 📦 Backend `requirements.txt`

If missing, create one with:

```bash
pip freeze > requirements.txt
```

Minimum required packages:

```
fastapi
uvicorn
xgboost
scikit-learn
librosa
joblib
numpy
python-multipart
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---

## 👩‍💻 Author

**Team AlgoNexus**  
Built with ❤️ using React + FastAPI + XGBoost
