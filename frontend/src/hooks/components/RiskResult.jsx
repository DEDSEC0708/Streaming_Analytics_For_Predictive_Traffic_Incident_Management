export default function RiskResult({ prediction }) {
  return (
    <div>
      <h2>Risk Result</h2>
      {prediction ? (
        <div>
          <p>Risk: {prediction.risk_level}</p>
          <p>Confidence: {prediction.confidence}</p>
        </div>
      ) : (
        <p>No data</p>
      )}
    </div>
  );
}