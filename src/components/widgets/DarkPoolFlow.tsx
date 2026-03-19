/**
 * Dark Pool Flow Widget — Rebuilt with Data-Linker visual patterns
 *
 * Glass-panel container, neon glow stats, framer-motion animations,
 * styled level cards, sortable positions table with Data-Linker aesthetics.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { darkpoolApi, createWebSocket } from '../../lib/api';

interface DPLevel {
  price: number;
  volume: number;
  level_type: 'SUPPORT' | 'RESISTANCE' | 'BATTLEGROUND';
  strength: number;
  distance_from_price?: number;
}

interface DPPrint {
  price: number;
  volume: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

interface DPSummary {
  total_volume: number;
  dp_percent: number;
  buying_pressure: number;
  dp_position_dollars: number | null;
  net_short_dollars: number | null;
  short_volume_pct: number | null;
  nearest_support: DPLevel | null;
  nearest_resistance: DPLevel | null;
  battlegrounds: DPLevel[];
}

interface DPTopPosition {
  ticker: string;
  dp_position_dollars: number;
  dp_position_shares: number;
  short_volume_pct: number;
  net_short_volume: number | null;
  date: string;
}

interface DarkPoolFlowProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/* ── Helpers ── */
function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

function formatDollars(dollars: number): string {
  if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(1)}B`;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  return `$${dollars.toLocaleString()}`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

function getLevelColor(type: string): string {
  switch (type) {
    case 'SUPPORT': return '#00ff88';
    case 'RESISTANCE': return '#ff3366';
    case 'BATTLEGROUND': return '#ffd700';
    default: return '#6b7280';
  }
}

/* ── Custom Tooltip (Data-Linker pattern) ── */
const DPTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="glass-card p-3 text-xs font-mono" style={{ minWidth: 140 }}>
      <p className="text-text-muted border-b border-border-subtle/30 pb-1 mb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span style={{ color: entry.color }}>Volume</span>
        <span className="font-bold text-text-primary">{formatVolume(entry.value)}</span>
      </div>
    </div>
  );
};

export function DarkPoolFlow({
  symbol = 'SPY',
  autoRefresh = true,
  refreshInterval = 30000
}: DarkPoolFlowProps) {
  const [levels, setLevels] = useState<DPLevel[]>([]);
  const [summary, setSummary] = useState<DPSummary | null>(null);
  const [prints, setPrints] = useState<DPPrint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [topPositions, setTopPositions] = useState<DPTopPosition[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [levelsData, summaryData, printsData, narrativeData, topPosData] = await Promise.all([
        darkpoolApi.getLevels(symbol) as Promise<any>,
        darkpoolApi.getSummary(symbol) as Promise<any>,
        darkpoolApi.getPrints(symbol, 10) as Promise<any>,
        darkpoolApi.getNarrative().catch(() => ({ narrative: null })),
        darkpoolApi.getTopPositions(10).catch(() => ({ positions: [] })),
      ]);
      setLevels(levelsData.levels || []);
      setCurrentPrice(levelsData.current_price || null);
      setSummary(summaryData.summary || null);
      setPrints(printsData.prints || []);
      setNarrative((narrativeData as any)?.narrative || null);
      setTopPositions((topPosData as any)?.positions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dark pool data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [symbol, autoRefresh, refreshInterval]);

  useEffect(() => {
    if (autoRefresh) {
      wsRef.current = createWebSocket(`darkpool/${symbol}`);
      wsRef.current.onopen = () => setWsConnected(true);
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'DP_UPDATE') fetchData();
        } catch {}
      };
      wsRef.current.onerror = () => setWsConnected(false);
      wsRef.current.onclose = () => setWsConnected(false);
      return () => { wsRef.current?.close(); };
    }
  }, [symbol, autoRefresh]);

  // Loading state — ring spinner (Data-Linker)
  if (loading && levels.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-display font-semibold text-text-primary mb-4">Dark Pool Flow</h2>
        <div className="flex items-center justify-center gap-3 py-10 text-text-muted">
          <div className="w-8 h-8 border-4 border-bg-tertiary rounded-full relative">
            <div className="absolute inset-0 border-4 border-accent-green border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="font-mono text-sm animate-pulse">Loading dark pool flow…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-lg font-display font-semibold text-text-primary mb-4">Dark Pool Flow</h2>
        <div className="text-accent-red text-center py-8 text-sm">
          ⚠ {error}
          <button onClick={fetchData} className="text-xs text-accent-blue underline ml-2">Retry</button>
        </div>
      </div>
    );
  }

  const chartData = levels
    .slice(0, 10)
    .map(level => ({
      price: formatPrice(level.price),
      volume: level.volume,
      type: level.level_type,
      strength: level.strength
    }))
    .reverse();

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle/50">
        <div>
          <h2 className="text-lg font-display font-semibold text-text-primary flex items-center gap-2">
            Dark Pool Flow
          </h2>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            {symbol} · Off-exchange volume & institutional prints
          </p>
        </div>
        <div className="flex items-center gap-3">
          {wsConnected && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-accent-green">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              LIVE
            </span>
          )}
          {currentPrice && (
            <span className="text-2xl font-bold data-number neon-text-blue">
              {formatPrice(currentPrice)}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary Stats — glass cards with gradient blobs */}
        {summary && (
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4 relative overflow-hidden group"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl bg-accent-blue opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" />
              <div className="relative z-10">
                <div className="text-text-muted text-xs font-mono uppercase tracking-wider mb-2">Total Volume</div>
                <div className="text-2xl font-bold data-number text-text-primary">{formatVolume(summary.total_volume)}</div>
                {summary.dp_position_dollars && (
                  <div className="text-text-muted text-[10px] font-mono mt-1">{formatDollars(summary.dp_position_dollars)} notional</div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-4 relative overflow-hidden group"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
                   style={{ backgroundColor: summary.dp_percent > 50 ? '#00ff88' : '#ff3366' }} />
              <div className="relative z-10">
                <div className="text-text-muted text-xs font-mono uppercase tracking-wider mb-2">DP %</div>
                <div className={`text-2xl font-bold data-number ${summary.dp_percent > 50 ? 'neon-text-green' : 'neon-text-red'}`}>
                  {summary.dp_percent.toFixed(1)}%
                </div>
                {summary.short_volume_pct !== null && (
                  <div className={`text-[10px] font-mono mt-1 ${summary.short_volume_pct > 55 ? 'text-accent-red' : summary.short_volume_pct < 45 ? 'text-accent-green' : 'text-text-muted'}`}>
                    {summary.short_volume_pct.toFixed(1)}% short vol
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-4 relative overflow-hidden group"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
                   style={{ backgroundColor: summary.buying_pressure >= 55 ? '#00ff88' : '#ff3366' }} />
              <div className="relative z-10">
                <div className="text-text-muted text-xs font-mono uppercase tracking-wider mb-2">Buying Pressure</div>
                <div className={`text-2xl font-bold data-number ${summary.buying_pressure >= 55 ? 'neon-text-green' : summary.buying_pressure <= 45 ? 'neon-text-red' : 'text-text-primary'}`}>
                  {summary.buying_pressure.toFixed(1)}%
                </div>
                <div className="w-full bg-bg-primary/60 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${summary.buying_pressure}%`,
                      backgroundColor: summary.buying_pressure >= 55 ? '#00ff88' : summary.buying_pressure <= 45 ? '#ff3366' : '#00d4ff',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* DP Levels Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <div className="mb-3">
              <h3 className="text-sm font-display font-semibold text-text-primary">Dark Pool Levels by Volume</h3>
              <p className="text-xs text-text-muted font-mono">Price levels with significant off-exchange activity</p>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,53,0.6)" vertical={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#606070', fontSize: 11 }}
                  tickFormatter={(v) => formatVolume(v)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis dataKey="price" type="category" width={80} tick={{ fill: '#a0a0b0', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<DPTooltip />} cursor={{ fill: 'rgba(42,42,53,0.3)' }} />
                <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getLevelColor(entry.type)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-text-muted font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#00ff88' }} />
                <span>Support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#ff3366' }} />
                <span>Resistance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#ffd700' }} />
                <span>Battleground</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Nearest Levels — Data-Linker call/put wall pattern */}
        {summary && (summary.nearest_support || summary.nearest_resistance) && (
          <div className="grid grid-cols-2 gap-3">
            {summary.nearest_support && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-xl border border-accent-green/20 bg-accent-green/5 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-accent-green/10 text-xs font-mono text-accent-green uppercase tracking-wider">
                  Nearest Support
                </div>
                <div className="p-3">
                  <div className="text-xl font-bold neon-text-green data-number">{formatPrice(summary.nearest_support.price)}</div>
                  <div className="text-xs text-text-muted font-mono mt-1">{formatVolume(summary.nearest_support.volume)} shares</div>
                  {summary.nearest_support.distance_from_price && (
                    <div className="text-xs text-text-muted font-mono">{fmt(summary.nearest_support.distance_from_price)} pts away</div>
                  )}
                </div>
              </motion.div>
            )}
            {summary.nearest_resistance && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-xl border border-accent-red/20 bg-accent-red/5 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-accent-red/10 text-xs font-mono text-accent-red uppercase tracking-wider">
                  Nearest Resistance
                </div>
                <div className="p-3">
                  <div className="text-xl font-bold neon-text-red data-number">{formatPrice(summary.nearest_resistance.price)}</div>
                  <div className="text-xs text-text-muted font-mono mt-1">{formatVolume(summary.nearest_resistance.volume)} shares</div>
                  {summary.nearest_resistance.distance_from_price && (
                    <div className="text-xs text-text-muted font-mono">{fmt(summary.nearest_resistance.distance_from_price)} pts away</div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Recent Prints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2">Recent Prints</div>
          {/* FINRA T-1 disclosure: prints are daily batch, not live intraday */}
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border border-accent-gold/20 bg-accent-gold/5">
            <span className="text-accent-gold text-sm">⚠️</span>
            <span className="text-[10px] font-mono text-accent-gold/80">FINRA data: prior session close — not live intraday</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {prints.length === 0 ? (
              <div className="text-text-muted text-sm text-center py-4 font-mono">No recent prints</div>
            ) : (
              prints.map((print, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg text-sm hover:bg-bg-hover/30 transition-colors"
                  style={{ backgroundColor: 'rgba(26,26,37,0.5)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center w-12 px-2 py-0.5 rounded text-[10px] font-bold ${
                      print.side === 'BUY'
                        ? 'bg-accent-green/15 text-accent-green border border-accent-green/20'
                        : 'bg-accent-red/15 text-accent-red border border-accent-red/20'
                    }`}>
                      {print.side}
                    </span>
                    <span className="font-medium text-text-primary data-number">{formatPrice(print.price)}</span>
                    <span className="text-text-muted text-xs font-mono">{formatVolume(print.volume)}</span>
                  </div>
                  <span className="text-[10px] text-text-muted/40 font-mono">T-1</span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* DP Narrative */}
        {narrative && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="rounded-xl border border-accent-blue/15 bg-accent-blue/5 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-accent-blue text-sm">🏴</span>
              <span className="text-xs font-mono text-accent-blue uppercase tracking-widest">Dark Pool Intelligence</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{narrative}</p>
          </motion.div>
        )}

        {/* Top Positions — Data-Linker DataTable pattern */}
        {topPositions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-border-subtle/30">
              <h3 className="text-sm font-display font-semibold text-text-primary">Top Dark Pool Positions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[10px] uppercase font-mono text-text-muted tracking-wider" style={{ backgroundColor: 'rgba(26,26,37,0.4)' }}>
                  <tr>
                    <th className="px-4 py-3">Ticker</th>
                    <th className="px-4 py-3 text-right">Shares</th>
                    <th className="px-4 py-3 text-right">Notional</th>
                    <th className="px-4 py-3 text-right">Short Vol %</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {topPositions.slice(0, 8).map((pos, i) => {
                    const shortPct = pos.short_volume_pct;
                    const isHeavy = shortPct > 55;
                    const isLight = shortPct < 45;
                    return (
                      <tr
                        key={i}
                        className="border-b border-border-subtle/20 hover:bg-bg-hover/20 transition-colors"
                        style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(10,10,15,0.2)' }}
                      >
                        <td className="px-4 py-3 font-bold text-text-primary">{pos.ticker}</td>
                        <td className="px-4 py-3 text-right text-text-muted">{formatVolume(pos.dp_position_shares)}</td>
                        <td className="px-4 py-3 text-right text-text-primary font-medium">{formatDollars(pos.dp_position_dollars)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isHeavy
                              ? 'bg-accent-red/10 text-accent-red border border-accent-red/20'
                              : isLight
                                ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                                : 'text-text-muted'
                          }`}>
                            {shortPct.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border-subtle/50 flex items-center justify-between text-xs">
        <span className="text-text-muted font-mono">
          Updated {new Date().toLocaleTimeString()}
        </span>
        <button
          onClick={fetchData}
          className="text-accent-blue hover:text-accent-blue/80 text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
