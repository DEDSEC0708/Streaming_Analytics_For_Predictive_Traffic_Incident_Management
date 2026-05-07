import React, { useState, useEffect } from "react";

export default function Dashboard() {
  const [inputs, setInputs] = useState({
    city: "Tokyo",
    temperature: 18,
    humidity: 65,
    visibility: 8,
    wind_speed: 12,
    hour: 18,
    weather_condition: "Clear",
  });

  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const lowCount = logs.filter(l => l.risk_level === "Low").length;
  const mediumCount = logs.filter(l => l.risk_level === "Medium").length;
  const highCount = logs.filter(l => l.risk_level === "High").length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: name === "hour" || name === "temperature" || name === "humidity" || name === "visibility" || name === "wind_speed" 
      ? Number(value) 
      : value 
    }));
  };

  const predict = async () => {
    setLoading(true);
    try {
      const payload = {
        temperature: inputs.temperature,
        humidity: inputs.humidity,
        visibility: inputs.visibility,
        wind_speed: inputs.wind_speed,
        hour: inputs.hour,
        weather_condition: inputs.weather_condition,
      };

      const res = await fetch("http://127.0.0.1:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      const newLog = {
        time: new Date().toLocaleString(),
        ...inputs,
        ...data,
      };

      setResult(data);
      setLogs(prev => [newLog, ...prev].slice(0, 15)); // keep last 15
    } catch (err) {
      console.error(err);
      alert("Prediction failed. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono">
      {/* Top Navbar */}
      <div className="border-b border-gray-800 bg-black/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white text-black px-2 py-1 text-xs font-bold">RX</div>
          <div>
            <div className="text-xs text-gray-500">RISK.OPS // V1.0 • XGBOOST.MULTICLASS</div>
            <h1 className="text-2xl font-bold tracking-tight">Traffic Incident Risk Console</h1>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="bg-gray-900 px-4 py-1 rounded border border-gray-700">
            ACCURACY <span className="text-emerald-400 font-semibold">69.5%</span>
          </div>
          <div className="bg-gray-900 px-4 py-1 rounded border border-gray-700">
            SAMPLES <span className="font-semibold">12,000</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 px-4 py-1 rounded flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            API KEY ACTIVE
          </div>
          <button className="bg-gray-900 hover:bg-gray-800 px-4 py-1 rounded border border-gray-700 flex items-center gap-2">
            ⚙️ SETTINGS
          </button>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-3 border-b border-gray-800">
        <div className="bg-black/60 p-6 border-r border-gray-800">
          <div className="text-emerald-400 text-xs tracking-widest">LOW • CUM</div>
          <div className="text-7xl font-bold text-emerald-400">{lowCount}</div>
        </div>
        <div className="bg-black/60 p-6 border-r border-gray-800">
          <div className="text-yellow-400 text-xs tracking-widest">MEDIUM • CUM</div>
          <div className="text-7xl font-bold text-yellow-400">{mediumCount}</div>
        </div>
        <div className="bg-black/60 p-6">
          <div className="text-red-400 text-xs tracking-widest">HIGH • CUM</div>
          <div className="text-7xl font-bold text-red-400">{highCount}</div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Panel - Input Conditions */}
        <div className="w-1/2 border-r border-gray-800 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              ■ INPUT CONDITIONS
            </h2>
            <span className="text-xs text-gray-500">MANUAL</span>
          </div>

          {/* Fetch Live Weather */}
          <div className="mb-8">
            <label className="block text-xs text-gray-400 mb-1">FETCH LIVE WEATHER</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputs.city}
                onChange={(e) => setInputs(prev => ({...prev, city: e.target.value}))}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="City name (e.g. London, Tokyo, Mumbai)"
              />
              <button className="bg-white text-black px-6 font-medium text-sm hover:bg-gray-200">
                PULL
              </button>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">KEY_STATUS :: ACTIVE</div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-1">TEMPERATURE</label>
              <div className="flex">
                <input
                  type="number"
                  name="temperature"
                  value={inputs.temperature}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-l px-4 py-3 text-2xl focus:outline-none focus:border-emerald-500"
                />
                <div className="bg-gray-800 border border-l-0 border-gray-700 rounded-r px-4 flex items-center text-gray-400">°C</div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">HUMIDITY</label>
              <div className="flex">
                <input
                  type="number"
                  name="humidity"
                  value={inputs.humidity}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-l px-4 py-3 text-2xl focus:outline-none focus:border-emerald-500"
                />
                <div className="bg-gray-800 border border-l-0 border-gray-700 rounded-r px-4 flex items-center text-gray-400">%</div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">VISIBILITY</label>
              <div className="flex">
                <input
                  type="number"
                  name="visibility"
                  value={inputs.visibility}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-l px-4 py-3 text-2xl focus:outline-none focus:border-emerald-500"
                />
                <div className="bg-gray-800 border border-l-0 border-gray-700 rounded-r px-4 flex items-center text-gray-400">KM</div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">WIND SPEED</label>
              <div className="flex">
                <input
                  type="number"
                  name="wind_speed"
                  value={inputs.wind_speed}
                  onChange={handleInputChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded-l px-4 py-3 text-2xl focus:outline-none focus:border-emerald-500"
                />
                <div className="bg-gray-800 border border-l-0 border-gray-700 rounded-r px-4 flex items-center text-gray-400">KPH</div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">HOUR (24H)</label>
              <input
                type="number"
                name="hour"
                value={inputs.hour}
                onChange={handleInputChange}
                min="0"
                max="23"
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-2xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">WEATHER CONDITION</label>
              <select
                name="weather_condition"
                value={inputs.weather_condition}
                onChange={handleInputChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 text-lg focus:outline-none focus:border-emerald-500"
              >
                <option>Clear</option>
                <option>Cloudy</option>
                <option>Rain</option>
                <option>Heavy Rain</option>
                <option>Fog</option>
                <option>Thunderstorm</option>
              </select>
            </div>
          </div>

          <button
            onClick={predict}
            disabled={loading}
            className="mt-10 w-full bg-white hover:bg-gray-100 active:bg-gray-200 text-black font-semibold py-4 rounded flex items-center justify-center gap-3 disabled:opacity-50"
          >
            ⚡ RUN PREDICTION
          </button>

          <div className="text-center text-[10px] text-gray-500 mt-2">
            MODEL :: XGBOOST_MULTICLASS
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 p-6 flex flex-col">
          <div className="bg-gray-950 border border-gray-800 h-full rounded flex flex-col">
            {result ? (
              <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
                <div className={`text-8xl font-bold mb-4 ${
                  result.risk_level === "Low" ? "text-emerald-400" :
                  result.risk_level === "Medium" ? "text-yellow-400" : "text-red-400"
                }`}>
                  {result.risk_level}
                </div>
                <p className="text-gray-400">Risk Level</p>
                <p className="mt-8 text-xl">
                  Confidence: <span className="font-semibold text-white">{result.confidence}</span>
                </p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="text-6xl mb-6 opacity-30">{"[  -----  ]"}</div>
                  <p className="text-gray-400 text-lg">AWAITING INPUT</p>
                  <p className="text-sm text-gray-500 mt-4 max-w-xs mx-auto">
                    Provide weather conditions on the left and run prediction to see the computed road-safety risk level with class probabilities.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Logs + Insights */}
      <div className="border-t border-gray-800 grid grid-cols-2">
        {/* Model Insights */}
        <div className="p-6 border-r border-gray-800">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">■ MODEL INSIGHTS</h3>
            <span className="text-xs text-gray-500">XGBOOST :: GAIN</span>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <div className="text-gray-400">ACCURACY</div>
              <div className="text-4xl font-bold text-emerald-400">69.5%</div>
            </div>
            <div>
              <div className="text-gray-400">TRAINING SAMPLES</div>
              <div className="text-4xl font-bold">12,000</div>
            </div>
          </div>
        </div>

        {/* Prediction Log */}
        <div className="p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">■ PREDICTION LOG</h3>
            <span className="text-xs text-gray-500">N = {logs.length}</span>
          </div>

          <div className="max-h-64 overflow-auto text-sm font-mono space-y-2">
            {logs.length === 0 ? (
              <p className="text-gray-500">No predictions yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex gap-6 border-b border-gray-800 pb-2 last:border-0">
                  <span className="text-gray-500 whitespace-nowrap">{log.time}</span>
                  <span className={`font-semibold ${
                    log.risk_level === "Low" ? "text-emerald-400" :
                    log.risk_level === "Medium" ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {log.risk_level}
                  </span>
                  <span className="text-gray-400">T={log.temperature}°C H={log.humidity}% V={log.visibility}km W={log.wind_speed}kph {log.weather_condition}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}