import { HeroSignal } from '../ui/HeroSignal';
import { IntelCard } from '../ui/IntelCard';

interface DecisionStripProps {
    currentPrice: number;
    matrix: any;
    layers: any; // Using any to avoid LayerVisibility strict-type mismatch from parent
    signals: any[];
    dpLevels: any[];
    gammaWalls: any[];
    trapOverlays: any[];
    pivots: any;
    activeContextId: string | null;
    setActiveContextId: (id: string | null) => void;
}

export function DecisionStrip({
    currentPrice,
    matrix,
    layers,
    signals,
    dpLevels,
    gammaWalls,
    trapOverlays,
    pivots,
    activeContextId,
    setActiveContextId,
}: DecisionStripProps) {
    if (!matrix || !currentPrice) return null;

    const toggleContext = (id: string) => {
        setActiveContextId(activeContextId === id ? null : id);
    };

    // ── MASTER SIGNAL BLOCK (The "Prime Directive") ──
    const activeSignal = signals && signals.length > 0 ? signals[0] : null;
    const ctx = matrix.context || {};
    const alertLevel = ctx.alert_level || 'UNKNOWN';
    const isRedAlert = alertLevel.toUpperCase() === 'RED' || alertLevel.toUpperCase() === 'ORANGE';

    // ── DP Data ──
    const liveLevel = dpLevels.find((l: any) => l.is_live);
    const histLevels = dpLevels.filter((l: any) => !l.is_live).sort((a, b) => a.price - b.price);
    const nearestSupport = [...histLevels].reverse().find(l => l.price < currentPrice && l.type === 'SUPPORT');
    const nearestResistance = histLevels.find(l => l.price > currentPrice && l.type === 'RESISTANCE');

    // ── GEX Data ──
    const callWalls = gammaWalls.filter(w => w.gex > 0).sort((a, b) => b.gex - a.gex);
    const putWalls = gammaWalls.filter(w => w.gex < 0).sort((a, b) => a.gex - b.gex);
    const largestCallWall = callWalls.length > 0 ? callWalls[0] : null;
    const largestPutWall = putWalls.length > 0 ? putWalls[0] : null;
    const gexChannelWidth = (largestCallWall && largestPutWall) 
        ? largestCallWall.strike - largestPutWall.strike 
        : null;

    // ── MA Data ──
    const ma200 = matrix.levels?.moving_averages?.MA200_SMA;
    const ma50 = matrix.levels?.moving_averages?.MA50_SMA;

    // ── Pivots Data ──
    const r1 = pivots?.classic?.R1;
    const s1 = pivots?.classic?.S1;

    // ── Traps Data ──
    // Trap logic handled in render map

    return (
        <div className="flex flex-col gap-4">
            
            {/* 1. MASTER SIGNAL BLOCK */}
            {activeSignal ? (
                <HeroSignal
                    action={activeSignal.action as any}
                    symbol={matrix.symbol || 'SPY'}
                    confidence={activeSignal.confidence}
                    entryPrice={activeSignal.entry_price}
                    targetPrice={activeSignal.target_price}
                    stopPrice={activeSignal.stop_price}
                    riskReward={activeSignal.risk_reward_ratio || 0}
                    reasoning={activeSignal.reasoning}
                />
            ) : (
                /* Structural Fallback */
                <IntelCard
                    icon="⚪"
                    title="Structural Heatmap"
                    stat={`ALERT: ${alertLevel}`}
                    description="No strict quantitative edge detected. Market structure dictates prevailing regime."
                    accent={isRedAlert ? 'orange' : 'neutral'}
                    subStats={[
                        { label: 'GAMMA', value: ctx.gamma_regime || 'UNKNOWN' },
                        { label: 'VIX', value: `${ctx.vix?.toFixed(2) || 'N/A'} (${ctx.vix_regime || 'NORMAL'})` },
                        { label: 'COT', value: ctx.cot_signal || 'NEUTRAL' }
                    ]}
                />
            )}

            {/* 2. DYNAMIC LAYER BREAKDOWNS */}
            <div className="flex flex-col gap-3">
                
                {/* ── Dark Pools ── */}
                {layers.dp && liveLevel && (
                    <IntelCard
                        live={true}
                        icon="🏦"
                        title="LIVE DARK POOL"
                        stat={`$${liveLevel.price.toFixed(2)}`}
                        description={`Active ${liveLevel.type.toLowerCase()} wall`}
                        accent={liveLevel.type === 'SUPPORT' ? 'green' : 'red'}
                        subStats={[
                            { label: 'VOL', value: `$${(liveLevel.volume / 1e9).toFixed(1)}B` },
                            { label: 'SHORT', value: `${(liveLevel as any).short_pct}%` }
                        ]}
                        isActive={activeContextId === 'dp-live'}
                        onClick={() => toggleContext('dp-live')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Distance to Price:</strong> {Math.abs(liveLevel.price - currentPrice).toFixed(2)} points</p>
                                <p><strong>Strength:</strong> {liveLevel.strength}</p>
                                <p>Live institutional block trades creating immediate intraday friction.</p>
                            </div>
                        }
                    />
                )}
                {layers.dp && nearestResistance && (
                    <IntelCard
                        icon="🔴"
                        title="HISTORICAL CEILING"
                        stat={`$${nearestResistance.price.toFixed(2)}`}
                        description="Previously rejected touches at this resistance zone."
                        accent="red"
                        subStats={[
                            { label: 'BOUNCE RT', value: `${(nearestResistance as any).bounce_rate}%` }
                        ]}
                        isActive={activeContextId === 'dp-hist-res'}
                        onClick={() => toggleContext('dp-hist-res')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Touches:</strong> {nearestResistance.touches}x historical rejections</p>
                                <p><strong>Strength:</strong> {nearestResistance.strength}</p>
                                <p>Persistent seller supply zone from past trading sessions.</p>
                            </div>
                        }
                    />
                )}
                {layers.dp && nearestSupport && (
                    <IntelCard
                        icon="🟢"
                        title="HISTORICAL FLOOR"
                        stat={`$${nearestSupport.price.toFixed(2)}`}
                        description="Previously bounced touches at this support zone."
                        accent="green"
                        subStats={[
                            { label: 'BOUNCE RT', value: `${(nearestSupport as any).bounce_rate}%` }
                        ]}
                        isActive={activeContextId === 'dp-hist-sup'}
                        onClick={() => toggleContext('dp-hist-sup')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Touches:</strong> {nearestSupport.touches}x historical bounces</p>
                                <p><strong>Strength:</strong> {nearestSupport.strength}</p>
                                <p>Persistent buyer demand zone protecting against structural breakdown.</p>
                            </div>
                        }
                    />
                )}

                {/* ── GEX ── */}
                {layers.gex && largestCallWall && (
                    <IntelCard
                        icon="📈"
                        title="GEX OVERHEAD SUPPLY"
                        stat={`$${largestCallWall.strike.toFixed(2)}`}
                        description="Largest Call Wall. Dealers will hedge against upside pushes into this zone."
                        accent="red"
                        isActive={activeContextId === 'gex-call'}
                        onClick={() => toggleContext('gex-call')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Total Delta Hedging:</strong> ${(largestCallWall.gex / 1e9).toFixed(2)}B per 1% move</p>
                                {gexChannelWidth && <p><strong>Current Channel Width:</strong> {gexChannelWidth.toFixed(2)} points to Put Wall</p>}
                                <p>If broken, can trigger a short squeeze as market makers buy underlying.</p>
                            </div>
                        }
                    />
                )}
                {layers.gex && largestPutWall && (
                    <IntelCard
                        icon="📉"
                        title="GEX DOWNSIDE PROTECTION"
                        stat={`$${largestPutWall.strike.toFixed(2)}`}
                        description="Largest Put Wall. Defines the structural floor against crashes."
                        accent="green"
                        isActive={activeContextId === 'gex-put'}
                        onClick={() => toggleContext('gex-put')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Total Delta Hedging:</strong> ${(Math.abs(largestPutWall.gex) / 1e9).toFixed(2)}B per 1% move</p>
                                {gexChannelWidth && <p><strong>Current Channel Width:</strong> {gexChannelWidth.toFixed(2)} points to Call Wall</p>}
                                <p>If broken, delta hedging accelerates downward pressure (gamma trap).</p>
                            </div>
                        }
                    />
                )}

                {/* ── MAs ── */}
                {layers.ma && ma200 && (
                    <IntelCard
                        icon="📊"
                        title="MACRO TREND (200 SMA)"
                        stat={<span className={currentPrice > ma200.value ? 'text-accent-green font-mono stat-lg' : 'text-accent-red font-mono stat-lg'}>
                            {currentPrice > ma200.value ? 'ABOVE' : 'BELOW'} 
                            <span className="text-text-primary ml-2">${ma200.value.toFixed(2)}</span>
                        </span>}
                        description="Price positioning relative to the 200 SMA macro trend."
                        accent="neutral"
                        isActive={activeContextId === 'ma-200'}
                        onClick={() => toggleContext('ma-200')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Distance to 200 SMA:</strong> {((currentPrice - ma200.value) / ma200.value * 100).toFixed(2)}%</p>
                                <p><strong>Regime:</strong> {currentPrice > ma200.value ? 'Bullish Macro' : 'Bearish Macro'}</p>
                            </div>
                        }
                    />
                )}
                {layers.ma && ma50 && (
                    <IntelCard
                        icon="📉"
                        title="MEDIUM TREND (50 SMA)"
                        stat={<span className={currentPrice > ma50.value ? 'text-accent-green font-mono stat-lg' : 'text-accent-red font-mono stat-lg'}>
                            {currentPrice > ma50.value ? 'ABOVE' : 'BELOW'} 
                            <span className="text-text-primary ml-2">${ma50.value.toFixed(2)}</span>
                        </span>}
                        description="Price positioning relative to the 50 SMA medium trend."
                        accent="neutral"
                        isActive={activeContextId === 'ma-50'}
                        onClick={() => toggleContext('ma-50')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Distance to 50 SMA:</strong> {((currentPrice - ma50.value) / ma50.value * 100).toFixed(2)}%</p>
                                <p><strong>Regime:</strong> {currentPrice > ma50.value ? 'Bullish Medium' : 'Bearish Medium'}</p>
                            </div>
                        }
                    />
                )}

                {/* ── Pivots ── */}
                {layers.pivots && r1 && (
                    <IntelCard
                        icon="🎯"
                        title="R1 RESISTANCE"
                        stat={`$${r1.toFixed(2)}`}
                        description="Intraday upside target locked. Expect turbulence here."
                        accent="red"
                        isActive={activeContextId === 'pivot-r1'}
                        onClick={() => toggleContext('pivot-r1')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Distance to R1:</strong> {(r1 - currentPrice).toFixed(2)} points</p>
                                <p>Based on previous session OHLC Volatility.</p>
                            </div>
                        }
                    />
                )}
                {layers.pivots && s1 && (
                    <IntelCard
                        icon="🎯"
                        title="S1 SUPPORT"
                        stat={`$${s1.toFixed(2)}`}
                        description="Intraday downside target locked. Look for bounces."
                        accent="green"
                        isActive={activeContextId === 'pivot-s1'}
                        onClick={() => toggleContext('pivot-s1')}
                        expandedContent={
                            <div className="text-sm text-text-muted space-y-2">
                                <p><strong>Distance to S1:</strong> {(currentPrice - s1).toFixed(2)} points</p>
                                <p>Based on previous session OHLC Volatility.</p>
                            </div>
                        }
                    />
                )}

                {/* ── Traps ── */}
                {layers.traps && trapOverlays.map((trap, idx) => {
                    const trapId = `trap-${trap.type}-${idx}`;
                    const isInside = currentPrice >= trap.price_min && currentPrice <= trap.price_max;
                    return (
                        <IntelCard
                            key={trapId}
                            icon={trap.emoji || '⚠️'}
                            title={`${isInside ? 'ACTIVE TRAP' : 'TRAP ZONE'}: ${trap.type.replace(/_/g, ' ')}`}
                            stat={isInside ? 'CAUTION' : 'DORMANT'}
                            description={`Zone: $${trap.price_min.toFixed(2)} - $${trap.price_max.toFixed(2)}`}
                            accent={isInside ? 'orange' : 'neutral'}
                            isActive={activeContextId === trapId}
                            onClick={() => toggleContext(trapId)}
                            expandedContent={
                                <div className="text-sm text-text-muted space-y-2 mt-2">
                                    <div className="flex items-center gap-1 mb-2">
                                        <span className="text-[10px] uppercase tracking-widest text-text-tertiary">Conviction:</span>
                                        <div className="flex gap-1 ml-2">
                                            {[1, 2, 3, 4, 5].map(v => (
                                                <div 
                                                    key={v} 
                                                    className={`w-3 h-1.5 rounded-sm ${v <= trap.conviction ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-white/10'}`} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p>Algorithmic signature matching historical {trap.type.replace(/_/g, ' ')} formations.</p>
                                    <p><strong>Width:</strong> {(trap.price_max - trap.price_min).toFixed(2)} pts</p>
                                </div>
                            }
                        />
                    );
                })}

            </div>
        </div>
    );
}
