/**
 * CircuitBreakerBanner — Nuclear stop-all-trading banner.
 *
 * When active: sticky dark red banner at top, z-index 999, CANNOT be dismissed.
 * When inactive: renders nothing.
 */

interface Props {
  active: boolean;
  reason: string | null;
}

export function CircuitBreakerBanner({ active, reason }: Props) {
  if (!active) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 999,
      width: '100%',
      padding: '1rem 2rem',
      background: 'linear-gradient(135deg, #991b1b, #7f1d1d)',
      borderBottom: '2px solid #dc2626',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(153, 27, 27, 0.5)',
    }}>
      <div style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#ffffff',
        letterSpacing: '0.05em',
        marginBottom: '0.25rem',
      }}>
        🚨 CIRCUIT BREAKER ACTIVE — NO NEW TRADES TODAY
      </div>
      {reason && (
        <div style={{
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.8)',
        }}>
          {reason}
        </div>
      )}
    </div>
  );
}
