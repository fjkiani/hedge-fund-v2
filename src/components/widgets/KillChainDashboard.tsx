/**
 * 🐺 Kill Chain Dashboard — Mars Rules MVP
 * 
 * Minimal Viable Proof:
 * - Triple Confluence Status (COT + GEX + DVR)
 * - Real-time Signal Log (Activations / Deactivations)
 * - P&L Tracking for active weapon
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { killchainApi } from '../../lib/api';

interface KillChainSignal {
    timestamp: string;
    type: 'CHECK' | 'ACTIVATION' | 'DEACTIVATION';
    spy_price: number;
    cot_specs_net: number;
    gex_vix_ratio: number;
    dvr_ratio: number;
    triple_active: boolean;
    layers_active: number;
    layers_total: number;
    pnl_percent?: number;
    entry_price?: number;
    exit_price?: number;
}

interface KillChainMonitorResponse {
    total_checks: number;
    activations: number;
    current_state: KillChainSignal;
    history: KillChainSignal[];
}

export function KillChainDashboard() {
    const [data, setData] = useState<KillChainMonitorResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await killchainApi.monitor() as KillChainMonitorResponse;
            setData(res);
            setError(null);
            setLastRefresh(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to fetch kill chain monitor');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // 1 min refresh
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading && !data) {
        return (
            <Card className="border-border-default bg-bg-secondary">
                <div className="p-8 text-center animate-pulse text-text-muted font-mono">
                    🛰️ SCANNING ZETA CHANNELS...
                </div>
            </Card>
        );
    }

    if (error && !data) {
        return (
            <Card className="border-red-500/50 bg-red-500/5">
                <div className="p-4 flex justify-between items-center text-red-400 font-mono text-sm">
                    <span>❌ SIGNAL LOST: {error}</span>
                    <button onClick={fetchData} className="px-2 py-1 bg-red-500/20 rounded hover:bg-red-500/30">RETRY</button>
                </div>
            </Card>
        );
    }

    if (!data) return null;

    const { history } = data;
    const current_state = data.current_state || {
        cot_specs_net: 0,
        gex_vix_ratio: 0,
        dvr_ratio: 0,
        triple_active: false,
        layers_active: 0,
        layers_total: 3,
        spy_price: 0,
        pnl_percent: 0,
        entry_price: 0,
        timestamp: new Date().toISOString(),
        type: 'CHECK' as const,
    };
    const isArmed = current_state.triple_active || false;
    // Safe numeric accessors — API can return undefined fields
    const cotNet = current_state.cot_specs_net ?? 0;
    const gexRatio = current_state.gex_vix_ratio ?? 0;
    const dvrRatio = current_state.dvr_ratio ?? 0;
    const spyPrice = current_state.spy_price ?? 0;
    const pnl = current_state.pnl_percent ?? 0;
    const entryPrice = current_state.entry_price ?? 0;

    return (
        <Card className={`border-2 transition-colors duration-500 ${isArmed ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-border-default'}`}>
            {/* 🔱 Header: Weapon Status */}
            <div className={`p-4 flex justify-between items-center ${isArmed ? 'bg-green-500/10' : 'bg-bg-tertiary shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tighter text-text-primary">🔱 KILL CHAIN ENGINE</h2>
                    <Badge variant={isArmed ? 'bullish' : 'neutral'} className="text-sm px-3 py-1">
                        {isArmed ? '🔥 ARMED - TRIPLE CONFLUENCE' : '⚪ WAITING - SINGLE/DOUBLE'}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 font-mono text-xs text-text-muted">
                    <span>CHECKS: {data.total_checks}</span>
                    <span>STRIKES: {data.activations}</span>
                    <span>{lastRefresh?.toLocaleTimeString()}</span>
                </div>
            </div>

            {/* 🛡️ Layer Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 border-y border-border-subtle bg-bg-primary">
                {/* COT LAYER */}
                <div className="p-4 border-r border-border-subtle hover:bg-bg-tertiary transition cursor-help">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Layer 1: COT Divergence</span>
                        <span className={cotNet < 0 ? 'text-green-400' : 'text-text-muted'}>{cotNet < 0 ? '✅' : '⚪'}</span>
                    </div>
                    <div className="text-lg font-bold text-text-primary">
                        {(cotNet / 1000).toFixed(0)}k <span className="text-xs text-text-secondary font-normal italic">Specs Net</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">Goal: Specs Net {'<'} 0 (Crowded Short)</div>
                </div>

                {/* GEX LAYER */}
                <div className="p-4 border-r border-border-subtle hover:bg-bg-tertiary transition cursor-help">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Layer 2: GEX Regime</span>
                        <span className={gexRatio > 1 ? 'text-green-400' : 'text-text-muted'}>{gexRatio > 1 ? '✅' : '⚪'}</span>
                    </div>
                    <div className="text-lg font-bold text-text-primary">
                        {gexRatio.toFixed(3)} <span className="text-xs text-text-secondary font-normal italic">VIX/VIX3M</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">Goal: Ratio {'<'} 1.0 (Positive GEX/Contango)</div>
                    <div className="text-[8px] text-red-400 italic font-mono mt-0.5">*VIX/VIX3M reversed in code to match Zeta protocol</div>
                </div>

                {/* DVR LAYER */}
                <div className="p-4 hover:bg-bg-tertiary transition cursor-help">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Layer 3: Sell Volume (DVR)</span>
                        <span className={dvrRatio > 0.55 ? 'text-green-400' : 'text-text-muted'}>{dvrRatio > 0.55 ? '✅' : '⚪'}</span>
                    </div>
                    <div className="text-lg font-bold text-text-primary">
                        {(dvrRatio * 100).toFixed(1)}% <span className="text-xs text-text-secondary font-normal italic">Down-Vol Ratio</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">Goal: DVR {'>'} 55% (Panic Selling)</div>
                </div>
            </div>

            {/* 📈 Active Signal P&L (if armed) */}
            {isArmed && (
                <div className="p-6 bg-green-500/5 flex flex-col items-center justify-center border-b border-green-500/20">
                    <div className="text-sm font-bold text-green-400 tracking-widest uppercase mb-1">ACTIVE WEAPON P&L</div>
                    <div className={`text-5xl font-black tracking-tighter ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                    </div>
                    <div className="flex gap-4 mt-2 text-xs font-mono text-text-muted">
                        <span>ENTRY: ${entryPrice.toFixed(2)}</span>
                        <span>SPOT: ${spyPrice.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* 📜 Kill Log (Log of strikes and checks) */}
            <div className="p-0 overflow-hidden">
                <div className="px-4 py-2 bg-bg-tertiary border-b border-border-subtle flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase">ZETA SIGNAL LOG (LATEST 20)</span>
                    <span className="text-[10px] text-text-muted italic">Polling every 30min on Render hub</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto font-mono text-[11px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-bg-secondary text-text-muted border-b border-border-subtle">
                            <tr>
                                <th className="p-2 font-normal">TIME</th>
                                <th className="p-2 font-normal">ACTION</th>
                                <th className="p-2 font-normal">PRICE</th>
                                <th className="p-2 font-normal">LAYERS</th>
                                <th className="p-2 font-normal">RESULT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {[...history].reverse().map((sig, idx) => {
                                const isAct = sig.type === 'ACTIVATION';
                                const isDeact = sig.type === 'DEACTIVATION';
                                return (
                                    <tr key={idx} className={`${isAct ? 'bg-green-500/10 text-green-300' : isDeact ? 'bg-red-500/10 text-red-300' : 'text-text-muted hover:bg-bg-tertiary'}`}>
                                        <td className="p-2 whitespace-nowrap">{new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="p-2 font-bold">{sig.type}</td>
                                        <td className="p-2">${(sig.spy_price ?? 0).toFixed(2)}</td>
                                        <td className="p-2">{sig.layers_active}/{sig.layers_total}</td>
                                        <td className="p-2">
                                            {isDeact ? (
                                                <span className={`font-bold ${(sig.pnl_percent ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {(sig.pnl_percent ?? 0) >= 0 ? '+' : ''}{(sig.pnl_percent ?? 0).toFixed(2)}%
                                                </span>
                                            ) : sig.triple_active ? '🔥 ARMED' : 'WAITING'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 💣 CPI STRIKE ALERT */}
            <div className="p-3 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="animate-ping w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">NEXT PRIMARY TARGET: US CONSUMER PRICE INDEX (CPI)</span>
                </div>
                <div className="text-xs font-mono text-red-300">
                    TOMORROW 08:30:00 ET
                </div>
            </div>
        </Card>
    );
}
