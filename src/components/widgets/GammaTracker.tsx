/**
 * Gamma Tracker Widget
 * 
 * Displays gamma exposure, gamma flip level, max pain, and P/C ratio.
 */

import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { gammaApi, createWebSocket } from '../../lib/api';
import { useGammaPivotContext } from '../../hooks/useGammaPivotContext';

interface GammaTrackerProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onDrillDown?: (item: any) => void;
  activeSlug?: string;
}

interface GammaWall {
  strike: number;
  gex: number;
  open_interest: number;
  signal: string;
}

interface GammaData {
  symbol: string;
  gamma_flip_level: number | null;
  current_regime: 'POSITIVE' | 'NEGATIVE';
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
  source: string;
  timestamp: string;
}

export function GammaTracker({
  symbol = 'SPY',
  autoRefresh = true,
  refreshInterval = 30000,
  onDrillDown,
  activeSlug
}: GammaTrackerProps) {
  const [gammaData, setGammaData] = useState<GammaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const oracleCtx = useGammaPivotContext();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await gammaApi.get(symbol) as GammaData;
      setGammaData(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gamma data');
      console.error('Error fetching gamma data:', err);
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
    // WebSocket connection for real-time updates
    if (autoRefresh) {
      const wsUrl = `gamma/${symbol}`;
      wsRef.current = createWebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log('Gamma WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'GAMMA_UPDATE') {
            fetchData(); // Refresh on update
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setWsConnected(false);
      };

      wsRef.current.onclose = () => {
        setWsConnected(false);
        console.log('Gamma WebSocket disconnected');
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [symbol, autoRefresh]);

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  const formatGEX = (gex: number): string => {
    if (gex >= 1000000000) {
      return `${(gex / 1000000000).toFixed(2)}B`;
    } else if (gex >= 1000000) {
      return `${(gex / 1000000).toFixed(2)}M`;
    } else if (gex >= 1000) {
      return `${(gex / 1000).toFixed(2)}K`;
    }
    return gex.toFixed(0);
  };

  // Prepare chart data from gamma_walls + negative_zones (not gamma_by_strike)
  const chartData = gammaData
    ? [
      ...(gammaData.gamma_walls || []).map(w => ({ strike: w.strike, gamma: w.gex, type: 'wall' })),
      ...(gammaData.negative_zones || []).map(z => ({ strike: z.strike, gamma: z.gex, type: 'negative' })),
    ].sort((a, b) => a.strike - b.strike)
    : [];

  if (loading && !gammaData) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Gamma Tracker</h2>
            <Badge variant="neutral">Loading...</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-zinc-400 font-mono text-sm">Loading gamma data...</div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Gamma Tracker</h2>
            <Badge variant="bearish">Error</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-rose-400 font-mono text-sm">{error}</div>
          </div>
        </div>
      </Card>
    );
  }

  if (!gammaData) {
    return null;
  }

  const isPositiveGamma = gammaData.current_regime === 'POSITIVE';
  const regimeBadgeVariant = isPositiveGamma ? 'bullish' : 'bearish';

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Gamma Tracker</h2>
            <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{symbol}</p>
          </div>
          <div className="flex items-center gap-2">
            {wsConnected && (
              <Badge variant="bullish" className="text-xs">Live</Badge>
            )}
            {(() => {
                const slug = `GEX:${symbol}`;
                const isActive = activeSlug === slug;
                return (
                <div
                    onClick={() => onDrillDown?.({
                        slug,
                        title: `Gamma Exposure - ${symbol}`,
                        label: 'Gamma Regime',
                        actual: formatGEX(gammaData.total_gex),
                        signal: gammaData.current_regime,
                        surprise: gammaData.gamma_flip_level ? `Flip: ${formatPrice(gammaData.gamma_flip_level)}` : ''
                    })}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                        border: isActive ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid transparent',
                        borderRadius: '99px',
                        padding: '1px'
                    }}
                >
                    <Badge variant={regimeBadgeVariant}>
                        {gammaData.current_regime} GAMMA
                    </Badge>
                </div>
                );
            })()}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Gamma Flip Level</div>
            {gammaData.gamma_flip_level ? (
              <>
                <div className="text-lg font-black text-white font-mono">{formatPrice(gammaData.gamma_flip_level)}</div>
                {gammaData.distance_to_flip && (
                  <div className="text-xs font-mono text-zinc-400 mt-1">
                    {gammaData.distance_to_flip.toFixed(2)} pts away
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-zinc-500">N/A</div>
            )}
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Max Pain</div>
            {gammaData.max_pain ? (
              <>
                <div className="text-lg font-black text-white font-mono">{formatPrice(gammaData.max_pain)}</div>
                {/* distance from max pain — oracle-enriched */}
                {oracleCtx.distance_from_max_pain != null ? (
                  <div className={`text-xs font-mono mt-1 ${
                    oracleCtx.distance_from_max_pain > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {oracleCtx.distance_from_max_pain > 0 ? '+' : ''}{oracleCtx.distance_from_max_pain.toFixed(2)} pts
                  </div>
                ) : null}
              </>
            ) : (
              <div className="text-sm text-zinc-500">N/A</div>
            )}
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Total GEX</div>
            <div className="text-lg font-black text-white font-mono">{formatGEX(gammaData.total_gex)}</div>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Call / Put Ratio</div>
            <div className="text-lg font-black text-white font-mono">{gammaData.call_put_ratio.toFixed(2)}</div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${gammaData.call_put_ratio > 1.0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(gammaData.call_put_ratio * 50, 100)}%` }}
              />
            </div>
            <div className="text-xs font-bold text-zinc-400 mt-1.5">
              {gammaData.call_put_ratio > 1.0 ? '▲ Bullish skew' : '▼ Bearish skew'}
            </div>
          </div>
        </div>

        {/* Oracle Context Strip — band label from unified brief */}
        {oracleCtx.isLoaded && oracleCtx.bandLabel !== '—' && (
          <div className="mb-6 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700/40 flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest shrink-0">NYX READ</span>
            <span className="text-xs font-mono text-zinc-200">{oracleCtx.bandLabel}</span>
          </div>
        )}

        {/* Contract Volume Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Contracts</div>
            <div className="text-sm font-black text-white font-mono">{(gammaData.total_contracts || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Calls</div>
            <div className="text-sm font-black text-emerald-400 font-mono">{(gammaData.total_calls || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Puts</div>
            <div className="text-sm font-black text-rose-400 font-mono">{(gammaData.total_puts || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Current Price vs Key Levels */}
        {gammaData.current_price > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Price vs Key Levels</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4 py-2.5 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                <span className="text-sm font-bold text-zinc-300">Current Price</span>
                <span className="text-lg font-black text-cyan-400 font-mono">
                  {formatPrice(gammaData.current_price)}
                </span>
              </div>
              {gammaData.gamma_flip_level && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-sm font-bold text-zinc-300">Gamma Flip</span>
                  <span className={`text-lg font-black font-mono ${isPositiveGamma ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPrice(gammaData.gamma_flip_level)}
                  </span>
                </div>
              )}
              {gammaData.max_pain && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-sm font-bold text-zinc-300">Max Pain</span>
                  <span className="text-lg font-black font-mono text-amber-400">
                    {formatPrice(gammaData.max_pain)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gamma Exposure Chart */}
        {chartData.length > 0 && (
          <div>
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Gamma Exposure by Strike</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="strike"
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <YAxis
                  tickFormatter={(value) => formatGEX(value)}
                />
                <Tooltip
                  formatter={(value: number | undefined) => value !== undefined ? [formatGEX(value), 'Gamma Exposure'] : ['', '']}
                  labelFormatter={(label) => `Strike: ${formatPrice(label)}`}
                />
                <Line
                  type="monotone"
                  dataKey="gamma"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                {gammaData.gamma_flip_level && (
                  <ReferenceLine
                    x={gammaData.gamma_flip_level}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label={{ value: "Gamma Flip", position: "top" }}
                  />
                )}
                {gammaData.current_price > 0 && (
                  <ReferenceLine
                    x={gammaData.current_price}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{ value: "Current Price", position: "top" }}
                  />
                )}
                {gammaData.max_pain && (
                  <ReferenceLine
                    x={gammaData.max_pain}
                    stroke="#f59e0b"
                    strokeDasharray="2 2"
                    label={{ value: "Max Pain", position: "bottom" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Regime Explanation */}
        <div className="mt-6 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
          <div className="text-sm font-black text-white mb-2">
            {isPositiveGamma ? '🟢 Positive Gamma Regime' : '🔴 Negative Gamma Regime'}
          </div>
          <div className="text-sm text-zinc-300">
            {isPositiveGamma
              ? 'Dealers are long options (stabilizing). Price moves are dampened. Buy dips, sell rallies.'
              : 'Dealers are short options (amplifying). Price moves are accelerated. Momentum trades favored.'}
          </div>
        </div>

        {/* Gamma Walls Table */}
        {gammaData.gamma_walls && gammaData.gamma_walls.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Top Gamma Walls</h3>
            <div className="space-y-1.5">
              {gammaData.gamma_walls.slice(0, 5).map((wall, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-sm font-black text-white font-mono">${wall.strike.toFixed(0)}</span>
                  <span className={`text-xs font-black uppercase tracking-wide ${wall.signal === 'SUPPORT' ? 'text-emerald-400' : 'text-rose-400'}`}>{wall.signal}</span>
                  <span className="text-xs font-mono font-bold text-zinc-300">GEX: {formatGEX(wall.gex)}</span>
                  <span className="text-xs font-mono text-zinc-400">OI: {wall.open_interest.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source label */}
        <div className="mt-4 text-xs font-mono font-bold text-zinc-500 text-right uppercase tracking-widest">
          Source: {gammaData.source?.toUpperCase() || 'CBOE'}
        </div>
      </div>
    </Card>
  );
}

