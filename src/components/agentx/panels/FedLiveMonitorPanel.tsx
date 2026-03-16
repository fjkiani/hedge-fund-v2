/**
 * 🏦 FedLiveMonitorPanel — Live rate probabilities + rate path
 *
 * Powered by /economic/fedwatch → FedWatchEngine.get_probabilities()
 *
 * VERIFIED AGAINST LIVE NETWORK RESPONSE (2026-03-13):
 *   - Probabilities are INSIDE next_meeting: next_meeting.p_hold, next_meeting.p_cut_25, next_meeting.p_hike_25
 *   - current_range is [3.5, 3.75] ARRAY
 *   - next_meeting.days_away NOT days_until
 *   - engine_source NOT source
 */

import { Card } from '../../ui/Card';
import type { FedWatchData } from '../hooks/useFedIntelligence';

interface Props {
    data: FedWatchData | null;
    loading?: boolean;
}

const biasMap: Record<string, { color: string; bg: string; emoji: string; label: string }> = {
    BULLISH:          { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  emoji: '🟢', label: 'Rate cuts = Risk-on rally' },
    BEARISH:          { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  emoji: '🔴', label: 'Hike risk = Risk-off pressure' },
    NEUTRAL:          { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', emoji: '🟡', label: 'Wait for clarity on rate path' },
    STAGFLATION_RISK: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '🟠', label: 'Cuts + hikes both elevated' },
};

function getBias(data: FedWatchData): string {
    const nm = data.next_meeting;
    if (!nm) return 'NEUTRAL';
    if (nm.p_cut_25 > 50) return 'BULLISH';
    if (nm.p_hike_25 > 30) return 'BEARISH';
    if (nm.p_cut_25 > 20 && nm.p_hike_25 > 20) return 'STAGFLATION_RISK';
    return 'NEUTRAL';
}

