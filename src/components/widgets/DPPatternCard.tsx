/**
 * DPPatternCard — Learned Dark Pool Patterns Table
 *
 * Displays the 13 learned patterns from dp_learning.db with:
 * - Pattern name, sample count, bounce/break/fade rates
 * - Visual bounce rate bar
 * - Sorted by sample count (most data first)
 *
 * Props:
 *   patterns  → Array from /dp/patterns endpoint
 *   loading   → Loading state
 */

interface DPPattern {
    pattern_name: string;
    total_samples: number;
    bounce_count: number;
    break_count: number;
    fade_count: number;
    bounce_rate: number;
    break_rate: number;
    fade_rate: number;
    last_updated: string;
}

interface DPPatternCardProps {
    patterns: DPPattern[];
    loading?: boolean;
}

function PatternBar({ bounceRate }: { bounceRate: number }) {
    const color =
        bounceRate >= 90 ? '#00ff88' :
            bounceRate >= 75 ? '#00d4ff' :
                bounceRate >= 60 ? '#ffd700' :
                    '#ff3366';

    return (
        <div className="relative w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
            <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{ width: `${bounceRate}%`, backgroundColor: color }}
            />
        </div>
    );
}

function formatPatternName(name: string): string {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace('Vol ', 'Vol ')
        .replace('Plus', '+');
}

export function DPPatternCard({ patterns, loading }: DPPatternCardProps) {
    if (loading) {
        return (
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-subtle animate-pulse">
                <div className="h-4 bg-bg-tertiary rounded w-40 mb-3" />
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-6 bg-bg-tertiary rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (!patterns || patterns.length === 0) {
        return (
            <div className="p-4 rounded-xl bg-bg-secondary border border-border-subtle">
                <span className="text-text-muted text-sm">No learned patterns available</span>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-bg-secondary border border-border-subtle overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">🧠 Learned Patterns</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-purple/15 text-accent-purple border border-accent-purple/20">
                        {patterns.length}
                    </span>
                </div>
                <span className="text-[10px] text-text-muted font-mono">
                    {patterns.reduce((sum, p) => sum + p.total_samples, 0).toLocaleString()} total samples
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border-subtle bg-bg-primary/50">
                            <th className="text-left px-4 py-2 font-medium text-text-muted">Pattern</th>
                            <th className="text-right px-3 py-2 font-medium text-text-muted">Samples</th>
                            <th className="text-right px-3 py-2 font-medium text-text-muted">Bounce%</th>
                            <th className="text-right px-3 py-2 font-medium text-text-muted">Break%</th>
                            <th className="w-24 px-3 py-2 font-medium text-text-muted">Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patterns.map((p) => (
                            <tr key={p.pattern_name} className="border-b border-border-subtle/50 hover:bg-bg-hover/50 transition-colors">
                                <td className="px-4 py-2 font-mono text-text-primary">
                                    {formatPatternName(p.pattern_name)}
                                </td>
                                <td className="text-right px-3 py-2 text-text-secondary font-mono">
                                    {p.total_samples}
                                </td>
                                <td className="text-right px-3 py-2 font-mono" style={{
                                    color: p.bounce_rate >= 90 ? '#00ff88' :
                                        p.bounce_rate >= 75 ? '#00d4ff' :
                                            p.bounce_rate >= 60 ? '#ffd700' : '#ff3366'
                                }}>
                                    {p.bounce_rate.toFixed(1)}%
                                </td>
                                <td className="text-right px-3 py-2 text-accent-red/80 font-mono">
                                    {p.break_rate.toFixed(1)}%
                                </td>
                                <td className="px-3 py-2">
                                    <PatternBar bounceRate={p.bounce_rate} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
