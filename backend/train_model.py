import joblib
from pathlib import Path

ROOT_DIR = Path(__file__).parent
MODEL_PATH = ROOT_DIR / "model.pkl"

WEATHER_CONDITIONS = [
    "Clear", "Cloudy", "Rain", "Heavy Rain",
    "Snow", "Fog", "Thunderstorm"
]

def ensure_model():
    return joblib.load(MODEL_PATH)