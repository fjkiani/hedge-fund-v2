/**
 * TradingViewChart — The Rifle
 *
 * Dumb renderer. Owns:
 *   - Candlestick series
 *   - Volume histogram
 *   - All price line overlays (DP levels, gamma flip, VWAP, MAs, pivots, traps)
 *
 * Does NOT fetch data. Does NOT own state beyond chart lifecycle.
 * All data flows in via props. Chart rebuilds when key changes (symbol/timeframe).
 *
 * Props contract:
 *   data        → OHLCV candles from /charts/{symbol}/ohlc
 *   dpLevels    → Dark pool levels (price, type, strength)
 *   gammaWalls  → GEX walls (strike, gex, signal)
 *   gammaFlip   → Gamma flip price
 *   vwap        → VWAP
 *   movingAvgs  → MA50/100/200 SMA+EMA values + signals
 *   pivots      → Classic/Fib/Camarilla pivot sets
 *   traps       → Classified trap zones (for zone shading)
 *   alertLevel  → Border color
 */

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';

// ── Types ──────────────────────────────────────────────────────────────────

export interface OHLCBar {
  time: number; // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DPLevel {
  price: number;
  volume: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'BATTLEGROUND';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export interface GammaWall {
  strike: number;
  gex: number;
  signal: 'SUPPORT' | 'RESISTANCE';
}

export interface MALevel {
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
}

export interface PivotSet {
  P: number;
  R1: number; R2: number; R3: number;
  S1: number; S2: number; S3: number;
  R4?: number; S4?: number;
}

export interface TrapZoneOverlay {
  price_min: number;
  price_max: number;
  type: string;
  conviction: number;
  emoji: string;
}

export interface TradingViewChartProps {
  // Core
  symbol?: string;
  data?: OHLCBar[];
  alertLevel?: 'GREEN' | 'YELLOW' | 'RED' | null;

  // Overlays
  dpLevels?: DPLevel[];
  gammaWalls?: GammaWall[];
  gammaFlipLevel?: number | null;
  vwap?: number | null;
  currentPrice?: number;

  // MA lines
  movingAvgs?: Record<string, MALevel>; // key: "MA200_SMA", etc.

  // Pivot lines
  pivots?: {
    classic?: PivotSet;
    fibonacci?: PivotSet;
    camarilla?: PivotSet;
  };

  // Trap zone overlays (midpoint line per trap)
  traps?: TrapZoneOverlay[];

