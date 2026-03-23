/**
 * GexPanel — Ported from Data-Linker GexPanel.tsx
 *
 * Gamma Exposure panel showing regime (POSITIVE/NEGATIVE), call/put walls,
 * GEX flip point, and Net GEX by strike bar chart.
 *
 * Backend: gammaApi.get('SPY') → GammaResponse
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from 'recharts';
import { gammaApi } from '../../lib/api';

interface GammaWall { strike: number; gex: number; open_interest: number; signal: string; }
interface GammaData {
  symbol: string;
  gamma_flip_level: number | null;
  current_regime: string;
  total_gex: number;
  max_pain: number | null;
  call_put_ratio: number;
  gamma_walls: GammaWall[];
  negative_zones: GammaWall[];
  current_price: number;
  distance_to_flip: number | null;
  total_contracts: number;
  total_calls: number;
  total_puts: number;
}

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

const GexTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 rounded-lg text-xs font-mono" style={{ minWidth: 140 }}>
      <p className="text-text-muted border-b border-border-subtle/30 pb-1 mb-1">Strike {label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4 my-0.5">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-text-primary">{fmt(p.value)}M</span>
        </div>
      ))}
    </div>
  );
};

export function GexPanel({ symbol = 'SPY' }: { symbol?: string }) {
  const [data, setData] = useState<GammaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchData = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await gammaApi.get(symbol) as GammaData;
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GEX data');
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Build chart data from gamma_walls + negative_zones
  const chartData = useMemo(() => {
    if (!data) return [];
    const all = [
      ...data.gamma_walls.map(w => ({ strike: w.strike, netGex: w.gex / 1_000_000 })),
      ...data.negative_zones.map(z => ({ strike: z.strike, netGex: z.gex / 1_000_000 })),
    ];
    // Filter to ±8% of spot
    return all
      .filter(r => Math.abs(r.strike - data.current_price) / data.current_price <= 0.08)
      .sort((a, b) => a.strike - b.strike);
  }, [data]);

  const isLongGamma = data?.current_regime === 'POSITIVE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-panel rounded-xl overflow-hidden w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle/50">
        <div>
          <h2 className="text-base font-display font-semibold text-text-primary flex items-center gap-2">
            ⚡ Gamma Exposure (GEX)
          </h2>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            Dealer hedging flows from live options chain · {symbol}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={fetching}
          className="p-2 rounded-lg border border-border-subtle/40 hover:bg-bg-hover/20 transition-colors text-text-muted"
        >
          <span className={`inline-block text-sm ${fetching ? 'animate-spin' : ''}`}>↻</span>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-text-muted">
            <div className="w-8 h-8 border-4 border-bg-tertiary rounded-full relative">
              <div className="absolute inset-0 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-mono text-sm animate-pulse">Computing gamma exposure…</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-6 justify-center text-accent-red/80 text-sm">
            ⚠ {error}
            <button onClick={fetchData} className="text-xs text-accent-blue underline ml-2">Retry</button>
          </div>
        ) : data ? (
          <>
            {/* Regime banner */}
            <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-xl border ${
              isLongGamma
                ? 'bg-accent-green/5 border-accent-green/20'
                : 'bg-accent-red/5 border-accent-red/20'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{isLongGamma ? '📈' : '📉'}</span>
                <div>
                  <div className={`font-display font-bold text-sm ${isLongGamma ? 'neon-text-green' : 'neon-text-red'}`}>
                    {isLongGamma ? 'LONG GAMMA REGIME' : 'SHORT GAMMA REGIME'}
                  </div>
                  <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                    {isLongGamma
                      ? 'Dealers are long gamma — hedging dampens moves, expect mean reversion and pinning.'
                      : 'Dealers are short gamma — hedging amplifies moves, expect volatility acceleration.'}
                  </p>
                  <p className="text-[11px] text-text-muted/80 mt-1 leading-relaxed italic">
                    {isLongGamma
                      ? 'What this means: Price moves get absorbed. Breakouts fail. Selling dips and buying rips works.'
                      : 'What this means: Dealers are forced to amplify price moves today. A 1% drop becomes a 1.5% drop. Do not fade momentum.'}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-text-muted font-mono">Total GEX</div>
                <div className={`text-xl font-black font-mono data-number ${isLongGamma ? 'neon-text-green' : 'neon-text-red'}`}>
                  {data.total_gex > 0 ? '+' : ''}{fmt(data.total_gex / 1_000_000)}M
                </div>
                <p className="text-[10px] text-text-muted/70 mt-0.5 max-w-[180px] ml-auto italic">
                  {data.total_gex < 0
                    ? 'Negative = dealers sell into drops, buy into rallies. Moves accelerate.'
                    : 'Positive = dealers buy drops, sell rallies. Moves dampen.'}
                </p>
              </div>
            </div>

            {/* Key levels: call walls + put walls */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-accent-red/20 bg-accent-red/5 overflow-hidden">
                <div className="px-3 py-2 border-b border-accent-red/10 text-xs font-mono text-accent-red uppercase tracking-wider">
                  Call Walls (Resistance)
                </div>
                <div className="divide-y divide-border-subtle/20">
                  {data.gamma_walls
                    .filter(w => w.signal === 'RESISTANCE' || w.strike > data.current_price)
                    .slice(0, 4)
                    .map((w, i) => (
                      <div key={w.strike} className="px-3 py-2 text-xs font-mono">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-text-primary">
                            {w.strike}
                            {i === 0 && <span className="ml-1 text-accent-red text-[10px]">▲ MAX</span>}
                          </span>
                          <span className="text-accent-red">{fmt(w.gex / 1_000_000)}M γ</span>
                        </div>
                        {i === 0 && <p className="text-[10px] text-text-muted/70 mt-0.5 italic">Dealers must sell shares here to stay hedged. This is a mechanical ceiling — price stalling here is not random, it is contractual.</p>}
                      </div>
                    ))}
                  {data.gamma_walls.filter(w => w.signal === 'RESISTANCE' || w.strike > data.current_price).length === 0 && (
                    <div className="px-3 py-2 text-xs text-text-muted">No call walls detected</div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-accent-green/20 bg-accent-green/5 overflow-hidden">
                <div className="px-3 py-2 border-b border-accent-green/10 text-xs font-mono text-accent-green uppercase tracking-wider">
                  Put Walls (Support)
                </div>
                <div className="divide-y divide-border-subtle/20">
                  {data.negative_zones.slice(0, 4).map((w, i) => (
                    <div key={w.strike} className="px-3 py-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${i === 0 ? 'text-accent-green' : 'text-text-primary'}`}>
                          {w.strike}
                          {i === 0 && <span className="ml-1 text-accent-green text-[10px]">▼ MAX</span>}
                        </span>
                        <span className="text-accent-green">{fmt(Math.abs(w.gex) / 1_000_000)}M γ</span>
                      </div>
                      {i === 0 && <p className="text-[10px] text-text-muted/70 mt-0.5 italic">Dealers must buy shares at ${w.strike} to stay hedged. This is a mechanical floor. Price bouncing here is not luck — it is contractual.</p>}
                    </div>
                  ))}
                  {data.negative_zones.length === 0 && (
                    <div className="px-3 py-2 text-xs text-text-muted">No put walls detected</div>
                  )}
                </div>
              </div>
            </div>

            {/* GEX flip point */}
            {data.gamma_flip_level != null && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-accent-blue/20 bg-accent-blue/5 text-sm">
                <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                <span className="text-text-muted text-xs font-mono">GEX Flip Strike</span>
                <span className="font-bold font-mono neon-text-blue text-base data-number">{fmt(data.gamma_flip_level, 0)}</span>
                <span className="text-xs text-text-muted">
                  — below this, dealers become short gamma (moves accelerate)
                </span>
              </div>
            )}

            {/* Max pain & C/P ratio */}
            <div className="grid grid-cols-3 gap-3">
              {data.max_pain != null && (
                <div className="glass-card p-3 relative overflow-hidden group">
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl bg-accent-gold opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" />
                  <div className="relative z-10">
                    <div className="text-text-muted text-[10px] font-mono uppercase tracking-wider mb-1">Max Pain</div>
                    <div className="text-lg font-bold neon-text-gold data-number">${fmt(data.max_pain, 0)}</div>
                    <p className="text-[10px] text-text-muted/70 mt-0.5 italic">Options gravity pulls price here by expiry. MMs profit most at this level.</p>
                  </div>
                </div>
              )}
              <div className="glass-card p-3 relative overflow-hidden group">
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl bg-accent-blue opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" />
                <div className="relative z-10">
                  <div className="text-text-muted text-[10px] font-mono uppercase tracking-wider mb-1">C/P Ratio</div>
                  <div className="text-lg font-bold text-text-primary data-number">{data.call_put_ratio}</div>
                  <p className="text-[10px] text-text-muted/70 mt-0.5 italic">{data.call_put_ratio > 1 ? 'More calls than puts = bullish positioning.' : 'More puts than calls = bearish hedge demand.'}</p>
                </div>
              </div>
              <div className="glass-card p-3 relative overflow-hidden group">
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl bg-accent-blue opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" />
                <div className="relative z-10">
                  <div className="text-text-muted text-[10px] font-mono uppercase tracking-wider mb-1">Contracts</div>
                  <div className="text-lg font-bold text-text-primary data-number">{(data.total_contracts / 1000).toFixed(0)}K</div>
                  <div className="text-[10px] text-text-muted font-mono">{(data.total_calls / 1000).toFixed(0)}K C / {(data.total_puts / 1000).toFixed(0)}K P</div>
                  <p className="text-[10px] text-text-muted/70 mt-0.5 italic">Total open interest being hedged. More contracts = bigger dealer moves at walls.</p>
                </div>
              </div>
            </div>

            {/* GEX chart by strike */}
            {chartData.length > 0 && (
              <div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">
                  Net GEX by Strike (±8% of spot)
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,53,0.6)" vertical={false} />
                      <XAxis
                        dataKey="strike"
                        stroke="#606070"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="#606070"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}M`}
                        width={40}
                      />
                      <Tooltip content={<GexTooltip />} cursor={{ fill: 'rgba(42,42,53,0.3)' }} />
                      <ReferenceLine y={0} stroke="#606070" strokeWidth={1} />
                      <ReferenceLine
                        x={data.current_price}
                        stroke="#00d4ff"
                        strokeDasharray="4 3"
                        strokeWidth={2}
                        label={{ value: 'SPOT', fill: '#00d4ff', fontSize: 10 }}
                      />
                      <Bar dataKey="netGex" name="Net GEX" radius={[2, 2, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={entry.netGex >= 0 ? '#00ff88' : '#ff3366'}
                            fillOpacity={0.85}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <p className="text-xs text-text-muted/40 font-mono text-right">
              Spot {fmt(data.current_price)} · {data.total_contracts.toLocaleString()} contracts analyzed
            </p>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
