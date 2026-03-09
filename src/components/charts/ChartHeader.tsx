/**
 * ChartHeader — symbol, price, change, alert badge, COT/VIX context
 *
 * Reads from MatrixState. No API calls — data flows in from ChartContainer.
 */

interface ChartHeaderProps {
    symbol: string;
    price: number;
    alertLevel: 'RED' | 'YELLOW' | 'GREEN' | null;
    cotSignal: string;
    cotNet: number | null;
    vix: number | null;
    vixRegime: string;
    gammaRegime: string;
    deathCross: boolean;
    loading: boolean;
}

const ALERT_CONFIG = {
    RED: { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500', label: '🔴 RED ALERT' },
    YELLOW: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400', dot: 'bg-yellow-400', label: '🟡 ELEVATED' },
    GREEN: { bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-400', dot: 'bg-green-500', label: '🟢 CLEAR' },
};

export function ChartHeader({
    symbol, price, alertLevel, cotSignal, cotNet,
    vix, vixRegime, gammaRegime, deathCross, loading
}: ChartHeaderProps) {
    const alert = alertLevel ? ALERT_CONFIG[alertLevel] : null;

    return (
        <div className="flex items-start justify-between flex-wrap gap-3">
            {/* Left: Symbol + Price */}
            <div className="flex items-baseline gap-3">
                <h2 className="text-2xl font-mono font-bold text-text-primary tracking-tight">
                    {symbol}
                </h2>
                {loading ? (
                    <div className="h-7 w-24 bg-bg-tertiary rounded animate-pulse" />
                ) : price > 0 ? (
                    <span className="text-xl font-mono text-text-secondary">
                        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                ) : null}
                {deathCross && (
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                        ☠️ DEATH CROSS
                    </span>
                )}
            </div>

            {/* Right: Badges */}
            <div className="flex items-center flex-wrap gap-2">
                {/* Alert level */}
                {alert && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${alert.bg} ${alert.border} ${alert.text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${alert.dot}`} />
                        {alert.label}
                    </div>
                )}

                {/* COT signal */}
                {cotSignal && (
                    <div className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300">
                        COT: {cotSignal.replace(/_/g, ' ')}
                        {cotNet != null && (
                            <span className="ml-1 opacity-70">
                                ({cotNet > 0 ? '+' : ''}{cotNet.toLocaleString()})
                            </span>
                        )}
                    </div>
                )}

                {/* VIX */}
                {vix != null && (
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono border ${vixRegime === 'FEAR' ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                            vixRegime === 'ELEVATED' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' :
                                'bg-green-500/10 border-green-500/30 text-green-300'
                        }`}>
                        VIX {vix.toFixed(1)} · {vixRegime}
                    </div>
                )}

                {/* GEX */}
                {gammaRegime && gammaRegime !== 'UNKNOWN' && (
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono border ${gammaRegime === 'NEGATIVE'
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                            : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                        }`}>
                        GEX {gammaRegime}
                    </div>
                )}
            </div>
        </div>
    );
}