export function FedLiveMonitorPanel({ data, loading }: Props) {
    if (loading && !data) {
        return (
            <Card>
                <div className="card-header">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🏦</span>
                        <h3 className="card-title text-base">Fed Watch Monitor</h3>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <div className="w-10 h-10 border-3 border-accent-purple border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-muted text-xs animate-pulse">Fetching live ZQ futures…</span>
                </div>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <div className="card-header">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🏦</span>
                        <h3 className="card-title text-base">Fed Watch Monitor</h3>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                    <span className="text-2xl mb-2">📡</span>
                    <span className="text-sm">Markets Closed — FedWatch unavailable</span>
                    <span className="text-xs mt-1 opacity-60">ZQ futures require market hours</span>
                </div>
            </Card>
        );
    }

    // ── ALL FIELDS from LIVE network response ──
    const nm = data.next_meeting;
    const rateStr = Array.isArray(data.current_range)
        ? `${data.current_range[0].toFixed(2)}%-${data.current_range[1].toFixed(2)}%`
        : String(data.current_range);

    // Probabilities from next_meeting (VERIFIED: they live inside next_meeting, NOT at root)
    const pCut = nm?.p_cut_25 ?? 0;
    const pHold = nm?.p_hold ?? 0;
    const pHike = nm?.p_hike_25 ?? 0;
    const daysAway = nm?.days_away ?? 0;
    const nextLabel = nm?.label ?? 'Next FOMC';

    // Derive bias
    const bias = getBias(data);
    const bc = biasMap[bias] || biasMap.NEUTRAL;

    // Cumulative cuts through end of rate path
    const lastMeeting = data.rate_path?.[data.rate_path.length - 1];
    const cumulBps = data.total_cuts_bps ?? lastMeeting?.cumulative_bps ?? 0;

    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    <h3 className="card-title text-base">Fed Watch Monitor</h3>
                </div>
                <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(96, 165, 250, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    fontWeight: 600,
                }}>
                    ⚡ LIVE · {data.engine_source || data.source || 'futures'}
                </span>
            </div>

            {/* Current Rate + Next FOMC */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.125rem' }}>
                        Current Rate
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                        {rateStr}
                    </div>
                </div>
                <div style={{
                    textAlign: 'center',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{ fontSize: '0.5625rem', color: '#64748b', textTransform: 'uppercase' }}>Next FOMC</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#e2e8f0' }}>{nextLabel}</div>
                    <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: daysAway <= 7 ? '#f59e0b' : '#60a5fa',
                    }}>
                        {daysAway}d
                    </div>
                </div>
            </div>

            {/* Probability Bars — from next_meeting.p_cut_25 / p_hold / p_hike_25 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                    { label: 'CUT',  pct: pCut,  gradient: 'linear-gradient(90deg, #22c55e, #4ade80)',  glowColor: 'rgba(34,197,94,0.3)' },
                    { label: 'HOLD', pct: pHold, gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',  glowColor: 'rgba(59,130,246,0.3)' },
                    { label: 'HIKE', pct: pHike, gradient: 'linear-gradient(90deg, #ef4444, #f87171)',  glowColor: 'rgba(239,68,68,0.3)' },
                ].map(({ label, pct, gradient, glowColor }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', width: '2.5rem', textAlign: 'right' }}>
                            {label}
                        </span>
                        <div style={{
                            flex: 1,
                            height: '18px',
                            borderRadius: '9px',
                            background: 'rgba(255,255,255,0.04)',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{
                                width: `${Math.max(pct, 1)}%`,
                                height: '100%',
                                borderRadius: '9px',
                                background: gradient,
                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: pct > 50 ? `0 0 12px ${glowColor}` : 'none',
                            }} />
                        </div>
                        <span style={{
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            color: pct > 50 ? '#e2e8f0' : '#64748b',
                            width: '3rem',
                            textAlign: 'right',
                        }}>
                            {pct.toFixed(1)}%
                        </span>
                    </div>
                ))}
            </div>

            {/* Most Likely */}
            <div style={{
                textAlign: 'center',
                padding: '0.375rem',
                borderRadius: '0.375rem',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: '0.75rem',
                fontSize: '0.75rem',
                color: '#94a3b8',
            }}>
                Most Likely: <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    {pHold >= pCut && pHold >= pHike ? 'HOLD' : pCut > pHike ? 'CUT 25bp' : 'HIKE 25bp'}
                </span>
                {' '}at <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
                    {Math.max(pCut, pHold, pHike).toFixed(1)}%
                </span>
            </div>

            {/* Rate Path Table */}
            {data.rate_path && data.rate_path.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem' }}>
                        Rate Path · All FOMC Meetings
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr repeat(3, auto)',
                        gap: '0.125rem 0.75rem',
                        fontSize: '0.6875rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        padding: '0.5rem 0.625rem',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        {['Meeting', 'Hold', 'Cut', 'Cumul'].map(h => (
                            <span key={h} style={{ color: '#475569', fontWeight: 600, fontSize: '0.5625rem', textTransform: 'uppercase', paddingBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {h}
                            </span>
                        ))}
                        {data.rate_path.map((m, i) => {
                            const isNext = i === 0;
                            return [
                                <span key={`l${i}`} style={{ color: isNext ? '#e2e8f0' : '#94a3b8', fontWeight: isNext ? 700 : 400, paddingTop: '0.25rem' }}>
                                    {isNext && '→ '}{m.label} <span style={{ color: '#475569' }}>({m.days_away}d)</span>
                                </span>,
                                <span key={`h${i}`} style={{ color: m.p_hold > 70 ? '#3b82f6' : '#94a3b8', textAlign: 'right', fontWeight: m.p_hold > 70 ? 700 : 400, paddingTop: '0.25rem' }}>
                                    {m.p_hold.toFixed(1)}%
                                </span>,
                                <span key={`c${i}`} style={{ color: m.p_cut_25 > 30 ? '#22c55e' : '#94a3b8', textAlign: 'right', fontWeight: m.p_cut_25 > 30 ? 700 : 400, paddingTop: '0.25rem' }}>
                                    {m.p_cut_25.toFixed(1)}%
                                </span>,
                                <span key={`b${i}`} style={{
                                    color: m.cumulative_bps > 0 ? '#22c55e' : m.cumulative_bps < 0 ? '#ef4444' : '#94a3b8',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                    paddingTop: '0.25rem',
                                }}>
                                    {m.cumulative_bps > 0 ? '+' : ''}{m.cumulative_bps.toFixed(0)}bp
                                </span>,
                            ];
                        })}
                    </div>
                </div>
            )}

            {/* Bias Strip  */}
            <div style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                background: bc.bg,
                border: `1px solid ${bc.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span>{bc.emoji}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: bc.color }}>{bias}</span>
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>·</span>
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{bc.label}</span>
                </div>
                {cumulBps !== 0 && (
                    <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        color: cumulBps > 0 ? '#22c55e' : '#ef4444',
                    }}>
                        EOY: {cumulBps > 0 ? '+' : ''}{cumulBps.toFixed(0)}bp
                    </span>
                )}
            </div>

            <div className="card-footer">
                <span style={{ fontSize: '0.625rem', color: '#475569' }}>
                    ZQ Futures via yfinance · {data.summary}
                </span>
            </div>
        </Card>
    );
}
