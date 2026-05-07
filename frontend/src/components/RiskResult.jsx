export default function RiskResult({ result }) {
  return (
    <div style={{ padding: 20 }}>
      <h2>Risk Result</h2>
      <p>{result ? JSON.stringify(result) : "No data"}</p>
    </div>
  );
}