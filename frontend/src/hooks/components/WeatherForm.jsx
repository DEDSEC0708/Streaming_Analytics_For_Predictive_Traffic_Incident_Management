export default function WeatherForm({ onPredict }) {
  return (
    <div>
      <h2>Weather Input</h2>
      <button
        onClick={() =>
          onPredict({
            temperature: 30,
            humidity: 60,
            visibility: 10,
            wind_speed: 5,
            hour: 12,
            weather_condition: "Clear",
          })
        }
      >
        Predict Risk
      </button>
    </div>
  );
}