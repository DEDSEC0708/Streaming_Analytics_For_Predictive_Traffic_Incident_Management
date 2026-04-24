"""Backend tests for Traffic Incident Risk Prediction API."""
import os
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    "https://traffic-risk-predict.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --- Metadata endpoints ------------------------------------------------------
class TestMeta:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data["service"] == "traffic-incident-risk-api"
        assert "model_accuracy" in data
        assert set(data["classes"]) == {"High", "Low", "Medium"}

    def test_weather_options(self, s):
        r = s.get(f"{API}/weather-options")
        assert r.status_code == 200
        conds = r.json()["conditions"]
        assert isinstance(conds, list)
        assert len(conds) == 7
        for c in ["Clear", "Cloudy", "Rain", "Heavy Rain", "Snow", "Fog", "Thunderstorm"]:
            assert c in conds

    def test_model_info(self, s):
        r = s.get(f"{API}/model-info")
        assert r.status_code == 200
        d = r.json()
        assert 0.0 < d["accuracy"] <= 1.0
        assert d["n_samples"] > 0
        fi = d["feature_importance"]
        assert len(fi) == 6
        pcts = [f["importance_pct"] for f in fi]
        # sorted descending
        assert pcts == sorted(pcts, reverse=True)
        # sums ~100
        assert abs(sum(pcts) - 100.0) < 0.5
        # weather_condition should be dominant (from context)
        assert fi[0]["feature"] == "weather_condition"


# --- Predict -----------------------------------------------------------------
class TestPredict:
    def test_benign_inputs(self, s):
        payload = {
            "temperature": 22, "humidity": 50, "visibility": 12,
            "wind_speed": 8, "hour": 14, "weather_condition": "Clear",
            "source": "manual",
        }
        r = s.post(f"{API}/predict", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["risk_level"] in ("Low", "Medium")
        p = d["probabilities"]
        assert set(p.keys()) == {"Low", "Medium", "High"}
        assert abs(p["Low"] + p["Medium"] + p["High"] - 1.0) < 0.02
        assert d["inputs"]["weather_condition"] == "Clear"
        assert "id" in d and "timestamp" in d

    def test_dangerous_inputs(self, s):
        payload = {
            "temperature": -2, "humidity": 95, "visibility": 0.5,
            "wind_speed": 60, "hour": 3, "weather_condition": "Heavy Rain",
            "source": "manual",
        }
        r = s.post(f"{API}/predict", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["risk_level"] == "High"
        assert d["confidence"] > 0.5

    def test_invalid_weather_condition(self, s):
        payload = {
            "temperature": 20, "humidity": 50, "visibility": 10,
            "wind_speed": 5, "hour": 12, "weather_condition": "Hurricane",
        }
        r = s.post(f"{API}/predict", json=payload)
        assert r.status_code == 400
        assert "weather_condition" in r.text

    def test_out_of_range_temperature(self, s):
        payload = {
            "temperature": 200, "humidity": 50, "visibility": 10,
            "wind_speed": 5, "hour": 12, "weather_condition": "Clear",
        }
        r = s.post(f"{API}/predict", json=payload)
        assert r.status_code == 422

    def test_out_of_range_humidity(self, s):
        payload = {
            "temperature": 20, "humidity": 250, "visibility": 10,
            "wind_speed": 5, "hour": 12, "weather_condition": "Clear",
        }
        r = s.post(f"{API}/predict", json=payload)
        assert r.status_code == 422


# --- History -----------------------------------------------------------------
class TestHistory:
    def test_history_returns_recent(self, s):
        # create a marker prediction
        payload = {
            "temperature": 10, "humidity": 80, "visibility": 4,
            "wind_speed": 15, "hour": 18, "weather_condition": "Rain",
            "source": "manual", "city": "TEST_HistoryCity",
        }
        r = s.post(f"{API}/predict", json=payload)
        assert r.status_code == 200
        new_id = r.json()["id"]
        time.sleep(0.5)

        r = s.get(f"{API}/history", params={"limit": 10})
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) > 0
        # no mongo _id leakage
        for it in items:
            assert "_id" not in it
        ids = [it["id"] for it in items]
        assert new_id in ids
        # sorted desc by timestamp
        ts = [it["timestamp"] for it in items]
        assert ts == sorted(ts, reverse=True)


# --- Settings ----------------------------------------------------------------
class TestSettings:
    def test_post_short_key_fails(self, s):
        r = s.post(f"{API}/settings", json={"openweather_api_key": "abc"})
        assert r.status_code == 422

    def test_live_data_without_or_invalid_key(self, s):
        # Get current state
        cur = s.get(f"{API}/settings").json()
        if not cur.get("configured"):
            r = s.get(f"{API}/live-data", params={"city": "London"})
            assert r.status_code == 400
            assert "Settings" in r.text or "configured" in r.text.lower()

        # Now configure an invalid key and verify 401 path
        dummy = "INVALID_KEY_FOR_TESTING_XYZ"
        r = s.post(f"{API}/settings", json={"openweather_api_key": dummy})
        assert r.status_code == 200
        d = r.json()
        assert d["configured"] is True
        assert d["key_preview"].startswith("INVA")
        assert d["key_preview"].endswith("_XYZ")

        r = s.get(f"{API}/settings")
        assert r.status_code == 200 and r.json()["configured"] is True

        r = s.get(f"{API}/live-data", params={"city": "London"})
        assert r.status_code == 401, r.text
