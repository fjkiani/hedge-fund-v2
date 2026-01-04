/**
 * Gamma Tracker Widget
 * 
 * Displays gamma exposure, gamma flip level, max pain, and P/C ratio.
 */

import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface GammaTrackerProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface GammaData {
  symbol: string;
  gamma_flip_level: number | null;
  current_regime: 'POSITIVE' | 'NEGATIVE';
  total_gex: number;
  max_pain: number | null;
  call_put_ratio: number;
  gamma_by_strike: Record<string, number>;
  current_price: number;
  distance_to_flip: number | null;
  timestamp: string;
}

export function GammaTracker({
  symbol = 'SPY',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: GammaTrackerProps) {
  const [gammaData, setGammaData] = useState<GammaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/v1/gamma/${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch gamma data');
      const data = await res.json();
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
      const wsUrl = `ws://localhost:8000/ws/gamma/${symbol}`;
      wsRef.current = new WebSocket(wsUrl);

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

  // Prepare chart data (gamma by strike)
  const chartData = gammaData?.gamma_by_strike
    ? Object.entries(gammaData.gamma_by_strike)
        .map(([strike, gex]) => ({
          strike: parseFloat(strike),
          gamma: gex
        }))
        .sort((a, b) => a.strike - b.strike)
    : [];

  if (loading && !gammaData) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gamma Tracker</h2>
            <Badge variant="neutral">Loading...</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading gamma data...</div>
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
            <h2 className="text-xl font-bold">Gamma Tracker</h2>
            <Badge variant="bearish">Error</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </Card>
    );
  }

  if (!gammaData) {
    return null;
  }

  const isPositiveGamma = gammaData.current_regime === 'POSITIVE';
  const regimeColor = isPositiveGamma ? 'green' : 'red';
  const regimeBadgeVariant = isPositiveGamma ? 'bullish' : 'bearish';

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Gamma Tracker</h2>
            <p className="text-sm text-gray-500">{symbol}</p>
          </div>
          <div className="flex items-center gap-2">
            {wsConnected && (
              <Badge variant="bullish" className="text-xs">
                Live
              </Badge>
            )}
            <Badge variant={regimeBadgeVariant}>
              {gammaData.current_regime} GAMMA
            </Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Gamma Flip Level</div>
            {gammaData.gamma_flip_level ? (
              <>
                <div className="text-lg font-bold">{formatPrice(gammaData.gamma_flip_level)}</div>
                {gammaData.distance_to_flip && (
                  <div className="text-xs text-gray-500 mt-1">
                    {gammaData.distance_to_flip.toFixed(2)} away
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400">N/A</div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Max Pain</div>
            {gammaData.max_pain ? (
              <div className="text-lg font-bold">{formatPrice(gammaData.max_pain)}</div>
            ) : (
              <div className="text-sm text-gray-400">N/A</div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total GEX</div>
            <div className="text-lg font-bold">{formatGEX(gammaData.total_gex)}</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Call/Put Ratio</div>
            <div className="text-lg font-bold">{gammaData.call_put_ratio.toFixed(2)}</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${gammaData.call_put_ratio > 1.0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(gammaData.call_put_ratio * 50, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {gammaData.call_put_ratio > 1.0 ? 'Bullish' : 'Bearish'}
            </div>
          </div>
        </div>

        {/* Current Price vs Key Levels */}
        {gammaData.current_price > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Price vs Key Levels</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="text-sm font-medium">Current Price</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatPrice(gammaData.current_price)}
                </span>
              </div>
              {gammaData.gamma_flip_level && (
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm font-medium">Gamma Flip</span>
                  <span className={`text-lg font-bold ${isPositiveGamma ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(gammaData.gamma_flip_level)}
                  </span>
                </div>
              )}
              {gammaData.max_pain && (
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm font-medium">Max Pain</span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
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
            <h3 className="text-sm font-semibold mb-3">Gamma Exposure by Strike</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
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
                  formatter={(value: number) => [formatGEX(value), 'Gamma Exposure']}
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
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm font-semibold mb-2">
            {isPositiveGamma ? '🟢 Positive Gamma Regime' : '🔴 Negative Gamma Regime'}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {isPositiveGamma
              ? 'Dealers are long options (stabilizing). Price moves are dampened. Buy dips, sell rallies.'
              : 'Dealers are short options (amplifying). Price moves are accelerated. Momentum trades favored.'}
          </div>
        </div>
      </div>
    </Card>
  );
}

