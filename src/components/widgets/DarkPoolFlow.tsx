/**
 * Dark Pool Flow Widget
 * 
 * Displays dark pool levels, buy/sell pressure, and recent prints.
 */

import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  nearest_support: DPLevel | null;
  nearest_resistance: DPLevel | null;
  battlegrounds: DPLevel[];
}

interface DarkPoolFlowProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function DarkPoolFlow({
  symbol = 'SPY',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: DarkPoolFlowProps) {
  const [levels, setLevels] = useState<DPLevel[]>([]);
  const [summary, setSummary] = useState<DPSummary | null>(null);
  const [prints, setPrints] = useState<DPPrint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch levels
      const levelsRes = await fetch(`/api/v1/darkpool/${symbol}/levels`);
      if (!levelsRes.ok) throw new Error('Failed to fetch DP levels');
      const levelsData = await levelsRes.json();
      setLevels(levelsData.levels || []);
      setCurrentPrice(levelsData.current_price || null);

      // Fetch summary
      const summaryRes = await fetch(`/api/v1/darkpool/${symbol}/summary`);
      if (!summaryRes.ok) throw new Error('Failed to fetch DP summary');
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary || null);

      // Fetch prints
      const printsRes = await fetch(`/api/v1/darkpool/${symbol}/prints?limit=10`);
      if (!printsRes.ok) throw new Error('Failed to fetch DP prints');
      const printsData = await printsRes.json();
      setPrints(printsData.prints || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dark pool data');
      console.error('Error fetching dark pool data:', err);
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
      const wsUrl = `ws://localhost:8000/ws/darkpool/${symbol}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log('Dark Pool WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'DP_UPDATE') {
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
        console.log('Dark Pool WebSocket disconnected');
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [symbol, autoRefresh]);

  const getLevelColor = (type: string): string => {
    switch (type) {
      case 'SUPPORT':
        return '#10b981'; // green
      case 'RESISTANCE':
        return '#ef4444'; // red
      case 'BATTLEGROUND':
        return '#f59e0b'; // orange
      default:
        return '#6b7280'; // gray
    }
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  if (loading && levels.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Dark Pool Flow</h2>
            <Badge variant="neutral">Loading...</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading dark pool data...</div>
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
            <h2 className="text-xl font-bold">Dark Pool Flow</h2>
            <Badge variant="bearish">Error</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </Card>
    );
  }

  // Prepare chart data (horizontal bars)
  const chartData = levels
    .slice(0, 10) // Top 10 levels
    .map(level => ({
      price: formatPrice(level.price),
      volume: level.volume,
      type: level.level_type,
      strength: level.strength
    }))
    .reverse(); // Reverse for better visualization

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Dark Pool Flow</h2>
            <p className="text-sm text-gray-500">{symbol}</p>
          </div>
          <div className="flex items-center gap-2">
            {wsConnected && (
              <Badge variant="bullish" className="text-xs">
                Live
              </Badge>
            )}
            {currentPrice && (
              <span className="text-sm font-semibold">{formatPrice(currentPrice)}</span>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Total Volume</div>
              <div className="text-lg font-bold">{formatVolume(summary.total_volume)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">DP %</div>
              <div className="text-lg font-bold">{summary.dp_percent.toFixed(1)}%</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Buying Pressure</div>
              <div className="text-lg font-bold">{summary.buying_pressure.toFixed(1)}%</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${summary.buying_pressure}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* DP Levels Chart */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Dark Pool Levels by Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="price" type="category" width={80} />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  if (name === 'volume') {
                    return [formatVolume(value), 'Volume'];
                  }
                  return [value, name];
                }}
              />
              <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getLevelColor(entry.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Support</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Resistance</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded" />
              <span>Battleground</span>
            </div>
          </div>
        </div>

        {/* Nearest Levels */}
        {summary && (summary.nearest_support || summary.nearest_resistance) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {summary.nearest_support && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-gray-500 mb-1">Nearest Support</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatPrice(summary.nearest_support.price)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatVolume(summary.nearest_support.volume)} shares
                </div>
                {summary.nearest_support.distance_from_price && (
                  <div className="text-xs text-gray-500">
                    {summary.nearest_support.distance_from_price.toFixed(2)} away
                  </div>
                )}
              </div>
            )}
            {summary.nearest_resistance && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="text-sm text-gray-500 mb-1">Nearest Resistance</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatPrice(summary.nearest_resistance.price)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatVolume(summary.nearest_resistance.volume)} shares
                </div>
                {summary.nearest_resistance.distance_from_price && (
                  <div className="text-xs text-gray-500">
                    {summary.nearest_resistance.distance_from_price.toFixed(2)} away
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Prints */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Prints (Last 10)</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {prints.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No recent prints</div>
            ) : (
              prints.map((print, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={print.side === 'BUY' ? 'bullish' : 'bearish'}
                      className="text-xs"
                    >
                      {print.side}
                    </Badge>
                    <span className="font-medium">{formatPrice(print.price)}</span>
                    <span className="text-gray-500">{formatVolume(print.volume)}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(print.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

