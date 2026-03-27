import os
import json
import numpy as np
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from features import extract_features

# ── Config ──────────────────────────────────────────────────────────────────
DATASET_PATH = "DATASET"
CLASSES = {"human": 0, "machine": 1}
RANDOM_STATE = 42

# ── Data Loading ─────────────────────────────────────────────────────────────
print("=" * 60)
print("  Voice Classifier — Training Pipeline")
print("=" * 60)

X, y = [], []
label_counts = {}

for label, idx in CLASSES.items():
    folder = os.path.join(DATASET_PATH, label)
    if not os.path.exists(folder):
        print(f"  [WARN] Folder not found: {folder}")
        continue

    files = [f for f in os.listdir(folder) if f.endswith(".wav")]
    label_counts[label] = 0
    print(f"\n  Loading '{label}' ({len(files)} files)...")

    for i, file in enumerate(files):
        path = os.path.join(folder, file)
        result = extract_features(file_path=path)
        feat = result[0]
        if feat is not None:
            X.append(feat)
            y.append(idx)
            label_counts[label] += 1
        if (i + 1) % 20 == 0:
            print(f"    Processed {i+1}/{len(files)}")

print(f"\n  Dataset Summary:")
for label, count in label_counts.items():
    print(f"    {label}: {count} samples")
print(f"    Total: {len(X)} samples, {len(set(y))} classes")

if len(X) < 10:
    print("\n  [ERROR] Not enough samples. Add more .wav files to DATASET/")
    exit(1)

X = np.array(X)
y = np.array(y)

# Handle NaN/Inf
X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

# ── Scaling ───────────────────────────────────────────────────────────────────
print("\n  Scaling features...")
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── Train / Test Split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)
print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

# ── Models ────────────────────────────────────────────────────────────────────
print("\n  Training models...")

xgb = XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric="logloss",
    random_state=RANDOM_STATE,
    verbosity=0
)

rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=RANDOM_STATE,
    n_jobs=-1
)

# Ensemble (soft voting)
ensemble = VotingClassifier(
    estimators=[("xgb", xgb), ("rf", rf)],
    voting="soft"
)

ensemble.fit(X_train, y_train)
print("  ✓ Ensemble model trained")

# ── Evaluation ────────────────────────────────────────────────────────────────
print("\n  Evaluating on test set...")
y_pred = ensemble.predict(X_test)
y_prob = ensemble.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, zero_division=0)
rec = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
cm = confusion_matrix(y_test, y_pred).tolist()

print(f"\n  ┌─────────────────────────────┐")
print(f"  │  Accuracy  : {acc*100:.2f}%           │")
print(f"  │  Precision : {prec*100:.2f}%           │")
print(f"  │  Recall    : {rec*100:.2f}%           │")
print(f"  │  F1 Score  : {f1*100:.2f}%           │")
print(f"  └─────────────────────────────┘")
print(f"\n  Confusion Matrix: {cm}")
print(f"\n{classification_report(y_test, y_pred, target_names=['Human','Machine'])}")

# Cross-validation
cv = StratifiedKFold(n_splits=min(5, len(set(y))), shuffle=True, random_state=RANDOM_STATE)
cv_scores = cross_val_score(ensemble, X_scaled, y, cv=cv, scoring="accuracy")
print(f"  Cross-Val Accuracy: {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")

# ── Save ──────────────────────────────────────────────────────────────────────
joblib.dump(ensemble, "model.pkl")
joblib.dump(scaler, "scaler.pkl")
print("\n  ✓ Saved: model.pkl, scaler.pkl")

metrics = {
    "accuracy": round(acc * 100, 2),
    "precision": round(prec * 100, 2),
    "recall": round(rec * 100, 2),
    "f1": round(f1 * 100, 2),
    "confusion_matrix": cm,
    "cv_mean": round(cv_scores.mean() * 100, 2),
    "cv_std": round(cv_scores.std() * 100, 2),
    "train_samples": int(len(X_train)),
    "test_samples": int(len(X_test)),
    "dataset": label_counts,
    "feature_count": int(X.shape[1]),
    "model": "XGBoost + RandomForest Ensemble (Soft Voting)"
}

with open("metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("  ✓ Saved: metrics.json")
print("\n  ✅ Training complete! Now run: uvicorn main:app --reload")
print("=" * 60)
