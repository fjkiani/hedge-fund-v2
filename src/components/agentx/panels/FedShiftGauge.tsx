/**
 * FedShiftGauge — Visual tug-of-war between hawks and doves
 * Signal: One glance = "Fed leaning hawkish → bonds down, tech down"
 */

import { Card } from '../../ui/Card';

interface Props {
    hawkishCount: number;
    dovishCount: number;
    overallTone: string;
}

export function FedShiftGauge({ hawkishCount, dovishCount, overallTone }: Props) {
    const total = hawkishCount + dovishCount || 1;
    const hawkPct = (hawkishCount / total) * 100;
    const dovePct = (dovishCount / total) * 100;

    const toneColor = overallTone === 'HAWKISH'
        ? '#ef4444'
        : overallTone === 'DOVISH'
            ? '#22c55e'
            : '#94a3b8';

    const toneEmoji = overallTone === 'HAWKISH' ? '🦅' : overallTone === 'DOVISH' ? '🕊️' : '⚖️';
    const toneLabel = overallTone === 'HAWKISH'
        ? 'Rates up pressure • Tech/Growth risk • Bonds sell'
        : overallTone === 'DOVISH'
            ? 'Rate cut momentum • Risk-on rally • Bonds bid'
            : 'No clear direction • Watch next speech';

    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⚖️</span>
                    <h3 className="card-title text-base">Fed Tone Shift</h3>
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: toneColor,
                }}>
                    {toneEmoji} {overallTone}
                </span>
            </div>

            {/* Gauge bar */}
            <div style={{ padding: '0.5rem 0' }}>
                <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                        🦅 HAWKISH ({hawkishCount})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>
                        DOVISH ({dovishCount}) 🕊️
                    </span>
                </div>

                <div style={{
                    height: '12px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div style={{
                        width: `${hawkPct}%`,
                        background: 'linear-gradient(90deg, #ef4444, #f97316)',
                        borderRadius: '6px 0 0 6px',
                        transition: 'width 0.6s ease',
                        minWidth: hawkishCount > 0 ? '8px' : '0',
                    }} />
                    <div style={{
                        width: `${dovePct}%`,
                        background: 'linear-gradient(90deg, #22c55e, #10b981)',
                        borderRadius: '0 6px 6px 0',
                        transition: 'width 0.6s ease',
                        minWidth: dovishCount > 0 ? '8px' : '0',
                    }} />
                </div>
            </div>

            {/* Market implication */}
            <div style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                background: `${toneColor}10`,
                border: `1px solid ${toneColor}25`,
                fontSize: '0.75rem',
                color: toneColor,
                textAlign: 'center',
                fontWeight: 500,
            }}>
                {toneLabel}
            </div>
        </Card>
    );
}
