/**
 * ActiveSignals — Signal count panel.
 *
 * thesis valid → show active count in green
 * thesis invalid → show "NO ACTIVE SIGNALS" in grey, zero green anywhere
 */

import type { IntradaySnapshot } from '../../hooks/useIntradaySnapshot';

interface Props {
  snapshot: IntradaySnapshot | null;
}

export function ActiveSignals({ snapshot }: Props) {
  if (!snapshot) return null;

  // Thesis invalid — ZERO green
  if (!snapshot.thesis_valid) {
    return (
      <div style={{
        marginTop: '1rem',
        padding: '1.25rem 1.5rem',
        background: 'rgba(100, 116, 139, 0.08)',
        border: '1px solid rgba(100, 116, 139, 0.15)',
        borderRadius: '0.75rem',
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: 'rgba(148, 163, 184, 0.6)',
          marginBottom: '0.25rem',
        }}>
          NO ACTIVE SIGNALS
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: 'rgba(148, 163, 184, 0.4)',
        }}>
          {snapshot.signals_invalidated > 0
            ? `${snapshot.signals_invalidated} signal${snapshot.signals_invalidated !== 1 ? 's' : ''} invalidated — thesis broken`
            : 'No signals — thesis invalidated'
          }
        </div>
      </div>
    );
  }

  // Thesis valid
  return (
    <div style={{
      marginTop: '1rem',
      padding: '1.25rem 1.5rem',
      background: 'rgba(34, 197, 94, 0.06)',
      border: '1px solid rgba(34, 197, 94, 0.15)',
      borderRadius: '0.75rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#22c55e',
          }}>
            {snapshot.signals_active}
          </span>
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'rgba(226, 232, 240, 0.7)',
            marginLeft: '0.5rem',
          }}>
            Active Signal{snapshot.signals_active !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'rgba(148, 163, 184, 0.6)',
        }}>
          {snapshot.morning_verdict && (
            <span>Verdict: <strong style={{ color: 'rgba(226, 232, 240, 0.8)' }}>{snapshot.morning_verdict}</strong></span>
          )}
          {snapshot.volume_character !== 'unknown' && (
            <span>Volume: <strong style={{ color: 'rgba(226, 232, 240, 0.8)' }}>{snapshot.volume_character}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}
