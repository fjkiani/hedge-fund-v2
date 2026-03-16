/**
 * LiveSession — Intraday thesis validity page.
 *
 * Shows:
 * 1. Circuit Breaker banner (if active — sticky, non-dismissible)
 * 2. Thesis Status (green/red/grey)
 * 3. Active Signals count
 *
 * Polls /api/v1/intraday/snapshot every 60 seconds.
 * When thesis_valid=false, ZERO green signals visible. Red everywhere.
 */

import { useIntradaySnapshot } from '../hooks/useIntradaySnapshot';
import { ThesisStatus, CircuitBreakerBanner, ActiveSignals } from '../components/intraday';

export function LiveSession() {
  const { snapshot, loading, error } = useIntradaySnapshot();

  return (
    <main style={{
      padding: '1.5rem',
      maxWidth: '1200px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 60px)',
    }}>
      {/* Circuit Breaker — sticky top, above everything */}
      {snapshot?.circuit_breaker_active && (
        <CircuitBreakerBanner
          active={true}
          reason={snapshot.circuit_breaker_reason}
        />
      )}

      {/* Page header */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#e2e8f0',
            margin: 0,
          }}>
            🛡️ Live Session
          </h1>
          <p style={{
            fontSize: '0.8rem',
            color: 'rgba(148, 163, 184, 0.5)',
            marginTop: '0.25rem',
          }}>
            Intraday thesis monitoring • Auto-refreshes every 60s
          </p>
        </div>
        {snapshot?.last_check && (
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(148, 163, 184, 0.4)',
            textAlign: 'right',
          }}>
            <div>Last check: {snapshot.last_check}</div>
            {snapshot.market_open && (
              <div style={{ marginTop: '0.125rem' }}>
                Polling: <span style={{ color: '#22c55e' }}>●</span> active
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && !snapshot && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '0.5rem',
          color: '#ef4444',
          fontSize: '0.9rem',
          marginBottom: '1rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Thesis Status Banner */}
      <ThesisStatus snapshot={snapshot} loading={loading} />

      {/* Active Signals Panel */}
      <ActiveSignals snapshot={snapshot} />

      {/* Key Levels Summary */}
      {snapshot && snapshot.spy_price > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem 1.5rem',
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid rgba(100, 116, 139, 0.1)',
          borderRadius: '0.75rem',
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'rgba(148, 163, 184, 0.6)',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Key Levels
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { label: 'SPY Price', value: `$${snapshot.spy_price.toFixed(2)}`, color: '#e2e8f0' },
              { label: 'Call Wall', value: `$${snapshot.spy_call_wall.toFixed(0)}`, color: '#22c55e' },
              { label: 'Put Wall', value: `$${snapshot.spy_put_wall.toFixed(0)}`, color: '#ef4444' },
              { label: 'POC', value: `$${snapshot.spy_poc.toFixed(0)}`, color: '#818cf8' },
              { label: 'Volume', value: `${snapshot.volume_ratio}x (${snapshot.volume_character})`, color: 'rgba(226, 232, 240, 0.7)' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(148, 163, 184, 0.5)', marginBottom: '0.25rem' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: item.color }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
