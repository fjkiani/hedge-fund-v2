/**
 * SpouseAlertBanner — Flags spouse/joint trades for extra scrutiny
 * Signal: "This politician's spouse is trading — front-running suspicion"
 * Only renders when spouse_alerts.length > 0 — no empty state needed.
 */

import type { SpouseAlert } from '../types';

interface Props {
    alerts: SpouseAlert[];
}

export function SpouseAlertBanner({ alerts }: Props) {
    if (alerts.length === 0) return null;

    return (
        <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.08), rgba(245, 158, 11, 0.06))',
            border: '1px solid rgba(250, 204, 21, 0.25)',
            marginBottom: '0.5rem',
        }}>
            <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#facc15',
                    letterSpacing: '0.02em',
                }}>
                    SPOUSE TRADE ALERT
                </span>
                <span style={{
                    fontSize: '0.625rem',
                    padding: '0.0625rem 0.375rem',
                    borderRadius: '4px',
                    background: 'rgba(250, 204, 21, 0.15)',
                    color: '#fbbf24',
                    fontWeight: 600,
                }}>
                    {alerts.length} trade{alerts.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-1">
                {alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-3" style={{ fontSize: '0.75rem' }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                            {alert.politician}
                        </span>
                        <span style={{ color: '#475569' }}>→</span>
                        <span style={{
                            color: alert.type?.toLowerCase().includes('buy') ? '#22c55e' : '#ef4444',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                        }}>
                            {alert.type}
                        </span>
                        <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#a78bfa',
                        }}>
                            {alert.ticker}
                        </span>
                        <span style={{ color: '#64748b' }}>{alert.size}</span>
                        <span style={{ color: '#475569', fontSize: '0.6875rem' }}>{alert.date}</span>
                    </div>
                ))}
            </div>

            <div style={{
                fontSize: '0.625rem',
                color: '#92400e',
                marginTop: '0.5rem',
                fontStyle: 'italic',
            }}>
                Spouse ≠ politician but same household. Extra scrutiny warranted.
            </div>
        </div>
    );
}
