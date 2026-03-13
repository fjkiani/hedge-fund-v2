/**
 * ConvictionHeader — Divergence gauge + conviction reasons + scan metadata
 */

import { Card } from '../../ui/Card';
import { BoostGauge } from '../primitives/BoostGauge';
import { ToneBadge } from '../primitives/ToneBadge';
import type { BrainReport } from '../types';

interface ConvictionHeaderProps {
    report: BrainReport;
    loading: boolean;
    lastRefresh: Date | null;
    onRefresh: () => void;
}

export function ConvictionHeader({ report, loading, lastRefresh, onRefresh }: ConvictionHeaderProps) {
    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-3">
                    <h2 className="card-title">🧠 Agent X — Hidden Conviction Intelligence</h2>
                    <ToneBadge tone={report.fed_overall_tone} />
                </div>
                <div className="flex items-center gap-3">
                    {report.scan_time_seconds && (
                        <span className="text-xs text-text-muted">{report.scan_time_seconds}s scan</span>
                    )}
                    {lastRefresh && (
                        <span className="text-xs text-text-muted">{lastRefresh.toLocaleTimeString()}</span>
                    )}
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="px-2 py-1 text-xs bg-bg-tertiary rounded hover:bg-bg-primary transition disabled:opacity-50"
                    >
                        {loading ? '⏳' : '🔄'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 p-4">
                <div className="flex justify-center">
                    <BoostGauge value={report.divergence_boost} />
                </div>

                <div className="col-span-2 space-y-2">
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Conviction Signals
                    </div>
                    {report.reasons.length > 0 ? (
                        report.reasons.map((r, i) => (
                            <div
                                key={i}
                                className="flex items-start gap-2 p-2 bg-bg-tertiary rounded-lg border border-border-subtle text-sm text-text-secondary"
                            >
                                <span className="mt-0.5 text-accent-purple">→</span>
                                <span>{r}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-text-muted text-sm italic">No conviction signals detected</div>
                    )}
                </div>
            </div>
        </Card>
    );
}
