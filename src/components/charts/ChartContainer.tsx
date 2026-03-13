/**
 * ChartContainer — Smart Orchestrator
 *
 * Owns:
 *   - Symbol state (ticker switching)
 *   - Timeframe state (period/interval)
 *   - Layer visibility state
 *   - API fetching (matrix + OHLC + signals)
 *   - OHLC auto-refresh on intraday timeframes
 *   - Loading / error states
 *
 * Renders:
 *   ChartHeader       → price, alert, context badges
 *   TickerSwitcher    → symbol selector
 *   TimeframeSwitcher → period/interval selector
 *   LayerToggle       → show/hide overlay groups
 *   TradingViewChart  → the rifle (dumb renderer)
 *   SignalEventLog    → scrollable signal feed
 *   TrapZoneLegend    → active traps with conviction bars
 *   StalenessRow      → data freshness indicators
 *
 * Does NOT contain any rendering logic.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chartApi, signalsApi } from '../../lib/api';
import { TradingViewChart, type OHLCBar, type GammaWall, type TrapZoneOverlay, type SignalMarker } from './TradingViewChart';
import { TickerSwitcher } from './TickerSwitcher';
import { TimeframeSwitcher, TIMEFRAMES, type TimeframeOption } from './TimeframeSwitcher';
import { ChartHeader } from './ChartHeader';
import { DecisionStrip } from './DecisionStrip';
import { LayerToggle, DEFAULT_LAYERS, type LayerVisibility } from './LayerToggle';
import { SignalEventLog, type SignalEvent } from './SignalEventLog';
import '../../styles/dashboard-ui.css';

// ── Types matching /charts/{symbol}/matrix response ───────────────────────

interface MatrixResponse {
    symbol: string;
    current_price: number;
    timestamp: string;
    levels: {
        dp_levels: any[];
        gex_walls: any[];
        gamma_flip: number | null;
        max_pain: number | null;
        pivots: Record<string, any>;
        moving_averages: Record<string, { value: number; signal: string }>;
        vwap: number | null;
    };
    traps: any[];
    context: {
        cot_net_spec: number | null;
        cot_signal: string;
        gamma_regime: string;
        vix: number | null;
        vix_regime: string;
        death_cross: boolean;
        alert_level: string;
    };
    staleness: Record<string, any>;
}

interface OHLCResponse {
    symbol: string;
    candles: OHLCBar[];
}

interface SignalsResponse {
    signals: SignalEvent[];
    count: number;
    master_count: number;
    timestamp: string;
}

// ── Staleness indicator ───────────────────────────────────────────────────

function StalenessRow({ staleness }: { staleness: Record<string, any> }) {
    if (!staleness || Object.keys(staleness).length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Data freshness:</span>
            {Object.entries(staleness).map(([src, info]) => (
                <span
                    key={src}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${info.stale
                        ? 'text-red-400 bg-red-500/10 border-red-500/20'
                        : 'text-green-400 bg-green-500/10 border-green-500/20'
                        }`}
                >
                    {src} · {info.age ?? '—'}
                </span>
            ))}
        </div>
    );
}

// ── Error / Loading shells ────────────────────────────────────────────────

function ChartSkeleton({ height }: { height: number }) {
    return (
        <div
            className="w-full rounded-xl bg-bg-tertiary border border-border-subtle animate-pulse"
            style={{ height: `${height}px` }}
        />
    );
}

function ErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-300">
            <span>⚠️ {error}</span>
            <button
                onClick={onRetry}
                className="ml-4 text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
                Retry
            </button>
        </div>
    );
}

// ── Polling config by timeframe ───────────────────────────────────────────

function getOHLCPollInterval(tf: TimeframeOption): number | null {
    // Only poll intraday timeframes — daily/weekly candles don't change mid-session
    switch (tf.label) {
        case '1D': return 30_000;   // 30s — aggressive for 5m candles
        case '5D': return 60_000;   // 60s — 15m candles
        case '1M': return 120_000;  // 2m — hourly candles
        default: return null;     // No polling for 3M/6M/1Y
    }
}

// ── Main Container ────────────────────────────────────────────────────────

const CHART_HEIGHT = 460;
const MATRIX_POLL_MS = 60_000;    // Matrix refreshes every 60s
const SIGNAL_POLL_MS = 60_000;    // Signals refresh every 60s
const DEFAULT_TF = TIMEFRAMES[3]; // 3M default

interface SignalOverlay {
    entry: number;
    target: number;
    stop: number;
    symbol: string;
}

export function ChartContainer() {
    const [symbol, setSymbol] = useState('SPY');
    const [timeframe, setTimeframe] = useState<TimeframeOption>(DEFAULT_TF);
    const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);
    const [activeContextId, setActiveContextId] = useState<string | null>(null);
    const [signalOverlay, setSignalOverlay] = useState<SignalOverlay | null>(null);

    // ── Read signal overlay from URL params (from "Show on Chart" button) ──
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sigEntry = parseFloat(params.get('signal_entry') || '0');
        const sigTarget = parseFloat(params.get('signal_target') || '0');
        const sigStop = parseFloat(params.get('signal_stop') || '0');
        const sigSymbol = params.get('symbol') || '';

        if (sigEntry > 0 || sigTarget > 0 || sigStop > 0) {
            // Use first symbol if comma-separated (SPY,QQQ → SPY)
            const primarySymbol = sigSymbol.split(',')[0] || 'SPY';
            setSymbol(primarySymbol);
            setSignalOverlay({ entry: sigEntry, target: sigTarget, stop: sigStop, symbol: primarySymbol });
            // Clean URL params without reload
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const [matrix, setMatrix] = useState<MatrixResponse | null>(null);
    const [ohlc, setOHLC] = useState<OHLCBar[]>([]);
    const [signals, setSignals] = useState<SignalEvent[]>([]);

    const [matrixLoading, setMatrixLoading] = useState(true);
    const [ohlcLoading, setOHLCLoading] = useState(true);
    const [matrixError, setMatrixError] = useState<string | null>(null);
    const [ohlcError, setOHLCError] = useState<string | null>(null);

    const matrixPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ohlcPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const signalPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch OHLC ────────────────────────────────────────────────────────────
    const fetchOHLC = useCallback(async (showLoading = true) => {
        if (showLoading) setOHLCLoading(true);
        setOHLCError(null);
        try {
            const res = await chartApi.getOHLC(symbol, timeframe.period, timeframe.interval) as OHLCResponse;
            setOHLC(res.candles ?? []);
        } catch (e: any) {
            setOHLCError(e?.message ?? 'Failed to load price data');
        } finally {
            if (showLoading) setOHLCLoading(false);
        }
    }, [symbol, timeframe]);

    // ── Fetch Matrix ──────────────────────────────────────────────────────────
    const fetchMatrix = useCallback(async () => {
        setMatrixError(null);
        try {
            const res = await chartApi.getMatrix(symbol) as MatrixResponse;
            setMatrix(res);
        } catch (e: any) {
            setMatrixError(e?.message ?? 'Matrix unavailable');
        } finally {
            setMatrixLoading(false);
        }
    }, [symbol]);

    // ── Fetch Signals ─────────────────────────────────────────────────────────
    const fetchSignals = useCallback(async () => {
        try {
            const res = await signalsApi.getForSymbol(symbol) as SignalsResponse;
            setSignals(res.signals ?? []);
        } catch {
            // Signals failing is non-critical — don't block the chart
            setSignals([]);
        }
    }, [symbol]);

    // ── On symbol change: reset + fetch all 3 ─────────────────────────────────
    useEffect(() => {
        setMatrix(null);
        setOHLC([]);
        setSignals([]);
        setMatrixLoading(true);
        setOHLCLoading(true);
        fetchMatrix();
        fetchOHLC();
        fetchSignals();

        // Start matrix poll
        if (matrixPollRef.current) clearInterval(matrixPollRef.current);
        matrixPollRef.current = setInterval(fetchMatrix, MATRIX_POLL_MS);

        // Start signal poll
        if (signalPollRef.current) clearInterval(signalPollRef.current);
        signalPollRef.current = setInterval(fetchSignals, SIGNAL_POLL_MS);

        return () => {
            if (matrixPollRef.current) clearInterval(matrixPollRef.current);
            if (signalPollRef.current) clearInterval(signalPollRef.current);
        };
    }, [symbol]);

    // ── On timeframe change: refetch OHLC + reconfigure OHLC polling ──────────
    useEffect(() => {
        fetchOHLC();

        // Set up OHLC auto-refresh for intraday timeframes
        if (ohlcPollRef.current) clearInterval(ohlcPollRef.current);
        const pollMs = getOHLCPollInterval(timeframe);
        if (pollMs) {
            ohlcPollRef.current = setInterval(() => fetchOHLC(false), pollMs);
        }

        return () => {
            if (ohlcPollRef.current) clearInterval(ohlcPollRef.current);
        };
    }, [timeframe, fetchOHLC]);

    // ── Derived chart props from matrix ───────────────────────────────────────
    const baseDpLevels: any[] = (matrix?.levels.dp_levels ?? [])
        .filter(d => d.price > 0)
        .map(d => ({
            price: d.price,
            volume: d.volume ?? 0,
            type: d.type ?? 'BATTLEGROUND',
            strength: d.strength ?? 'WEAK',
            is_live: d.is_live,
            short_pct: d.short_pct,
            bounce_rate: d.bounce_rate,
            touches: d.touches,
        }));

    // Merge signal overlay lines into DP levels for chart rendering
    const signalOverlayLines: any[] = signalOverlay ? [
        signalOverlay.entry > 0 && { price: signalOverlay.entry, volume: 0, type: 'SIGNAL_ENTRY', strength: 'STRONG', is_live: false, short_pct: 0, bounce_rate: 0, touches: 0 },
        signalOverlay.target > 0 && { price: signalOverlay.target, volume: 0, type: 'SIGNAL_TARGET', strength: 'STRONG', is_live: false, short_pct: 0, bounce_rate: 0, touches: 0 },
        signalOverlay.stop > 0 && { price: signalOverlay.stop, volume: 0, type: 'SIGNAL_STOP', strength: 'STRONG', is_live: false, short_pct: 0, bounce_rate: 0, touches: 0 },
    ].filter(Boolean) : [];

    const dpLevels = [...baseDpLevels, ...signalOverlayLines];

    const gammaWalls: GammaWall[] = (matrix?.levels.gex_walls ?? []).map(w => ({
        strike: w.strike,
        gex: w.gex,
        signal: w.signal ?? (w.gex > 0 ? 'RESISTANCE' : 'SUPPORT'),
    }));

    const trapOverlays: TrapZoneOverlay[] = (matrix?.traps ?? []).map(t => ({
        price_min: t.price_min,
        price_max: t.price_max,
        type: t.type,
        conviction: t.conviction,
        emoji: t.emoji ?? '',
    }));

    const pivots = {
        classic: matrix?.levels.pivots?.classic,
    };

    // ── Derived signal markers for chart ──────────────────────────────────────
    const signalMarkers: SignalMarker[] = signals.map(sig => ({
        time: sig.timestamp ? Math.floor(new Date(sig.timestamp).getTime() / 1000) : 0,
        action: sig.action as 'BUY' | 'SELL',
        entry_price: sig.entry_price,
        target_price: sig.target_price,
        stop_price: sig.stop_price,
        confidence: sig.confidence,
        type: sig.type,
        is_master: sig.is_master,
    }));

    return (
        <div className="dashboard-terminal border border-white/10 rounded-2xl mb-8">
            {/* Left Column: Chart & Controls */}
            <div className="dashboard-main flex flex-col gap-4">
                <ChartHeader
                    symbol={symbol}
                    price={matrix?.current_price ?? 0}
                    alertLevel={(matrix?.context.alert_level as any) ?? null}
                    cotSignal={matrix?.context.cot_signal ?? ''}
                    cotNet={matrix?.context.cot_net_spec ?? null}
                    vix={matrix?.context.vix ?? null}
                    vixRegime={matrix?.context.vix_regime ?? ''}
                    gammaRegime={matrix?.context.gamma_regime ?? ''}
                    deathCross={matrix?.context.death_cross ?? false}
                    loading={matrixLoading}
                />

                <div className="flex items-center justify-between flex-wrap gap-3">
                    <TickerSwitcher selected={symbol} onChange={setSymbol} />
                    <TimeframeSwitcher selected={timeframe} onChange={setTimeframe} />
                </div>

                <LayerToggle layers={layers} onChange={setLayers} />

                {/* Chart Container - flex-1 expands to fill space */}
                <div className="flex-1 min-h-[400px] relative">
                    {ohlcError ? (
                        <ErrorBanner error={ohlcError} onRetry={fetchOHLC} />
                    ) : ohlcLoading ? (
                        <ChartSkeleton height={CHART_HEIGHT} />
                    ) : (
                        <TradingViewChart
                            symbol={symbol}
                            data={ohlc}
                            alertLevel={(matrix?.context.alert_level as any) ?? null}
                            dpLevels={layers.dp ? dpLevels : []}
                            gammaWalls={layers.gex ? gammaWalls : []}
                            gammaFlipLevel={layers.gex ? matrix?.levels.gamma_flip : null}
                            vwap={matrix?.levels.vwap}
                            currentPrice={matrix?.current_price}
                            movingAvgs={layers.ma ? matrix?.levels.moving_averages : {}}
                            pivots={layers.pivots ? pivots : {}}
                            traps={layers.traps ? trapOverlays : []}
                            signals={signalMarkers}
                            activeContextId={activeContextId}
                            height={CHART_HEIGHT}
                        />
                    )}
                </div>

                {matrixError && (
                    <ErrorBanner error={`Trap Matrix: ${matrixError}`} onRetry={fetchMatrix} />
                )}

                <StalenessRow staleness={matrix?.staleness ?? {}} />
            </div>

            {/* Right Column: Intelligence & Signals */}
            <div className="dashboard-sidebar">
                <div className="dashboard-sidebar-header text-white tracking-widest bg-black/20 border-b border-white/5">
                    <span className="text-accent-blue mr-2">⚡</span> ALPHA INTELLIGENCE
                </div>
                
                <div className="dashboard-sidebar-content sidebar-scroll relative">
                    {!matrixLoading && (
                        <DecisionStrip 
                            currentPrice={matrix?.current_price ?? 0}
                            matrix={matrix}
                            layers={layers}
                            signals={signals}
                            dpLevels={dpLevels}
                            gammaWalls={gammaWalls}
                            trapOverlays={trapOverlays}
                            pivots={pivots}
                            activeContextId={activeContextId}
                            setActiveContextId={setActiveContextId}
                        />
                    )}
                    
                    {signals.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-xs uppercase tracking-widest text-text-muted mb-4 px-1 border-b border-white/5 pb-2">Recent Signals</h3>
                            <SignalEventLog signals={signals} symbol={symbol} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
