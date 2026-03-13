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
  signal: string;
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

export interface SignalMarker {
  time: number;        // Unix timestamp (seconds)
  action: 'BUY' | 'SELL';
  entry_price: number;
  target_price: number;
  stop_price: number;
  confidence: number;
  type: string;
  is_master: boolean;
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

  // Signal markers (BUY/SELL arrows)
  signals?: SignalMarker[];

  activeContextId?: string | null;

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
  signals = [],
  activeContextId = null,
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
      height: containerRef.current.clientHeight || height,
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
        chart.applyOptions({ 
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
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
      id: string,
      price: number,
      baseColor: string,
      title: string,
      baseWidth: 1 | 2 | 3 | 4 = 1,
      baseStyle: LineStyle = LineStyle.Solid
    ) => {
      if (!price || isNaN(price)) return;

      let finalColor = baseColor;
      let finalWidth = baseWidth;
      let finalStyle = baseStyle;

      if (activeContextId) {
        if (activeContextId === id || id === 'current-price') {
          // Highlight active or always show current price
          finalWidth = Math.min(baseWidth + 1, 4) as any;
          finalStyle = LineStyle.Solid;
          if (finalColor.length > 7) { 
             finalColor = finalColor.substring(0, 7);
          }
        } else {
          // Dim others to 20% opacity (approx hex 33)
          const hex = baseColor.substring(0, 7);
          finalColor = `${hex}33`; 
        }
      }

      const line = candleRef.current!.createPriceLine({
        price, color: finalColor, lineWidth: finalWidth, lineStyle: finalStyle,
        axisLabelVisible: true, title,
        axisLabelColor: finalColor, axisLabelTextColor: finalColor,
        lineVisible: true,
      });
      linesRef.current.push(line);
    };

    // Calculate nearest levels to match DecisionStrip IDs
    const histLevels = dpLevels.filter((l: any) => !l.is_live).sort((a: any, b: any) => a.price - b.price);
    const nearestSupport = currentPrice ? [...histLevels].reverse().find((l: any) => l.price < currentPrice && l.type === 'SUPPORT') : null;
    const nearestResistance = currentPrice ? histLevels.find((l: any) => l.price > currentPrice && l.type === 'RESISTANCE') : null;

    const callWalls = gammaWalls.filter((w: any) => w.gex > 0).sort((a: any, b: any) => b.gex - a.gex);
    const putWalls = gammaWalls.filter((w: any) => w.gex < 0).sort((a: any, b: any) => a.gex - b.gex);
    const largestCallWall = callWalls.length > 0 ? callWalls[0] : null;
    const largestPutWall = putWalls.length > 0 ? putWalls[0] : null;

    // 1. DP levels + Signal overlays (Visually dominant)
    dpLevels.forEach((lvl: any) => {
      if (!lvl.price) return;

      // ── Signal overlay lines (from "Show on Chart") ──
      if (lvl.type === 'SIGNAL_ENTRY') {
        addLine('sig-entry', lvl.price, '#00d4ff', `📍 ENTRY $${lvl.price.toFixed(2)}`, 3, LineStyle.Solid);
        return;
      }
      if (lvl.type === 'SIGNAL_TARGET') {
        addLine('sig-target', lvl.price, '#00ff88', `🎯 TARGET $${lvl.price.toFixed(2)}`, 2, LineStyle.Dashed);
        return;
      }
      if (lvl.type === 'SIGNAL_STOP') {
        addLine('sig-stop', lvl.price, '#ff3366', `🛑 STOP $${lvl.price.toFixed(2)}`, 2, LineStyle.Dashed);
        return;
      }
      
      const isSupport = lvl.type === 'SUPPORT';
      const isResist = lvl.type === 'RESISTANCE';
      // Base colors: green for support, red for resistance, gold for battleground
      const color = isSupport ? '#00e676' : isResist ? '#ff1744' : '#ffd700';
      
      let id = `dp-${lvl.price}`;
      if (lvl.is_live) id = 'dp-live';
      else if (nearestResistance && lvl.price === nearestResistance.price) id = 'dp-hist-res';
      else if (nearestSupport && lvl.price === nearestSupport.price) id = 'dp-hist-sup';

      // Storytelling: Is this a Live Wall (today) or Historical Interest (Dec 2025)?
      if (lvl.is_live) {
        // Live walls are BOLD and SOLID
        const label = `🏦 LIVE ${isSupport ? 'SUP' : isResist ? 'RES' : 'BAT'} ${lvl.short_pct}% SV`;
        addLine(id, lvl.price, color, label, 4, LineStyle.Solid);
      } else {
        // Historical zones are MUTED and DASHED, showing the bounce rate
        // We lower the opacity of the color for historical
        const mutedColor = color + '80'; // 50% opacity hex
        const label = `🏛️ HIST ${lvl.bounce_rate}% bounce (${lvl.touches}x)`;
        addLine(id, lvl.price, mutedColor, label, 2, LineStyle.Dashed);
      }
    });

    // 2. GEX walls
    gammaWalls.forEach((wall) => {
      const color = wall.gex > 0 ? '#ff9800' : '#00bcd4';
      const absGex = Math.abs(wall.gex);
      const w: 1 | 2 | 3 = absGex > 500_000 ? 2 : 1;
      
      let id = `gex-${wall.strike}`;
      if (largestCallWall && wall.strike === largestCallWall.strike) id = 'gex-call';
      else if (largestPutWall && wall.strike === largestPutWall.strike) id = 'gex-put';

      addLine(id, wall.strike, color, `GEX ${wall.gex > 0 ? '▲' : '▼'} ${(absGex / 1000).toFixed(0)}K`, w, LineStyle.Dotted);
    });

    // 3. Gamma flip
    if (gammaFlipLevel) {
      addLine('gamma-flip', gammaFlipLevel, '#a855f7', 'γ Flip', 2, LineStyle.Dotted);
    }

    // 4. VWAP
    if (vwap) {
      addLine('vwap', vwap, '#00d4ff', 'VWAP', 1, LineStyle.Dashed);
    }

    // 5. Current price
    if (currentPrice) {
      addLine('current-price', currentPrice, '#ffffff', '● Now', 1, LineStyle.Solid);
    }

    // 6. MA lines
    Object.entries(movingAvgs).forEach(([key, ma]) => {
      const cfg = MA_CONFIG[key];
      if (!cfg || !ma?.value) return;
      
      let id = `ma-${key}`;
      if (key === 'MA200_SMA') id = 'ma-200';
      if (key === 'MA50_SMA') id = 'ma-50';

      addLine(id, ma.value, cfg.color, `${key} (${ma.signal})`, cfg.width as 1 | 2, cfg.style);
    });

    // 7. Classic pivots (Decluttered: R1/S1 only)
    if (pivots.classic) {
      const p = pivots.classic;
      addLine('pivot-r1', p.R1, '#4488ff', 'R1', 1, LineStyle.Dashed);
      addLine('pivot-s1', p.S1, '#4488ff', 'S1', 1, LineStyle.Dashed);
    }

    // 8. Trap zone midpoint lines
    traps.forEach((trap, idx) => {
      const mid = (trap.price_min + trap.price_max) / 2;
      const color = TRAP_COLORS[trap.type] ?? '#888888';
      const label = `${trap.emoji} ${trap.type.replace(/_/g, ' ')} [${trap.conviction}/5]`;
      addLine(`trap-${trap.type}-${idx}`, mid, color, label, 2, LineStyle.Solid);
    });

  }, [dpLevels, gammaWalls, gammaFlipLevel, vwap, currentPrice, movingAvgs, pivots, traps, activeContextId, ready]);

  // ── Signal markers (BUY/SELL as price lines — LWC v5 doesn't expose setMarkers) ──
  useEffect(() => {
    if (!candleRef.current || !ready || signals.length === 0) return;

    // Signal lines are added to linesRef and cleared by the overlays effect above.
    // We add them here as extra lines — they'll be cleared on next overlays cycle.
    signals.forEach((sig) => {
      const isBuy = sig.action === 'BUY';
      const entryColor = isBuy ? '#00e676' : '#ff1744';
      const masterTag = sig.is_master ? ' ★' : '';

      // Entry price line
      if (sig.entry_price > 0) {
        const line = candleRef.current!.createPriceLine({
          price: sig.entry_price,
          color: entryColor,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `${isBuy ? '▲' : '▼'} ${sig.action} ${sig.confidence.toFixed(0)}%${masterTag}`,
          lineVisible: true,
          axisLabelColor: entryColor,
          axisLabelTextColor: entryColor,
        });
        linesRef.current.push(line);
      }

      // Target line (dashed green)
      if (sig.target_price > 0) {
        const line = candleRef.current!.createPriceLine({
          price: sig.target_price,
          color: '#00e67660',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `T: ${sig.type}`,
          lineVisible: true,
          axisLabelColor: '#00e67660',
          axisLabelTextColor: '#00e67660',
        });
        linesRef.current.push(line);
      }

      // Stop line (dashed red)
      if (sig.stop_price > 0) {
        const line = candleRef.current!.createPriceLine({
          price: sig.stop_price,
          color: '#ff174460',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `S: ${sig.type}`,
          lineVisible: true,
          axisLabelColor: '#ff174460',
          axisLabelTextColor: '#ff174460',
        });
        linesRef.current.push(line);
      }
    });
  }, [signals, ready]);

  // ── Alert border ──────────────────────────────────────────────────────────
  const borderGlow =
    alertLevel === 'RED' ? 'shadow-[0_0_0_1px_rgba(239,68,68,0.4)] ring-1 ring-red-500/30' :
      alertLevel === 'YELLOW' ? 'shadow-[0_0_0_1px_rgba(234,179,8,0.4)] ring-1 ring-yellow-500/30' :
        alertLevel === 'GREEN' ? 'shadow-[0_0_0_1px_rgba(34,197,94,0.3)] ring-1 ring-green-500/20' :
          '';

  return (
    <div className={`w-full h-full rounded-xl overflow-hidden ${borderGlow}`}>
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />
    </div>
  );
}
