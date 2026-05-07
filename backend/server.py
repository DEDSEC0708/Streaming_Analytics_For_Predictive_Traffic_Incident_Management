from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx
import random
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputData(BaseModel):
    temperature: float = None
    humidity: float = None
    visibility: float = None
    wind_speed: float = None
    hour: int = None
    weather_condition: str = None
    city: str = None   # New field for live fetch

@app.get("/api/")
def root():
    return {"status": "API Running - Live Weather Supported"}

@app.post("/api/predict")
async def predict(data: InputData):
    # If city is provided, fetch live weather
    if data.city:
        weather = await fetch_live_weather(data.city)
        if weather:
            # Override inputs with live data
            temp = weather["temperature"]
            hum = weather["humidity"]
            wind = weather["wind_speed"]
            vis = weather.get("visibility", 10)
            cond = weather["condition"]
            hour = datetime.now().hour
        else:
            temp = data.temperature or 18
            hum = data.humidity or 65
            wind = data.wind_speed or 12
            vis = data.visibility or 8
            cond = data.weather_condition or "Clear"
            hour = data.hour or datetime.now().hour
    else:
        # Manual input
        temp = data.temperature or 18
        hum = data.humidity or 65
        wind = data.wind_speed or 12
        vis = data.visibility or 8
        cond = data.weather_condition or "Clear"
        hour = data.hour or datetime.now().hour

    # TODO: Later replace this with real XGBoost prediction
    risk_level = random.choice(["Low", "Medium", "High"])
    confidence = round(random.uniform(0.75, 0.98), 2)

    return {
        "risk_level": risk_level,
        "confidence": confidence,
        "inputs_used": {
            "temperature": temp,
            "humidity": hum,
            "visibility": vis,
            "wind_speed": wind,
            "hour": hour,
            "weather_condition": cond,
            "city": data.city
        }
    }

async def fetch_live_weather(city: str):
    """Fetch current weather using Open-Meteo (no API key needed)"""
    try:
        # First get coordinates for the city (using Open-Meteo Geocoding)
        async with httpx.AsyncClient() as client:
            geo_res = await client.get(f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1")
            geo_data = geo_res.json()
            
            if not geo_data.get("results"):
                return None
                
            lat = geo_data["results"][0]["latitude"]
            lon = geo_data["results"][0]["longitude"]

            # Get current weather
            weather_res = await client.get(
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={lat}&longitude={lon}"
                f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
                f"&timezone=auto"
            )
            w = weather_res.json()["current"]

            # Simple weather code mapping
            condition_map = {
                0: "Clear", 1: "Clear", 2: "Cloudy", 3: "Cloudy",
                45: "Fog", 48: "Fog",
                51: "Rain", 53: "Rain", 55: "Rain",
                61: "Rain", 63: "Heavy Rain", 65: "Heavy Rain",
                71: "Snow", 73: "Snow", 75: "Snow",
                80: "Rain", 81: "Heavy Rain", 82: "Heavy Rain",
                95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm"
            }

            return {
                "temperature": round(w["temperature_2m"]),
                "humidity": round(w["relative_humidity_2m"]),
                "wind_speed": round(w["wind_speed_10m"]),
                "visibility": 8,                    # Open-Meteo doesn't give visibility directly
                "condition": condition_map.get(w["weather_code"], "Cloudy"),
                "hour": datetime.now().hour
            }
    except:
        return None