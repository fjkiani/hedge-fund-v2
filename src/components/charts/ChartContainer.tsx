/**
 * ChartContainer — Smart Orchestrator
 *
 * Owns:
 *   - Symbol state (ticker switching)
 *   - Timeframe state (period/interval)
 *   - API fetching (matrix + OHLC)
 *   - Loading / error states
 *
 * Renders:
 *   ChartHeader     → price, alert, context badges
 *   TickerSwitcher  → symbol selector
 *   TimeframeSwitcher → period/interval selector
 *   TradingViewChart  → the rifle (dumb renderer)
 *   TrapZoneLegend    → active traps with conviction bars
 *
 * Does NOT contain any rendering logic.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chartApi } from '../../lib/api';
import { TradingViewChart, type OHLCBar, type DPLevel, type GammaWall, type TrapZoneOverlay } from './TradingViewChart';
import { TickerSwitcher } from './TickerSwitcher';
import { TimeframeSwitcher, TIMEFRAMES, type TimeframeOption } from './TimeframeSwitcher';
import { ChartHeader } from './ChartHeader';
import { TrapZoneLegend } from './TrapZoneLegend';

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

// ── Staleness indicator (small sub-component) ─────────────────────────────

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

// ── Error / Loading shells ─────────────────────────────────────────────────

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

// ── Main Container ─────────────────────────────────────────────────────────

const CHART_HEIGHT = 460;
const POLL_INTERVAL_MS = 60_000; // refresh matrix every 60s
const DEFAULT_TF = TIMEFRAMES[3]; // 3M default

export function ChartContainer() {
    const [symbol, setSymbol] = useState('SPY');
    const [timeframe, setTimeframe] = useState<TimeframeOption>(DEFAULT_TF);

    const [matrix, setMatrix] = useState<MatrixResponse | null>(null);
    const [ohlc, setOHLC] = useState<OHLCBar[]>([]);

    const [matrixLoading, setMatrixLoading] = useState(true);
    const [ohlcLoading, setOHLCLoading] = useState(true);
    const [matrixError, setMatrixError] = useState<string | null>(null);
    const [ohlcError, setOHLCError] = useState<string | null>(null);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch OHLC (triggered by symbol + timeframe) ──────────────────────────
    const fetchOHLC = useCallback(async () => {
        setOHLCLoading(true);
        setOHLCError(null);
        try {
            const res = await chartApi.getOHLC(symbol, timeframe.period, timeframe.interval) as OHLCResponse;
            setOHLC(res.candles ?? []);
        } catch (e: any) {
            setOHLCError(e?.message ?? 'Failed to load price data');
        } finally {
            setOHLCLoading(false);
        }
    }, [symbol, timeframe]);

    // ── Fetch Matrix (triggered by symbol, then polled) ───────────────────────
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

    // ── On symbol change: reset + fetch both ─────────────────────────────────
    useEffect(() => {
        setMatrix(null);
        setOHLC([]);
        setMatrixLoading(true);
        setOHLCLoading(true);
        fetchMatrix();
        fetchOHLC();

        // Poll matrix every 60s (OHLC doesn't need polling for daily/weekly)
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(fetchMatrix, POLL_INTERVAL_MS);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [symbol]);

    // ── On timeframe change: only refetch OHLC ────────────────────────────────
    useEffect(() => {
        fetchOHLC();
    }, [timeframe]);

    // ── Derived chart props from matrix ──────────────────────────────────────
    const dpLevels: DPLevel[] = (matrix?.levels.dp_levels ?? [])
        .filter(d => d.price > 0)
        .map(d => ({
            price: d.price,
            volume: d.volume ?? 0,
            type: d.type ?? 'BATTLEGROUND',
            strength: d.strength ?? 'WEAK',
        }));

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

    return (
        <div className="flex flex-col gap-4 bg-bg-primary rounded-2xl border border-border-subtle p-4">

            {/* Row 1: Header */}
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

            {/* Row 2: Ticker + Timeframe controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <TickerSwitcher selected={symbol} onChange={setSymbol} />
                <TimeframeSwitcher selected={timeframe} onChange={setTimeframe} />
            </div>

            {/* Row 3: Chart */}
            {ohlcError ? (
                <ErrorBanner error={ohlcError} onRetry={fetchOHLC} />
            ) : ohlcLoading ? (
                <ChartSkeleton height={CHART_HEIGHT} />
            ) : (
                <TradingViewChart
                    symbol={symbol}
                    data={ohlc}
                    alertLevel={(matrix?.context.alert_level as any) ?? null}
                    dpLevels={dpLevels}
                    gammaWalls={gammaWalls}
                    gammaFlipLevel={matrix?.levels.gamma_flip}
                    vwap={matrix?.levels.vwap}
                    currentPrice={matrix?.current_price}
                    movingAvgs={matrix?.levels.moving_averages}
                    pivots={pivots}
                    traps={trapOverlays}
                    height={CHART_HEIGHT}
                />
            )}

            {/* Row 4: Matrix error */}
            {matrixError && (
                <ErrorBanner error={`Trap Matrix: ${matrixError}`} onRetry={fetchMatrix} />
            )}

            {/* Row 5: Trap zone legend */}
            <TrapZoneLegend traps={matrix?.traps ?? []} />

            {/* Row 6: Staleness row */}
            <StalenessRow staleness={matrix?.staleness ?? {}} />

        </div>
    );
}
