"""
Traffic Incident Risk Prediction - FastAPI backend.

Endpoints (all prefixed with /api):
  POST /predict           - predict risk from manual weather inputs
  GET  /live-data         - fetch live weather from OpenWeather by city
  GET  /history           - recent predictions stored in MongoDB
  GET  /model-info        - model accuracy + feature importance
  GET  /settings          - returns whether OpenWeather key is configured (masked)
  POST /settings          - persist OpenWeather API key in MongoDB
  GET  /weather-options   - list of allowed weather_condition values
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field, confloat, conint
from starlette.middleware.cors import CORSMiddleware

from train_model import WEATHER_CONDITIONS, ensure_model

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# --- Load (or train) the model on startup ------------------------------------
logger.info("Loading XGBoost risk model...")
BUNDLE = ensure_model()
MODEL = BUNDLE["model"]
WEATHER_ENCODER = BUNDLE["weather_encoder"]
LABEL_ENCODER = BUNDLE["label_encoder"]
FEATURE_COLUMNS = BUNDLE["feature_columns"]
logger.info(
    "Model ready - accuracy=%.4f n_samples=%d classes=%s",
    BUNDLE["accuracy"], BUNDLE["n_samples"], list(LABEL_ENCODER.classes_),
)

# --- FastAPI --------------------------------------------------------------------
app = FastAPI(title="Traffic Incident Risk Prediction API")
api_router = APIRouter(prefix="/api")


# --- Schemas -------------------------------------------------------------------
class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    temperature: confloat(ge=-60, le=60)
    humidity: confloat(ge=0, le=100)
    visibility: confloat(ge=0, le=50)
    wind_speed: confloat(ge=0, le=250)
    hour: conint(ge=0, le=23)
    weather_condition: str
    city: Optional[str] = None
    source: Optional[str] = "manual"  # "manual" | "live"


class ProbabilityBreakdown(BaseModel):
    Low: float
    Medium: float
    High: float


class PredictResponse(BaseModel):
    id: str
    risk_level: str
    confidence: float
    probabilities: ProbabilityBreakdown
    inputs: dict
    timestamp: datetime
    source: str
    city: Optional[str] = None


class HistoryItem(BaseModel):
    id: str
    risk_level: str
    confidence: float
    probabilities: ProbabilityBreakdown
    inputs: dict
    timestamp: datetime
    source: str
    city: Optional[str] = None


class SettingsPayload(BaseModel):
    openweather_api_key: str = Field(min_length=8, max_length=128)


class SettingsResponse(BaseModel):
    configured: bool
    key_preview: Optional[str] = None


# --- Helpers -------------------------------------------------------------------
def _map_openweather_to_condition(main: str) -> str:
    """Map OpenWeather's `weather[0].main` string onto our label set."""
    m = (main or "").lower()
    mapping = {
        "clear": "Clear",
        "clouds": "Cloudy",
        "rain": "Rain",
        "drizzle": "Rain",
        "thunderstorm": "Thunderstorm",
        "snow": "Snow",
        "mist": "Fog",
        "fog": "Fog",
        "haze": "Fog",
        "smoke": "Fog",
        "dust": "Fog",
        "sand": "Fog",
        "ash": "Fog",
        "squall": "Thunderstorm",
        "tornado": "Thunderstorm",
    }
    return mapping.get(m, "Cloudy")


async def _get_openweather_key() -> Optional[str]:
    doc = await db.settings.find_one({"_id": "openweather"}, {"_id": 0})
    if not doc:
        return None
    return doc.get("api_key")


def _predict(features: PredictRequest) -> tuple[str, float, dict]:
    if features.weather_condition not in WEATHER_CONDITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"weather_condition must be one of {WEATHER_CONDITIONS}",
        )
    weather_enc = int(WEATHER_ENCODER.transform([features.weather_condition])[0])
    row = [[
        features.temperature,
        features.humidity,
        features.visibility,
        features.wind_speed,
        features.hour,
        weather_enc,
    ]]
    proba = MODEL.predict_proba(row)[0]
    class_idx = int(proba.argmax())
    label = str(LABEL_ENCODER.inverse_transform([class_idx])[0])
    class_names = list(LABEL_ENCODER.classes_)
    prob_map = {name: float(round(proba[i], 4)) for i, name in enumerate(class_names)}
    # Ensure Low/Medium/High keys exist in fixed order
    probs = {k: prob_map.get(k, 0.0) for k in ["Low", "Medium", "High"]}
    return label, float(round(proba[class_idx], 4)), probs


