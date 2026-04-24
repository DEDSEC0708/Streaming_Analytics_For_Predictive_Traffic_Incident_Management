# PRD — Traffic Incident Risk Prediction System

## Problem Statement (Original)
Build a web application that predicts traffic-incident **Risk Level (Low / Medium / High)** from weather features (Temperature, Humidity, Visibility, Wind Speed, Hour, Weather Condition) using an **XGBoost** classifier. Support **live OpenWeather API** fetch OR **CSV-based** inference. Persist every prediction to **MongoDB**. No fake / hardcoded predictions — output must come from a real trained model.

## User Choices
- Stack: FastAPI + React + MongoDB (adapted from the original Flask spec)
- Data source: Both — CSV-trained XGBoost model + optional live OpenWeather fetch
- Dataset: Generated realistic synthetic dataset using documented weather-risk relationships
- Auth: Public, no login
- OpenWeather key: Not provided at build time; added later via Settings UI

## Architecture
- **Backend** (`/app/backend`)
  - `train_model.py` — generates a 12 000-row rule-informed dataset, trains XGBoost (400 trees, depth 6), persists bundle to `model.pkl`
  - `server.py` — FastAPI app; lazy-trains on first boot
  - MongoDB collections: `predictions`, `settings`
- **Frontend** (`/app/frontend`)
  - Single-page "Control Room" dashboard (`src/pages/Dashboard.jsx`)
  - Components: `WeatherForm`, `RiskResult`, `FeatureImportanceChart`, `HistoryTimeline`, `SettingsSheet`, `RiskBadge`
  - Design: dark theme, JetBrains Mono + IBM Plex Sans, pure risk colors (green / amber / red), 1 px borders, rounded-none
- **ML model**
  - XGBoost multi-class (Low / Medium / High)
  - Features: temperature, humidity, visibility, wind_speed, hour, weather_condition (label-encoded)
  - Accuracy: **69.5 %** on held-out test set (intentional noise in labels so model must learn patterns)
  - Top feature: weather_condition (54.28 %), then hour (14.43 %)

## API Endpoints (all prefixed `/api`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Service metadata |
| GET | `/weather-options` | List of 7 weather condition values |
| POST | `/predict` | Predict risk from inputs; stores to MongoDB |
| GET | `/history?limit=N` | Recent predictions sorted desc |
| GET | `/model-info` | Accuracy, feature importance, sample count |
| GET | `/settings` | Is OpenWeather key configured? (masked preview) |
| POST | `/settings` | Save OpenWeather key |
| GET | `/live-data?city=X` | Fetch live weather via OpenWeather |

## Implemented (2026-04-24)
- Rule-informed synthetic dataset generator + XGBoost training pipeline
- All 8 API endpoints with Pydantic validation, MongoDB persistence, `_id` exclusion
- Dashboard with Control-Room grid (sidebar, top stats, input form, risk widget, insights, log)
- Recharts visualizations (probability breakdown, feature importance)
- Settings sheet for OpenWeather key configuration
- Live weather fetch → auto-fill form flow
- 11/11 backend pytest, full frontend Playwright coverage — all green

## Backlog
- **P1** Replace `requests.get` in `/api/live-data` with `httpx.AsyncClient` to avoid blocking event loop
- **P1** Encrypt OpenWeather key at rest (currently plaintext in `settings` collection)
- **P2** Add "What-if" scenario comparator (run 3 predictions side-by-side)
- **P2** CSV upload → batch prediction mode
- **P2** Daily rollup of predictions per risk class (time-series chart)
- **P3** Google Maps / HERE traffic-volume integration as a 7th feature
- **P3** Export prediction log to CSV
- **P3** Geo-aware default city based on browser IP
