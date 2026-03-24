/**
 * OracleRead — shared NYX ambient read component.
 * Used by all panels. Returns null if oracle is unavailable (panels still render).
 */
export function OracleRead({ section }: {
  section: { summary: string | null; confidence: number | null } | null | undefined
}) {
  if (!section?.summary) return null;
  return (
    <div className="mb-oracle-read">
      <span className="mb-oracle-read__label">NYX:</span>
      <span className="mb-oracle-read__text">{section.summary}</span>
      {section.confidence != null && (
        <span className="mb-oracle-read__conf">{Math.round(section.confidence * 100)}%</span>
      )}
    </div>
  );
}