# --- Routes --------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {
        "service": "traffic-incident-risk-api",
        "model_accuracy": BUNDLE["accuracy"],
        "classes": list(LABEL_ENCODER.classes_),
    }


@api_router.get("/weather-options")
async def weather_options():
    return {"conditions": WEATHER_CONDITIONS}


@api_router.post("/predict", response_model=PredictResponse)
async def predict(payload: PredictRequest):
    label, confidence, probs = _predict(payload)
    record_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    inputs = {
        "temperature": payload.temperature,
        "humidity": payload.humidity,
        "visibility": payload.visibility,
        "wind_speed": payload.wind_speed,
        "hour": payload.hour,
        "weather_condition": payload.weather_condition,
    }
    doc = {
        "id": record_id,
        "risk_level": label,
        "confidence": confidence,
        "probabilities": probs,
        "inputs": inputs,
        "timestamp": now.isoformat(),
        "source": payload.source or "manual",
        "city": payload.city,
    }
    await db.predictions.insert_one(doc.copy())
    return PredictResponse(
        id=record_id,
        risk_level=label,
        confidence=confidence,
        probabilities=ProbabilityBreakdown(**probs),
        inputs=inputs,
        timestamp=now,
        source=payload.source or "manual",
        city=payload.city,
    )


@api_router.get("/history", response_model=List[HistoryItem])
async def history(limit: int = Query(20, ge=1, le=200)):
    cursor = db.predictions.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
    items = []
    async for doc in cursor:
        ts = doc["timestamp"]
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        items.append(
            HistoryItem(
                id=doc["id"],
                risk_level=doc["risk_level"],
                confidence=doc["confidence"],
                probabilities=ProbabilityBreakdown(**doc["probabilities"]),
                inputs=doc["inputs"],
                timestamp=ts,
                source=doc.get("source", "manual"),
                city=doc.get("city"),
            )
        )
    return items


@api_router.get("/model-info")
async def model_info():
    return {
        "accuracy": BUNDLE["accuracy"],
        "feature_importance": BUNDLE["feature_importance"],
        "n_samples": BUNDLE["n_samples"],
        "classes": list(LABEL_ENCODER.classes_),
    }


@api_router.get("/settings", response_model=SettingsResponse)
async def get_settings():
    key = await _get_openweather_key()
    if not key:
        return SettingsResponse(configured=False)
    preview = f"{key[:4]}{'*' * max(0, len(key) - 8)}{key[-4:]}"
    return SettingsResponse(configured=True, key_preview=preview)


@api_router.post("/settings", response_model=SettingsResponse)
async def update_settings(payload: SettingsPayload):
    await db.settings.update_one(
        {"_id": "openweather"},
        {"$set": {"api_key": payload.openweather_api_key,
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    preview = (
        f"{payload.openweather_api_key[:4]}"
        f"{'*' * max(0, len(payload.openweather_api_key) - 8)}"
        f"{payload.openweather_api_key[-4:]}"
    )
    return SettingsResponse(configured=True, key_preview=preview)


@api_router.get("/live-data")
async def live_data(city: str = Query(..., min_length=1, max_length=120)):
    api_key = await _get_openweather_key()
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="OpenWeather API key is not configured. Add it in Settings.",
        )
    try:
        resp = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "appid": api_key, "units": "metric"},
            timeout=8,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Upstream error: {exc}") from exc

    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid OpenWeather API key.")
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"City not found: {city}")
    if not resp.ok:
        raise HTTPException(status_code=502, detail=f"OpenWeather error: {resp.text}")

    data = resp.json()
    weather_main = data.get("weather", [{}])[0].get("main", "")
    condition = _map_openweather_to_condition(weather_main)
    main = data.get("main", {})
    wind = data.get("wind", {})
    # visibility from OpenWeather is meters (0..10000); convert to km
    vis_m = data.get("visibility", 10000)
    visibility_km = round(float(vis_m) / 1000.0, 2)
    hour = datetime.now(timezone.utc).hour
    return {
        "city": data.get("name", city),
        "country": data.get("sys", {}).get("country"),
        "temperature": round(float(main.get("temp", 0.0)), 2),
        "humidity": int(main.get("humidity", 0)),
        "visibility": visibility_km,
        "wind_speed": round(float(wind.get("speed", 0.0)) * 3.6, 2),  # m/s -> kph
        "hour": hour,
        "weather_condition": condition,
        "weather_description": data.get("weather", [{}])[0].get("description", ""),
        "raw_weather_main": weather_main,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
