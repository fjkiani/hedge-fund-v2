/**
 * TrapZoneLegend — lists active trap zones with conviction bars
 *
 * Renders below the chart. Dumb component — receives traps from ChartContainer.
 */

interface TrapZone {
    type: string;
    price_min: number;
    price_max: number;
    conviction: number;
    narrative: string;
    data_point: string;
    supporting_sources: string[];
    emoji: string;
}

interface TrapZoneLegendProps {
    traps: TrapZone[];
}

const TRAP_STYLES: Record<string, { bg: string; border: string; text: string }> = {
    BEAR_TRAP_COIL: { bg: 'bg-green-500/8', border: 'border-green-500/25', text: 'text-green-400' },
    BULL_TRAP: { bg: 'bg-red-500/8', border: 'border-red-500/25', text: 'text-red-400' },
    CEILING_TRAP: { bg: 'bg-red-500/8', border: 'border-red-500/25', text: 'text-red-400' },
    LIQUIDITY_TRAP: { bg: 'bg-yellow-500/8', border: 'border-yellow-500/25', text: 'text-yellow-400' },
    DEATH_CROSS_TRAP: { bg: 'bg-red-900/20', border: 'border-red-700/30', text: 'text-red-300' },
    WAR_HEADLINE: { bg: 'bg-purple-500/8', border: 'border-purple-500/25', text: 'text-purple-400' },
};

function ConvictionBar({ score }: { score: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className={`h-1.5 w-4 rounded-full transition-all ${i <= score
                            ? score >= 4 ? 'bg-red-500' : score >= 3 ? 'bg-yellow-500' : 'bg-green-500'
                            : 'bg-bg-tertiary'
                        }`}
                />
            ))}
            <span className="ml-1 text-xs text-text-muted font-mono">{score}/5</span>
        </div>
    );
}

export function TrapZoneLegend({ traps }: TrapZoneLegendProps) {
    if (!traps || traps.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider px-1">
                Active Trap Zones
            </div>
            <div className="grid grid-cols-1 gap-2">
                {traps.map((trap, idx) => {
                    const style = TRAP_STYLES[trap.type] ?? { bg: 'bg-bg-tertiary', border: 'border-border-subtle', text: 'text-text-secondary' };
                    const label = trap.type.replace(/_/g, ' ');
                    return (
                        <div
                            key={idx}
                            className={`flex items-start justify-between p-3 rounded-xl border ${style.bg} ${style.border} gap-4`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">{trap.emoji}</span>
                                    <span className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
                                        {label}
                                    </span>
                                    <span className="text-xs font-mono text-text-muted">
                                        ${trap.price_min.toFixed(2)}–${trap.price_max.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-xs text-text-secondary leading-snug truncate">{trap.narrative}</p>
                                {trap.data_point && (
                                    <p className="text-xs text-text-muted mt-0.5 font-mono truncate">{trap.data_point}</p>
                                )}
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {trap.supporting_sources.map((src) => (
                                        <span key={src} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-secondary text-text-muted border border-border-subtle">
                                            {src}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-shrink-0 pt-0.5">
                                <ConvictionBar score={trap.conviction} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