  height?: number;
}

// ── MA line config ────────────────────────────────────────────────────────

const MA_CONFIG: Record<string, { color: string; style: LineStyle; width: number }> = {
  MA200_SMA: { color: '#ff3366', style: LineStyle.Solid, width: 2 },
  MA200_EMA: { color: '#ff6699', style: LineStyle.Dashed, width: 2 },
  MA100_SMA: { color: '#ff8c00', style: LineStyle.Solid, width: 1 },
  MA100_EMA: { color: '#ffb347', style: LineStyle.Dashed, width: 1 },
  MA50_SMA: { color: '#3399ff', style: LineStyle.Solid, width: 1 },
  MA50_EMA: { color: '#66b2ff', style: LineStyle.Dashed, width: 1 },
};

const TRAP_COLORS: Record<string, string> = {
  BEAR_TRAP_COIL: '#00ff88',
  BULL_TRAP: '#ff3366',
  CEILING_TRAP: '#ff3366',
  LIQUIDITY_TRAP: '#ffd700',
  DEATH_CROSS_TRAP: '#ff0000',
  WAR_HEADLINE: '#a855f7',
};

// ── Component ─────────────────────────────────────────────────────────────

export function TradingViewChart({
  symbol,
  data = [],
  alertLevel,
  dpLevels = [],
  gammaWalls = [],
  gammaFlipLevel,
  vwap,
  currentPrice,
  movingAvgs = {},
  pivots = {},
  traps = [],
  height = 460,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const linesRef = useRef<any[]>([]);
  const [ready, setReady] = useState(false);

  // ── Init chart (once per symbol/height) ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#08080f' },
        textColor: '#8888a0',
      },
      grid: {
        vertLines: { color: '#1a1a28' },
        horzLines: { color: '#1a1a28' },
      },
      width: containerRef.current.clientWidth,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1a1a28',
      },
      rightPriceScale: {
        borderColor: '#1a1a28',
        scaleMargins: { top: 0.08, bottom: 0.15 },
      },
      crosshair: {
        vertLine: { color: '#3a3a5a', width: 1, style: LineStyle.Dashed },
        horzLine: { color: '#3a3a5a', width: 1, style: LineStyle.Dashed },
      },
    });

    chartRef.current = chart;

    // Candlestick
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#00e676',
      downColor: '#ff1744',
      borderVisible: false,
      wickUpColor: '#00e676',
      wickDownColor: '#ff1744',
    }) as ISeriesApi<'Candlestick'>;
    candleRef.current = candle;

    // Volume
    const vol = chart.addSeries(HistogramSeries, {
      color: '#00d4ff20',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    }) as ISeriesApi<'Histogram'>;
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    volRef.current = vol;

    setReady(true);

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
      linesRef.current = [];
      setReady(false);
    };
  }, [symbol, height]); // Recreate chart on symbol switch

  // ── Data ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!candleRef.current || !volRef.current || !ready || data.length === 0) return;

    candleRef.current.setData(data.map(bar => ({
      time: bar.time as any,
      open: bar.open, high: bar.high, low: bar.low, close: bar.close,
    })));

    volRef.current.setData(data.map(bar => ({
      time: bar.time as any,
      value: bar.volume,
      color: bar.close >= bar.open ? '#00e67620' : '#ff174420',
    })));

    chartRef.current?.timeScale().fitContent();
  }, [data, ready]);

  // ── All price line overlays ────────────────────────────────────────────────
  useEffect(() => {
    if (!candleRef.current || !ready) return;

    // Clear
    linesRef.current.forEach(line => {
      candleRef.current?.removePriceLine(line);
    });
    linesRef.current = [];

    const addLine = (
      price: number,
      color: string,
      title: string,
      width: 1 | 2 | 3 | 4 = 1,
      style: LineStyle = LineStyle.Solid
    ) => {
      if (!price || isNaN(price)) return;
      const line = candleRef.current!.createPriceLine({
        price, color, lineWidth: width, lineStyle: style,
        axisLabelVisible: true, title,
        axisLabelColor: color, axisLabelTextColor: color,
        lineVisible: true,
      });
      linesRef.current.push(line);
    };

    // 1. DP levels
    dpLevels.forEach((lvl) => {
      if (!lvl.price) return;
      const color = lvl.type === 'SUPPORT' ? '#00ff88' : lvl.type === 'RESISTANCE' ? '#ff3366' : '#ffd700';
      const w: 1 | 2 | 3 = lvl.strength === 'STRONG' ? 2 : lvl.strength === 'MODERATE' ? 1 : 1;
      addLine(lvl.price, color, `DP ${lvl.type}`, w, lvl.type === 'BATTLEGROUND' ? LineStyle.Dashed : LineStyle.Solid);
    });

    // 2. GEX walls
    gammaWalls.forEach((wall) => {
      const color = wall.gex > 0 ? '#ff9800' : '#00bcd4';
      const absGex = Math.abs(wall.gex);
      const w: 1 | 2 | 3 = absGex > 500_000 ? 2 : 1;
      addLine(wall.strike, color, `GEX ${wall.gex > 0 ? '▲' : '▼'} ${(absGex / 1000).toFixed(0)}K`, w, LineStyle.Dotted);
    });

    // 3. Gamma flip
    if (gammaFlipLevel) {
      addLine(gammaFlipLevel, '#a855f7', 'γ Flip', 2, LineStyle.Dotted);
    }

    // 4. VWAP
    if (vwap) {
      addLine(vwap, '#00d4ff', 'VWAP', 1, LineStyle.Dashed);
    }

    // 5. Current price
    if (currentPrice) {
      addLine(currentPrice, '#ffffff', '● Now', 1, LineStyle.Solid);
    }

    // 6. MA lines
    Object.entries(movingAvgs).forEach(([key, ma]) => {
      const cfg = MA_CONFIG[key];
      if (!cfg || !ma?.value) return;
      addLine(ma.value, cfg.color, `${key} (${ma.signal})`, cfg.width as 1 | 2, cfg.style);
    });

    // 7. Classic pivots (main set only, avoid clutter)
    if (pivots.classic) {
      const p = pivots.classic;
      addLine(p.P, '#ffffff', 'Pivot', 1, LineStyle.Dotted);
      addLine(p.R1, '#4488ff', 'R1', 1, LineStyle.Dashed);
      addLine(p.R2, '#4488ff', 'R2', 1, LineStyle.Dashed);
      addLine(p.S1, '#4488ff', 'S1', 1, LineStyle.Dashed);
      addLine(p.S2, '#4488ff', 'S2', 1, LineStyle.Dashed);
    }

    // 8. Trap zone midpoint lines
    traps.forEach((trap) => {
      const mid = (trap.price_min + trap.price_max) / 2;
      const color = TRAP_COLORS[trap.type] ?? '#888888';
      const label = `${trap.emoji} ${trap.type.replace(/_/g, ' ')} [${trap.conviction}/5]`;
      addLine(mid, color, label, 2, LineStyle.Solid);
    });

  }, [dpLevels, gammaWalls, gammaFlipLevel, vwap, currentPrice, movingAvgs, pivots, traps, ready]);

  // ── Alert border ──────────────────────────────────────────────────────────
  const borderGlow =
    alertLevel === 'RED' ? 'shadow-[0_0_0_1px_rgba(239,68,68,0.4)] ring-1 ring-red-500/30' :
      alertLevel === 'YELLOW' ? 'shadow-[0_0_0_1px_rgba(234,179,8,0.4)] ring-1 ring-yellow-500/30' :
        alertLevel === 'GREEN' ? 'shadow-[0_0_0_1px_rgba(34,197,94,0.3)] ring-1 ring-green-500/20' :
          '';

  return (
    <div className={`w-full rounded-xl overflow-hidden ${borderGlow}`}>
      <div ref={containerRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
}
