import { useOracle } from '../OracleContext';

/**
 * OracleBriefStrip — always-visible oracle verdict bar.
 *
 * Sits at the top of the Unified Intelligence section.
 * No clicks required. Ambient. Always on.
 * Hidden when oracle is unavailable (risk_level === 'UNKNOWN').
 *
 * Color logic:
 *   HIGH    → red bar
 *   MEDIUM  → amber bar
 *   LOW     → muted blue-grey bar
 */

const RISK_STYLES: Record<string, { bar: string; badge: string; text: string }> = {
  HIGH:   { bar: '#7f1d1d', badge: '#ef4444', text: '#fecaca' },
  MEDIUM: { bar: '#78350f', badge: '#f59e0b', text: '#fde68a' },
  LOW:    { bar: '#1e293b', badge: '#64748b', text: '#cbd5e1' },
};

export function OracleBriefStrip() {
  const oracle = useOracle();

  // Hide entirely when unavailable or UNKNOWN
  if (!oracle || oracle.loading || oracle.risk_level === 'UNKNOWN' || !oracle.verdict) return null;

  const styles = RISK_STYLES[oracle.risk_level] ?? RISK_STYLES.LOW;
  const ts = oracle.generated_at
    ? new Date(oracle.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      className="oracle-brief-strip"
      style={{ background: styles.bar }}
      role="status"
      aria-label={`Oracle: ${oracle.risk_level} risk`}
    >
      {/* Risk badge */}
      <div className="oracle-strip-badge" style={{ background: styles.badge }}>
        <span className="oracle-strip-label">NYX</span>
        <span className="oracle-strip-risk">{oracle.risk_level}</span>
      </div>

      {/* Verdict */}
      <p className="oracle-strip-verdict" style={{ color: styles.text }}>
        {oracle.verdict}
      </p>

      {/* Trade implication (if present) */}
      {oracle.trade_implication && (
        <>
          <div className="oracle-strip-divider" />
          <p className="oracle-strip-implication" style={{ color: styles.text }}>
            {oracle.trade_implication}
          </p>
        </>
      )}

      {ts && <span className="oracle-strip-ts">{ts} ET</span>}
    </div>
  );
}
