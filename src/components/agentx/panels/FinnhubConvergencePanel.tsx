/**
 * FinnhubConvergencePanel — Do insiders agree with politicians?
 * Signal: CONVERGENCE = high conviction. DIVERGENCE = red flag.
 */

import { Card } from '../../ui/Card';
import type { FinnhubSignal } from '../types';

interface Props {
    signals: FinnhubSignal[];
}

const CONVERGENCE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    STRONG_CONVERGENCE: { emoji: '🟢', color: '#22c55e', label: 'STRONG' },
    MILD_CONVERGENCE: { emoji: '🟡', color: '#facc15', label: 'MILD' },
    DIVERGENCE: { emoji: '🔴', color: '#ef4444', label: 'DIVERGENCE' },
    NEUTRAL: { emoji: '⚪', color: '#94a3b8', label: 'NEUTRAL' },
    unknown: { emoji: '❓', color: '#64748b', label: 'UNKNOWN' },
};

export function FinnhubConvergencePanel({ signals }: Props) {
    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <h3 className="card-title text-base">Insider Convergence</h3>
                </div>
                <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#a78bfa',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                }}>
                    Finnhub MSPR
                </span>
            </div>

            {signals.length > 0 ? (
                <div className="space-y-2">
                    {signals.map((sig, i) => {
                        const cfg = CONVERGENCE_CONFIG[sig.convergence] || CONVERGENCE_CONFIG.unknown;
                        return (
                            <div key={i} style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: `${cfg.color}08`,
                                border: `1px solid ${cfg.color}20`,
                            }}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span style={{
                                            fontWeight: 700,
                                            fontSize: '0.9375rem',
                                            color: '#e2e8f0',
                                            fontFamily: 'monospace',
                                        }}>
                                            {sig.ticker}
                                        </span>
                                        <span style={{
                                            fontSize: '0.6875rem',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '4px',
                                            background: `${cfg.color}20`,
                                            color: cfg.color,
                                            fontWeight: 600,
                                        }}>
                                            {cfg.emoji} {cfg.label}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: (sig.divergence_boost ?? 0) > 0 ? '#22c55e' : (sig.divergence_boost ?? 0) < 0 ? '#ef4444' : '#94a3b8',
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                    }}>
                                        {(sig.divergence_boost ?? 0) > 0 ? '+' : ''}{sig.divergence_boost ?? 0}
                                    </span>
                                </div>

                                {/* Politician vs Insider */}
                                <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                    <span style={{ color: '#94a3b8' }}>Politician: </span>
                                    <span style={{
                                        color: sig.politician_action?.toLowerCase() === 'buy' ? '#22c55e' : '#ef4444',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                    }}>
                                        {sig.politician_action}
                                    </span>
                                    <span style={{ color: '#475569', margin: '0 0.5rem' }}>|</span>
                                    <span style={{ color: '#94a3b8' }}>MSPR: </span>
                                    <span style={{
                                        color: (sig.insider_mspr ?? 0) > 0 ? '#22c55e' : '#ef4444',
                                        fontWeight: 600,
                                    }}>
                                        {sig.insider_mspr !== null ? sig.insider_mspr.toFixed(0) : 'N/A'}
                                    </span>
                                </div>

                                {/* Reasoning */}
                                {sig.reasoning.map((r, j) => (
                                    <div key={j} style={{
                                        fontSize: '0.6875rem',
                                        color: '#94a3b8',
                                        paddingLeft: '0.5rem',
                                        borderLeft: `2px solid ${cfg.color}30`,
                                        marginTop: '0.25rem',
                                    }}>
                                        {r}
                                    </div>
                                ))}

                                {/* Catalysts */}
                                {sig.catalysts && sig.catalysts.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {sig.catalysts.map((c, k) => (
                                            <span key={k} style={{
                                                fontSize: '0.625rem',
                                                padding: '0.0625rem 0.375rem',
                                                borderRadius: '4px',
                                                background: 'rgba(250, 204, 21, 0.1)',
                                                color: '#facc15',
                                                border: '1px solid rgba(250, 204, 21, 0.2)',
                                            }}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                    <span className="text-2xl mb-2">📡</span>
                    <span className="text-sm">No convergence signals yet</span>
                    <span className="text-xs mt-1">Waiting for Finnhub MSPR cross-reference</span>
                </div>
            )}
        </Card>
    );
}
