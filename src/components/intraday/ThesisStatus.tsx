/**
 * ThesisStatus — The core safety banner.
 *
 * thesis_valid=true  → GREEN: "✅ THESIS VALID"
 * thesis_valid=false → RED: "⛔ THESIS INVALIDATED" (impossible to miss)
 * market_open=false  → GREY: "🌙 Market Closed"
 */

import type { IntradaySnapshot } from '../../hooks/useIntradaySnapshot';

interface Props {
  snapshot: IntradaySnapshot | null;
  loading: boolean;
}

export function ThesisStatus({ snapshot, loading }: Props) {
  if (loading || !snapshot) {
    return (
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'rgba(100, 116, 139, 0.1)',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '0.75rem',
        color: 'rgba(148, 163, 184, 0.7)',
        fontSize: '0.9rem',
        textAlign: 'center',
      }}>
        ⏳ Waiting for session data...
      </div>
    );
  }

  // Market closed
  if (!snapshot.market_open) {
    return (
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'rgba(100, 116, 139, 0.12)',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '0.75rem',
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'rgba(148, 163, 184, 0.9)',
          marginBottom: '0.25rem',
        }}>
          🌙 Market Closed — showing last session data
        </div>
        {snapshot.last_check && (
          <div style={{ fontSize: '0.8rem', color: 'rgba(148, 163, 184, 0.5)' }}>
            Last check: {snapshot.last_check}
          </div>
        )}
      </div>
    );
  }

  // Thesis INVALID — THE RED BANNER
  if (!snapshot.thesis_valid) {
    return (
      <div style={{
        width: '100%',
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        border: '2px solid #ef4444',
        borderRadius: '0.75rem',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '0.5rem',
          letterSpacing: '0.02em',
        }}>
          ⛔ THESIS INVALIDATED
        </div>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.9)',
          lineHeight: 1.4,
        }}>
          {snapshot.thesis_invalidation_reason || 'Thesis has been invalidated'}
        </div>
        <div style={{
          marginTop: '0.75rem',
          display: 'flex',
          gap: '1.5rem',
          fontSize: '0.85rem',
          color: 'rgba(255, 255, 255, 0.7)',
        }}>
          <span>SPY: ${snapshot.spy_price.toFixed(2)}</span>
          <span>Wall: ${snapshot.spy_call_wall.toFixed(0)}</span>
          <span>Status: {snapshot.wall_status.toUpperCase()}</span>
          <span>Volume: {snapshot.volume_character}</span>
        </div>
      </div>
    );
  }

  // Thesis VALID — GREEN
  const diff = snapshot.spy_price - snapshot.spy_call_wall;
  const diffStr = diff >= 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`;
  const wallLabel = snapshot.spy_call_wall > 0 ? `$${snapshot.spy_call_wall.toFixed(0)}` : 'N/A';

  return (
    <div style={{
      width: '100%',
      padding: '1.25rem 1.5rem',
      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.06))',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '0.75rem',
    }}>
      <div style={{
        fontSize: '1.125rem',
        fontWeight: 700,
        color: '#22c55e',
        marginBottom: '0.375rem',
      }}>
        ✅ THESIS VALID
      </div>
      <div style={{
        fontSize: '0.95rem',
        color: 'rgba(226, 232, 240, 0.85)',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <span>SPY: <strong>${snapshot.spy_price.toFixed(2)}</strong></span>
        <span>|</span>
        <span>{diffStr} {diff >= 0 ? 'above' : 'below'} {wallLabel} wall</span>
        <span>|</span>
        <span style={{
          color: snapshot.wall_status === 'defended' ? '#22c55e'
            : snapshot.wall_status === 'testing' ? '#eab308'
            : '#ef4444',
          fontWeight: 600,
        }}>
          {snapshot.wall_status.toUpperCase()}
        </span>
        <span>|</span>
        <span>Vol: {snapshot.volume_character} ({snapshot.volume_ratio}x)</span>
      </div>
    </div>
  );
}
