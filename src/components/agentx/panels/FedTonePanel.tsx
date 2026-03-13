/**
 * FedTonePanel — Fed Officials tone analysis with per-speaker breakdown
 */

import { Card } from '../../ui/Card';
import { ToneBadge } from '../primitives/ToneBadge';
import type { BrainReport } from '../types';

interface FedTonePanelProps {
    report: BrainReport;
}

export function FedTonePanel({ report }: FedTonePanelProps) {
    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    <h3 className="card-title text-base">Fed Officials Tone</h3>
                </div>
                <ToneBadge tone={report.fed_overall_tone} />
            </div>
            {report.fed_tone_summary.length > 0 ? (
                <div className="space-y-2">
                    {report.fed_tone_summary.map((s, i) => (
                        <div key={i} className="p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-text-primary">{s.official}</span>
                                <div className="flex items-center gap-2">
                                    <ToneBadge tone={s.tone} />
                                    <span className="text-xs text-text-muted">{(s.confidence * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="text-xs text-text-secondary leading-relaxed">{s.reasoning}</div>
                            <div className="text-xs text-text-muted mt-1 truncate" title={s.title}>{s.title}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                    <span className="text-2xl mb-2">📡</span>
                    <span className="text-sm">No recent speeches detected</span>
                    <span className="text-xs mt-1">RSS polling federalreserve.gov</span>
                </div>
            )}
            <div className="card-footer">
                <span>Hawks: {report.fed_hawkish_count} / Doves: {report.fed_dovish_count}</span>
            </div>
        </Card>
    );
}
