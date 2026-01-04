import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { dpApi } from '../../lib/api';

interface DPEdgeStats {
  win_rate: number;
  total_interactions: number;
  bounces: number;
  breaks: number;
  breakeven_rr: number;
  expected_pnl_per_trade: number;
  cumulative_pnl: number;
}

interface DPDivergenceSignal {
  symbol: string;
  direction: string;
  signal_type: string;
  confidence: number;
  entry_price: number;
  stop_pct: number;
  target_pct: number;
  reasoning: string;
  dp_bias: string;
  options_bias?: string;
  dp_strength: number;
  has_divergence: boolean;
  timestamp: string;
}

export function DPEdgeDashboard() {
  const [stats, setStats] = useState<DPEdgeStats | null>(null);
  const [signals, setSignals] = useState<DPDivergenceSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load stats and signals in parallel
      const [statsData, signalsData] = await Promise.all([
        dpApi.getEdgeStats(),
        dpApi.getDivergenceSignals()
      ]);

      setStats(statsData);
      setSignals(signalsData.signals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DP edge data');
      console.error('Error loading DP edge data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSignalTier = (confidence: number, signalType: string): 'MASTER' | 'HIGH' | 'WATCH' => {
    if (confidence >= 75) return 'MASTER';
    if (confidence >= 60) return 'HIGH';
    return 'WATCH';
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'MASTER':
        return 'border-accent-gold/50 bg-accent-gold/10';
      case 'HIGH':
        return 'border-accent-orange/50 bg-accent-orange/10';
      default:
        return 'border-accent-blue/50 bg-accent-blue/10';
    }
  };

  const getTierBadge = (tier: string): string => {
    switch (tier) {
      case 'MASTER':
        return '🎯';
      case 'HIGH':
        return '⚡';
      default:
        return '📊';
    }
  };

  if (loading && !stats) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">🔥 DP Edge Dashboard</h2>
        </div>
        <div className="text-text-secondary text-center py-8">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">🔥 DP Edge Dashboard</h2>
        </div>
        <div className="text-accent-red text-center py-8">Error: {error}</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">🔥 DP Edge Dashboard</h2>
        <Badge variant="bullish">PROVEN EDGE</Badge>
      </div>

      {/* Win Rate Display - BIG AND PROUD */}
      {stats && (
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-accent-gold mb-2">
              {stats.win_rate.toFixed(1)}%
            </div>
            <div className="text-text-secondary text-sm">Win Rate (PROVEN)</div>
            <div className="text-text-muted text-xs mt-1">
              {stats.bounces} wins / {stats.breaks} losses
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-bg-tertiary rounded-lg p-3 text-center">
              <div className="text-text-muted text-xs mb-1">Total Trades</div>
              <div className="text-lg font-semibold">{stats.total_interactions}</div>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-3 text-center">
              <div className="text-text-muted text-xs mb-1">Break-even R/R</div>
              <div className="text-lg font-semibold text-accent-green">
                {stats.breakeven_rr.toFixed(3)}
              </div>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-3 text-center">
              <div className="text-text-muted text-xs mb-1">EV per Trade</div>
              <div className="text-lg font-semibold text-accent-green">
                +{stats.expected_pnl_per_trade.toFixed(4)}%
              </div>
            </div>
          </div>

          {/* Bounces vs Breaks Bar */}
          <div className="mb-4">
            <div className="text-text-secondary text-xs mb-2">Outcome Distribution</div>
            <div className="flex h-6 rounded overflow-hidden">
              <div
                className="bg-accent-green flex items-center justify-center text-xs font-semibold"
                style={{ width: `${(stats.bounces / stats.total_interactions) * 100}%` }}
              >
                {stats.bounces}
              </div>
              <div
                className="bg-accent-red flex items-center justify-center text-xs font-semibold"
                style={{ width: `${(stats.breaks / stats.total_interactions) * 100}%` }}
              >
                {stats.breaks}
              </div>
            </div>
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>Bounces (Wins)</span>
              <span>Breaks (Losses)</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Signals Feed */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Live Signals</h3>
          <Badge variant="neutral">{signals.length} Active</Badge>
        </div>

        {signals.length === 0 ? (
          <div className="text-text-muted text-sm text-center py-4">
            No active signals (waiting for setup)
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal, idx) => {
              const tier = getSignalTier(signal.confidence, signal.signal_type);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${getTierColor(tier)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getTierBadge(tier)}</span>
                      <span className="font-semibold text-text-primary">{signal.symbol}</span>
                      <Badge variant={signal.direction === 'LONG' ? 'bullish' : 'bearish'}>
                        {signal.direction}
                      </Badge>
                      <Badge variant="neutral">{signal.confidence}%</Badge>
                    </div>
                  </div>

                  <div className="text-sm text-text-secondary mb-2">
                    {signal.signal_type === 'DP_CONFLUENCE' ? (
                      <span className="text-accent-gold">🎯 DP Confluence</span>
                    ) : (
                      <span className="text-accent-orange">⚡ Options Divergence</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-text-muted">Entry:</span>{' '}
                      <span className="text-text-primary">${signal.entry_price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Stop:</span>{' '}
                      <span className="text-accent-red">-{signal.stop_pct.toFixed(2)}%</span>
                    </div>
                    <div>
                      <span className="text-text-muted">Target:</span>{' '}
                      <span className="text-accent-green">+{signal.target_pct.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="text-xs text-text-muted">
                    {signal.reasoning}
                  </div>

                  {signal.options_bias && (
                    <div className="mt-2 text-xs">
                      <span className="text-text-muted">DP:</span> {signal.dp_bias} |{' '}
                      <span className="text-text-muted">Options:</span> {signal.options_bias}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signal Type Breakdown */}
      {signals.length > 0 && (
        <div className="mb-4">
          <div className="text-text-secondary text-xs mb-2">Signal Type Breakdown</div>
          <div className="space-y-2">
            {['DP_CONFLUENCE', 'OPTIONS_DIVERGENCE'].map((type) => {
              const typeSignals = signals.filter((s) => s.signal_type === type);
              if (typeSignals.length === 0) return null;

              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">
                    {type === 'DP_CONFLUENCE' ? '🎯 DP Confluence' : '⚡ Options Divergence'}:
                  </span>
                  <span className="text-text-primary font-semibold">
                    {typeSignals.length} signal{typeSignals.length !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card-footer">
        <span className="text-text-muted">
          Updated {stats ? new Date().toLocaleTimeString() : 'Never'}
        </span>
        <button
          onClick={loadData}
          className="text-accent-blue hover:text-accent-blue/80 text-sm"
        >
          Refresh
        </button>
      </div>
    </Card>
  );
}

