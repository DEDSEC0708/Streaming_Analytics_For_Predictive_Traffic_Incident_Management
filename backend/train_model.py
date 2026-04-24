"""
Traffic Incident Risk Prediction - Model Training

Generates a realistic synthetic dataset that encodes documented relationships
between weather conditions and traffic accident risk (established in road-safety
research: e.g., heavy rain/snow/fog substantially increase incident probability,
low visibility compounds risk, rush-hour traffic volume is a strong factor, etc.)

We sample features, then compute a latent risk score using a rules-informed
function plus Gaussian noise, discretize into Low / Medium / High classes,
and train an XGBoost classifier.

The resulting model learns the non-linear combinations and is usable for
inference on arbitrary real weather inputs.
"""

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

ROOT_DIR = Path(__file__).parent
DATA_DIR = ROOT_DIR / "data"
MODEL_PATH = ROOT_DIR / "model.pkl"

WEATHER_CONDITIONS = [
    "Clear",
    "Cloudy",
    "Rain",
    "Heavy Rain",
    "Snow",
    "Fog",
    "Thunderstorm",
]

FEATURE_COLUMNS = [
    "temperature",
    "humidity",
    "visibility",
    "wind_speed",
    "hour",
    "weather_condition",
]


def generate_dataset(n_samples: int = 12000, seed: int = 42) -> pd.DataFrame:
    """Generate realistic weather+time feature samples and rule-derived risk."""
    rng = np.random.default_rng(seed)

    temperature = rng.normal(loc=15, scale=12, size=n_samples).clip(-20, 45)
    humidity = rng.normal(loc=65, scale=18, size=n_samples).clip(10, 100)
    visibility = rng.normal(loc=9, scale=3, size=n_samples).clip(0.1, 15)
    wind_speed = np.abs(rng.normal(loc=12, scale=9, size=n_samples)).clip(0, 80)
    hour = rng.integers(low=0, high=24, size=n_samples)

    # Weather distribution weighted toward more common conditions
    weather_probs = np.array([0.32, 0.26, 0.16, 0.07, 0.07, 0.07, 0.05])
    weather = rng.choice(WEATHER_CONDITIONS, size=n_samples, p=weather_probs)

    # ---- Rule-informed latent risk score ----
    risk_score = np.zeros(n_samples, dtype=float)

    # Weather contribution
    weather_weights = {
        "Clear": 0.0,
        "Cloudy": 0.5,
        "Rain": 1.6,
        "Heavy Rain": 2.8,
        "Snow": 2.6,
        "Fog": 2.4,
        "Thunderstorm": 2.9,
    }
    risk_score += np.vectorize(weather_weights.get)(weather)

    # Visibility: below 5km starts hurting, below 1km is severe
    risk_score += np.where(
        visibility < 1, 3.0,
        np.where(visibility < 3, 1.8,
                 np.where(visibility < 5, 1.0, 0.0))
    )

    # Wind: >40 kph is concerning, >60 kph dangerous
    risk_score += np.where(
        wind_speed > 60, 2.2,
        np.where(wind_speed > 40, 1.2,
                 np.where(wind_speed > 25, 0.5, 0.0))
    )

    # Temperature: icing near/below freezing, heat stress above ~38C
    risk_score += np.where(
        temperature <= 0, 1.5,
        np.where(temperature <= 3, 0.8,
                 np.where(temperature >= 38, 0.7, 0.0))
    )

    # Humidity: very high + precipitation-type weather correlates with slick roads
    precip_mask = np.isin(weather, ["Rain", "Heavy Rain", "Snow", "Thunderstorm"])
    risk_score += np.where((humidity > 85) & precip_mask, 0.6, 0.0)

    # Hour: rush hours + late night
    risk_score += np.where(
        ((hour >= 7) & (hour <= 9)) | ((hour >= 16) & (hour <= 19)), 1.1,
        np.where(((hour >= 0) & (hour <= 4)) | (hour == 23), 1.3, 0.0)
    )

    # Stochastic noise so model must learn patterns, not a hard rule
    risk_score += rng.normal(loc=0.0, scale=0.9, size=n_samples)

    # Discretize into 3 classes with balanced-ish thresholds
    low_thr, high_thr = np.quantile(risk_score, [0.45, 0.80])
    risk_label = np.where(
        risk_score < low_thr, "Low",
        np.where(risk_score < high_thr, "Medium", "High"),
    )

    df = pd.DataFrame({
        "temperature": np.round(temperature, 2),
        "humidity": np.round(humidity, 1),
        "visibility": np.round(visibility, 2),
        "wind_speed": np.round(wind_speed, 2),
        "hour": hour.astype(int),
        "weather_condition": weather,
        "risk_level": risk_label,
    })
    return df


def train_and_save(df: pd.DataFrame) -> dict:
    """Train XGBoost classifier and persist the bundle to model.pkl."""
    weather_encoder = LabelEncoder()
    weather_encoder.fit(WEATHER_CONDITIONS)

    label_encoder = LabelEncoder()
    label_encoder.fit(["Low", "Medium", "High"])

    X = df[FEATURE_COLUMNS].copy()
    X["weather_condition"] = weather_encoder.transform(X["weather_condition"])
    y = label_encoder.transform(df["risk_level"])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = xgb.XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = float(accuracy_score(y_test, y_pred))
    report = classification_report(
        y_test, y_pred,
        target_names=list(label_encoder.classes_),
        output_dict=True,
        zero_division=0,
    )

    # Feature importance (gain-based) mapped to feature names.
    # When fitted on a DataFrame, booster keys are the column names themselves.
    booster = model.get_booster()
    score_map = booster.get_score(importance_type="gain")
    importances = []
    for idx, col in enumerate(FEATURE_COLUMNS):
        val = score_map.get(col, score_map.get(f"f{idx}", 0.0))
        importances.append({"feature": col, "importance": float(val)})
    total = sum(i["importance"] for i in importances) or 1.0
    for i in importances:
        i["importance_pct"] = round(i["importance"] / total * 100, 2)
    importances.sort(key=lambda x: x["importance_pct"], reverse=True)

    bundle = {
        "model": model,
        "weather_encoder": weather_encoder,
        "label_encoder": label_encoder,
        "feature_columns": FEATURE_COLUMNS,
        "weather_conditions": WEATHER_CONDITIONS,
        "accuracy": accuracy,
        "classification_report": report,
        "feature_importance": importances,
        "n_samples": int(len(df)),
    }

    joblib.dump(bundle, MODEL_PATH)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_DIR / "dataset.csv", index=False)
    with open(DATA_DIR / "training_metrics.json", "w") as f:
        json.dump({
            "accuracy": accuracy,
            "feature_importance": importances,
            "n_samples": int(len(df)),
        }, f, indent=2)
    return bundle


def ensure_model() -> dict:
    """Load the model bundle from disk, training first if needed."""
    if not MODEL_PATH.exists():
        df = generate_dataset()
        return train_and_save(df)
    return joblib.load(MODEL_PATH)


if __name__ == "__main__":
    print("Generating synthetic dataset...")
    df = generate_dataset()
    print(f"Dataset: {len(df)} rows. Class distribution:")
    print(df["risk_level"].value_counts())
    print("\nTraining XGBoost classifier...")
    bundle = train_and_save(df)
    print(f"\nTest accuracy: {bundle['accuracy']:.4f}")
    print("Feature importance:")
    for i in bundle["feature_importance"]:
        print(f"  {i['feature']:<20s} {i['importance_pct']:>6.2f}%")
    print(f"\nModel saved to {MODEL_PATH}")
