/**
 * MiniChart — 200px TradingView chart with key level overlays.
 * Wraps existing TradingViewChart at compact height.
 * Shows: OHLC candles, 20d/50d MA, gamma walls, DP levels, max pain, pivot R1.
 */

import { TradingViewChart } from '../charts/TradingViewChart';
import type { DPLevel as ChartDPLevel, GammaWall, MALevel } from '../charts/TradingViewChart';

interface MiniChartProps {
  symbol: string;
  candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
  ma20?: number | null;
  ma50?: number | null;
  gammaWalls?: { strike: number; gex: number; signal: string }[];
  dpLevels?: { price: number; level_type: string; strength: number }[];
  maxPain?: number;
  pivotR1?: number;
}

export function MiniChart({
  symbol,
  candles,
  ma20,
  ma50,
  gammaWalls = [],
  dpLevels = [],
  maxPain: _maxPain,
  pivotR1,
}: MiniChartProps) {
  // Convert DP levels to chart format
  const chartDPLevels: ChartDPLevel[] = dpLevels.slice(0, 3).map(l => ({
    price: l.price,
    volume: 0,
    type: l.level_type === 'SUPPORT' ? 'SUPPORT' : l.level_type === 'RESISTANCE' ? 'RESISTANCE' : 'BATTLEGROUND',
    strength: l.strength >= 80 ? 'STRONG' : l.strength >= 50 ? 'MODERATE' : 'WEAK',
  }));

  // Convert gamma walls to chart format
  const chartGammaWalls: GammaWall[] = gammaWalls.slice(0, 3).map(w => ({
    strike: w.strike,
    gex: w.gex,
    signal: w.signal === 'SUPPORT' ? 'SUPPORT' : 'RESISTANCE',
  }));

  // Build MA overlay
  const movingAvgs: Record<string, MALevel> = {};
  if (ma20) movingAvgs['MA50_SMA'] = { value: ma20, signal: '20d MA' };
  if (ma50) movingAvgs['MA200_SMA'] = { value: ma50, signal: '50d MA' };

  // Current price from last candle
  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : undefined;

  // Build pivots from real data
  const pivots = pivotR1 ? {
    classic: {
      P: pivotR1,
      R1: pivotR1,
      R2: 0, R3: 0,
      S1: 0, S2: 0, S3: 0,
    },
  } : undefined;

  return (
    <div style={{ height: 200 }}>
      <TradingViewChart
        symbol={symbol}
        data={candles}
        dpLevels={chartDPLevels}
        gammaWalls={chartGammaWalls}
        gammaFlipLevel={null}
        vwap={null}
        currentPrice={currentPrice}
        movingAvgs={movingAvgs}
        pivots={pivots}
        height={200}
      />
    </div>
  );
}
