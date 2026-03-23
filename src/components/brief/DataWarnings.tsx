/**
 * DataWarnings — Yellow banner for sensor malfunctions, sign issues, mixed signals.
 */

interface DataWarningsProps {
  warnings: string[];
}

export function DataWarnings({ warnings }: DataWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="data-warnings">
      <div className="data-warnings__title">⚠️ DATA WARNINGS</div>
      {warnings.map((w, i) => (
        <div key={i} className="data-warnings__item">⚠️ {w}</div>
      ))}
    </div>
  );
}
