/**
 * Options Flow Widget
 * 
 * Displays most active options, unusual activity, P/C ratio, and accumulation zones.
 */

import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OptionsFlowProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface OptionFlow {
  symbol: string;
  strike: number;
  expiration: string;
  option_type: 'CALL' | 'PUT';
  volume: number;
  open_interest: number;
  last_price: number;
  bid: number;
  ask: number;
  implied_volatility: number | null;
}

interface UnusualActivity {
  symbol: string;
  strike: number;
  expiration: string;
  option_type: 'CALL' | 'PUT';
  volume: number;
  open_interest: number;
  volume_oi_ratio: number;
  last_price: number;
  reason: string;
}

interface StrikeZone {
  strike: number;
  expiration: string;
  total_volume: number;
  total_oi: number;
  avg_price: number;
  direction: 'CALL' | 'PUT';
}

interface OptionsFlowData {
  symbol: string;
  most_active: OptionFlow[];
  unusual_activity: UnusualActivity[];
  call_put_ratio: number;
  accumulation_zones: {
    calls: StrikeZone[];
    puts: StrikeZone[];
  };
  sweeps: any[];
  timestamp: string;
}

export function OptionsFlow({
  symbol = 'SPY',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: OptionsFlowProps) {
  const [flowData, setFlowData] = useState<OptionsFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'most_active' | 'unusual' | 'zones'>('most_active');
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/v1/options/${symbol}/flow?limit=10`);
      if (!res.ok) throw new Error('Failed to fetch options flow data');
      const data = await res.json();
      setFlowData(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch options flow data');
      console.error('Error fetching options flow data:', err);
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
      const wsUrl = `ws://localhost:8000/ws/options/${symbol}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setWsConnected(true);
        console.log('Options Flow WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'OPTIONS_FLOW_UPDATE') {
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
        console.log('Options Flow WebSocket disconnected');
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

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  if (loading && !flowData) {
    return (
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Options Flow</h2>
            <Badge variant="neutral">Loading...</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading options flow data...</div>
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
            <h2 className="text-xl font-bold">Options Flow</h2>
            <Badge variant="bearish">Error</Badge>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </Card>
    );
  }

  if (!flowData) {
    return null;
  }

  const isBullish = flowData.call_put_ratio > 1.0;
  const pcBadgeVariant = isBullish ? 'bullish' : 'bearish';

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Options Flow</h2>
            <p className="text-sm text-gray-500">{symbol}</p>
          </div>
          <div className="flex items-center gap-2">
            {wsConnected && (
              <Badge variant="bullish" className="text-xs">
                Live
              </Badge>
            )}
            <Badge variant={pcBadgeVariant}>
              P/C: {flowData.call_put_ratio.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* P/C Ratio Gauge */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Call/Put Ratio</span>
            <span className={`text-lg font-bold ${isBullish ? 'text-green-600' : 'text-red-600'}`}>
              {flowData.call_put_ratio.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full ${isBullish ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(flowData.call_put_ratio * 20, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isBullish ? 'Bullish (More Calls)' : 'Bearish (More Puts)'}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('most_active')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'most_active'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Most Active ({flowData.most_active.length})
          </button>
          <button
            onClick={() => setActiveTab('unusual')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'unusual'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unusual ({flowData.unusual_activity.length})
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'zones'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Accumulation Zones
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'most_active' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2">Strike</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Volume</th>
                    <th className="text-right p-2">OI</th>
                    <th className="text-right p-2">Price</th>
                    <th className="text-right p-2">IV</th>
                  </tr>
                </thead>
                <tbody>
                  {flowData.most_active.map((opt, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-2 font-medium">{formatPrice(opt.strike)}</td>
                      <td className="p-2">
                        <Badge variant={opt.option_type === 'CALL' ? 'bullish' : 'bearish'} className="text-xs">
                          {opt.option_type}
                        </Badge>
                      </td>
                      <td className="p-2 text-right">{formatVolume(opt.volume)}</td>
                      <td className="p-2 text-right">{formatVolume(opt.open_interest)}</td>
                      <td className="p-2 text-right">{formatPrice(opt.last_price)}</td>
                      <td className="p-2 text-right">
                        {opt.implied_volatility ? `${(opt.implied_volatility * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'unusual' && (
          <div>
            <div className="space-y-3">
              {flowData.unusual_activity.map((activity, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={activity.option_type === 'CALL' ? 'bullish' : 'bearish'}>
                        {activity.option_type}
                      </Badge>
                      <span className="font-semibold">{formatPrice(activity.strike)}</span>
                      <span className="text-xs text-gray-500">{activity.expiration}</span>
                    </div>
                    <Badge variant="bearish" className="text-xs">
                      Unusual
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Volume:</span>{' '}
                      <span className="font-medium">{formatVolume(activity.volume)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">OI:</span>{' '}
                      <span className="font-medium">{formatVolume(activity.open_interest)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">V/OI:</span>{' '}
                      <span className="font-medium">{activity.volume_oi_ratio.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {activity.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'zones' && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              {/* Call Accumulation Zones */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-green-600">Call Accumulation</h4>
                <div className="space-y-2">
                  {flowData.accumulation_zones.calls.map((zone, idx) => (
                    <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{formatPrice(zone.strike)}</span>
                        <span className="text-xs text-gray-500">{zone.expiration}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Vol: {formatVolume(zone.total_volume)} | OI: {formatVolume(zone.total_oi)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Put Accumulation Zones */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-red-600">Put Accumulation</h4>
                <div className="space-y-2">
                  {flowData.accumulation_zones.puts.map((zone, idx) => (
                    <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{formatPrice(zone.strike)}</span>
                        <span className="text-xs text-gray-500">{zone.expiration}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Vol: {formatVolume(zone.total_volume)} | OI: {formatVolume(zone.total_oi)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

