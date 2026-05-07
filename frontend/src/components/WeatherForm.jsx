export default function WeatherForm({ onPredict }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Weather Input</h2>
      <button onClick={() => onPredict && onPredict()}>
        Predict Risk
      </button>
    </div>
  );
}