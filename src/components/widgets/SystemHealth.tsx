import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { healthApi } from '../../lib/api';

interface CheckerHealth {
  name: string;
  display_name: string;
  emoji: string;
  status: 'healthy' | 'warning' | 'error' | 'disabled' | 'n/a';
  last_run: string | null;
  last_success: string | null;
  last_error: string | null;
  alerts_today: number;
  alerts_24h: int;
  win_rate_7d: number | null;
  total_trades_7d: number;
  expected_interval: number;
  run_conditions: string;
  time_since_last_run: string | null;
}

interface HealthSummary {
  total_checkers: number;
  healthy: number;
  warning: number;
  error: number;
  disabled: number;
  not_applicable: number;
  checkers: CheckerHealth[];
  timestamp: string;
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChecker, setExpandedChecker] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
    // Refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthApi.getCheckers();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system health');
      console.error('Error loading system health:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'border-accent-green/50 bg-accent-green/10';
      case 'warning':
        return 'border-accent-orange/50 bg-accent-orange/10';
      case 'error':
        return 'border-accent-red/50 bg-accent-red/10';
      case 'disabled':
        return 'border-text-muted/50 bg-bg-tertiary';
      case 'n/a':
        return 'border-accent-blue/50 bg-accent-blue/10';
      default:
        return 'border-border-subtle bg-bg-tertiary';
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'disabled':
        return '🔒';
      case 'n/a':
        return '⏸️';
      default:
        return '❓';
    }
  };

  if (loading && !health) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">🩺 System Health</h2>
        </div>
        <div className="text-text-secondary text-center py-8">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">🩺 System Health</h2>
        </div>
        <div className="text-accent-red text-center py-8">Error: {error}</div>
      </Card>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">🩺 System Health</h2>
        <div className="flex items-center gap-2">
          <Badge variant="bullish">{health.healthy} Healthy</Badge>
          {health.warning > 0 && (
            <Badge variant="neutral">{health.warning} Warning</Badge>
          )}
          {health.error > 0 && (
            <Badge variant="bearish">{health.error} Error</Badge>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="bg-bg-tertiary rounded-lg p-2 text-center">
          <div className="text-text-muted text-xs mb-1">Total</div>
          <div className="text-lg font-semibold">{health.total_checkers}</div>
        </div>
        <div className="bg-accent-green/10 rounded-lg p-2 text-center border border-accent-green/30">
          <div className="text-text-muted text-xs mb-1">Healthy</div>
          <div className="text-lg font-semibold text-accent-green">{health.healthy}</div>
        </div>
        <div className="bg-accent-orange/10 rounded-lg p-2 text-center border border-accent-orange/30">
          <div className="text-text-muted text-xs mb-1">Warning</div>
          <div className="text-lg font-semibold text-accent-orange">{health.warning}</div>
        </div>
        <div className="bg-accent-red/10 rounded-lg p-2 text-center border border-accent-red/30">
          <div className="text-text-muted text-xs mb-1">Error</div>
          <div className="text-lg font-semibold text-accent-red">{health.error}</div>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-2 text-center">
          <div className="text-text-muted text-xs mb-1">N/A</div>
          <div className="text-lg font-semibold">{health.not_applicable}</div>
        </div>
      </div>

      {/* Checker Grid */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {health.checkers.map((checker) => (
          <div
            key={checker.name}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${getStatusColor(checker.status)}`}
            onClick={() => setExpandedChecker(expandedChecker === checker.name ? null : checker.name)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{checker.emoji}</span>
                <span className="font-semibold text-text-primary">{checker.display_name}</span>
                <span className="text-lg">{getStatusBadge(checker.status)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span>Last: {checker.time_since_last_run || 'Never'}</span>
                <span>Alerts: {checker.alerts_24h}</span>
                {checker.win_rate_7d !== null && (
                  <span className="text-accent-green">
                    WR: {checker.win_rate_7d.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedChecker === checker.name && (
              <div className="mt-3 pt-3 border-t border-border-subtle space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-text-muted">Status:</span>{' '}
                    <span className="text-text-primary font-semibold uppercase">{checker.status}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Run Conditions:</span>{' '}
                    <span className="text-text-primary">{checker.run_conditions}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Expected Interval:</span>{' '}
                    <span className="text-text-primary">{Math.floor(checker.expected_interval / 60)}m</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Alerts Today:</span>{' '}
                    <span className="text-text-primary">{checker.alerts_today}</span>
                  </div>
                </div>
                {checker.last_success && (
                  <div>
                    <span className="text-text-muted">Last Success:</span>{' '}
                    <span className="text-text-primary">
                      {new Date(checker.last_success).toLocaleString()}
                    </span>
                  </div>
                )}
                {checker.last_error && (
                  <div className="text-accent-red">
                    <span className="text-text-muted">Last Error:</span>{' '}
                    {checker.last_error}
                  </div>
                )}
                {checker.win_rate_7d !== null && (
                  <div>
                    <span className="text-text-muted">7-Day Performance:</span>{' '}
                    <span className="text-accent-green font-semibold">
                      {checker.win_rate_7d.toFixed(1)}% WR ({checker.total_trades_7d} trades)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card-footer">
        <span className="text-text-muted">
          Updated {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Never'}
        </span>
        <button
          onClick={loadHealth}
          className="text-accent-blue hover:text-accent-blue/80 text-sm"
        >
          Refresh
        </button>
      </div>
    </Card>
  );
}

