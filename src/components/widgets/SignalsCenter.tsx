import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { signalsApi, dpApi } from '../../lib/api';

interface Signal {
  id: string;
  symbol: string;
  type: string;
  action: string;
  confidence: number;
  entry_price: number;
  stop_price: number;
  target_price: number;
  risk_reward: number;
  reasoning: string[];
  warnings: string[];
  timestamp: string;
  source: string;
  is_master: boolean;
  position_size_pct?: number;
  position_size_dollars?: number;
}

interface SignalResponse {
  signals: Signal[];
  count: number;
  master_count: number;
  timestamp: string;
}

export function SignalsCenter() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [masterSignals, setMasterSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'master' | 'high'>('all');
  const [dpConfluence, setDpConfluence] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSignals();
    // Refresh every 10 seconds
    const interval = setInterval(loadSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check which signals have DP confluence
    checkDpConfluence();
  }, [signals]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allSignals, masterOnly] = await Promise.all([
        signalsApi.getAll(),
        signalsApi.getMaster()
      ]);

      setSignals(allSignals.signals || []);
      setMasterSignals(masterOnly.signals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals');
      console.error('Error loading signals:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkDpConfluence = async () => {
    try {
      const divergenceSignals = await dpApi.getDivergenceSignals();
      const confluenceSymbols = new Set(
        divergenceSignals.signals
          .filter((s: any) => s.signal_type === 'DP_CONFLUENCE')
          .map((s: any) => s.symbol)
      );
      setDpConfluence(confluenceSymbols);
    } catch (err) {
      console.error('Error checking DP confluence:', err);
    }
  };

  const getSignalTier = (confidence: number, isMaster: boolean): 'MASTER' | 'HIGH' | 'WATCH' => {
    if (isMaster || confidence >= 75) return 'MASTER';
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

  const getActionBadge = (action: string): 'bullish' | 'bearish' | 'neutral' => {
    if (action === 'LONG' || action === 'BUY') return 'bullish';
    if (action === 'SHORT' || action === 'SELL') return 'bearish';
    return 'neutral';
  };

  const filteredSignals = filter === 'all' 
    ? signals 
    : filter === 'master' 
      ? masterSignals 
      : signals.filter(s => s.confidence >= 60 && s.confidence < 75);

  if (loading && signals.length === 0) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">Active Signals</h2>
        </div>
        <div className="text-text-secondary text-center py-8">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">Active Signals</h2>
        </div>
        <div className="text-accent-red text-center py-8">Error: {error}</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">Active Signals</h2>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{signals.length} Total</Badge>
          <Badge variant="bullish">{masterSignals.length} Master</Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('master')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'master'
              ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          }`}
        >
          🎯 Master
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            filter === 'high'
              ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30'
              : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
          }`}
        >
          ⚡ High
        </button>
      </div>

      {/* Signals List */}
      {filteredSignals.length === 0 ? (
        <div className="text-text-muted text-sm text-center py-8">
          No {filter === 'all' ? '' : filter} signals active
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredSignals.map((signal) => {
            const tier = getSignalTier(signal.confidence, signal.is_master);
            const hasConfluence = dpConfluence.has(signal.symbol);
            
            return (
              <div
                key={signal.id}
                className={`p-4 rounded-lg border ${getTierColor(tier)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">{getTierBadge(tier)}</span>
                    <span className="font-semibold text-text-primary">{signal.symbol}</span>
                    <Badge variant={getActionBadge(signal.action)}>
                      {signal.action}
                    </Badge>
                    <Badge variant="neutral">{signal.confidence.toFixed(0)}%</Badge>
                    <Badge variant="neutral">{signal.type}</Badge>
                    {hasConfluence && (
                      <Badge variant="bullish" className="bg-accent-gold/20 text-accent-gold border-accent-gold/30">
                        🎯 DP Confluence
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                  <div>
                    <span className="text-text-muted">Entry:</span>{' '}
                    <span className="text-text-primary font-semibold">
                      ${signal.entry_price.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Stop:</span>{' '}
                    <span className="text-accent-red">
                      ${signal.stop_price.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Target:</span>{' '}
                    <span className="text-accent-green">
                      ${signal.target_price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-text-secondary mb-1">
                  R/R: {signal.risk_reward.toFixed(2)}:1
                  {signal.position_size_pct && (
                    <span className="ml-2">Size: {signal.position_size_pct.toFixed(1)}%</span>
                  )}
                </div>

                {signal.reasoning && signal.reasoning.length > 0 && (
                  <div className="text-xs text-text-muted mt-2">
                    {signal.reasoning[0]}
                  </div>
                )}

                {signal.warnings && signal.warnings.length > 0 && (
                  <div className="text-xs text-accent-orange mt-1">
                    ⚠️ {signal.warnings[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card-footer">
        <span className="text-text-muted">
          {masterSignals.length} Master Signals | Updated {new Date().toLocaleTimeString()}
        </span>
        <button
          onClick={loadSignals}
          className="text-accent-blue hover:text-accent-blue/80 text-sm"
        >
          Refresh
        </button>
      </div>
    </Card>
  );
}
