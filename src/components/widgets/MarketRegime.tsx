import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { marketApi } from '../../lib/api';

interface MarketContext {
  date: string;
  spy_change_pct: number;
  qqq_change_pct: number;
  vix_level: number;
  direction: string;
  trend_strength: number;
  news_sentiment: string;
  key_headlines: string[];
  regime: string;
  favor_longs: boolean;
  favor_shorts: boolean;
  reduce_size: boolean;
  avoid_trading: boolean;
  reasoning: string;
  timestamp: string;
}

export function MarketRegime() {
  const [context, setContext] = useState<MarketContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContext();
    // Refresh every 5 minutes
    const interval = setInterval(loadContext, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadContext = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketApi.getContext();
      setContext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market context');
      console.error('Error loading market context:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDirectionEmoji = (direction: string): string => {
    switch (direction) {
      case 'UP':
        return '⬆️';
      case 'DOWN':
        return '⬇️';
      case 'CHOP':
        return '↔️';
      default:
        return '❓';
    }
  };

  const getDirectionColor = (direction: string): string => {
    switch (direction) {
      case 'UP':
        return 'text-accent-green';
      case 'DOWN':
        return 'text-accent-red';
      case 'CHOP':
        return 'text-accent-orange';
      default:
        return 'text-text-secondary';
    }
  };

  const getRegimeColor = (regime: string): string => {
    if (regime.includes('TRENDING_UP') || regime.includes('BREAKOUT')) {
      return 'bg-accent-green/10 border-accent-green/30';
    }
    if (regime.includes('TRENDING_DOWN') || regime.includes('BREAKDOWN')) {
      return 'bg-accent-red/10 border-accent-red/30';
    }
    return 'bg-accent-orange/10 border-accent-orange/30';
  };

  const getVIXColor = (vix: number): string => {
    if (vix >= 25) return 'text-accent-red';
    if (vix <= 15) return 'text-accent-green';
    return 'text-accent-orange';
  };

  if (loading && !context) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">📊 Market Regime</h2>
        </div>
        <div className="text-text-secondary text-center py-8">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">📊 Market Regime</h2>
        </div>
        <div className="text-accent-red text-center py-8">Error: {error}</div>
      </Card>
    );
  }

  if (!context) {
    return null;
  }

  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">📊 Market Regime</h2>
        <Badge variant={context.direction === 'UP' ? 'bullish' : context.direction === 'DOWN' ? 'bearish' : 'neutral'}>
          {context.regime}
        </Badge>
      </div>

      {/* Direction Display - BIG */}
      <div className="mb-6 text-center">
        <div className="text-6xl mb-2">{getDirectionEmoji(context.direction)}</div>
        <div className={`text-3xl font-bold mb-2 ${getDirectionColor(context.direction)}`}>
          {context.direction}
        </div>
        <div className="text-text-secondary text-sm">
          Trend Strength: {context.trend_strength.toFixed(0)}%
        </div>
        
        {/* Trend Strength Gauge */}
        <div className="mt-3 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full ${
              context.direction === 'UP' ? 'bg-accent-green' : 
              context.direction === 'DOWN' ? 'bg-accent-red' : 
              'bg-accent-orange'
            }`}
            style={{ width: `${context.trend_strength}%` }}
          />
        </div>
      </div>

      {/* Regime Badge */}
      <div className={`mb-4 p-3 rounded-lg border ${getRegimeColor(context.regime)} text-center`}>
        <div className="text-sm text-text-muted mb-1">Current Regime</div>
        <div className="text-lg font-semibold text-text-primary">{context.regime}</div>
      </div>

      {/* Price Action */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-bg-tertiary rounded-lg p-3 text-center">
          <div className="text-text-muted text-xs mb-1">SPY</div>
          <div className={`text-lg font-semibold ${context.spy_change_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {context.spy_change_pct >= 0 ? '+' : ''}{context.spy_change_pct.toFixed(2)}%
          </div>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3 text-center">
          <div className="text-text-muted text-xs mb-1">QQQ</div>
          <div className={`text-lg font-semibold ${context.qqq_change_pct >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            {context.qqq_change_pct >= 0 ? '+' : ''}{context.qqq_change_pct.toFixed(2)}%
          </div>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3 text-center">
          <div className="text-text-muted text-xs mb-1">VIX</div>
          <div className={`text-lg font-semibold ${getVIXColor(context.vix_level)}`}>
            {context.vix_level.toFixed(1)}
          </div>
        </div>
      </div>

      {/* News Sentiment */}
      <div className="mb-4">
        <div className="text-text-secondary text-xs mb-2">News Sentiment</div>
        <div className="flex items-center gap-2">
          <Badge variant={context.news_sentiment === 'BULLISH' ? 'bullish' : context.news_sentiment === 'BEARISH' ? 'bearish' : 'neutral'}>
            {context.news_sentiment}
          </Badge>
          {context.key_headlines && context.key_headlines.length > 0 && (
            <span className="text-xs text-text-muted">
              {context.key_headlines.length} headline{context.key_headlines.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {context.key_headlines && context.key_headlines.length > 0 && (
          <div className="mt-2 space-y-1">
            {context.key_headlines.slice(0, 2).map((headline, idx) => (
              <div key={idx} className="text-xs text-text-secondary truncate">
                • {headline}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trading Recommendations */}
      <div className="mb-4">
        <div className="text-text-secondary text-xs mb-2">Trading Recommendations</div>
        <div className="space-y-2">
          {context.favor_longs && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent-green">✅</span>
              <span className="text-text-primary">Favor LONG signals</span>
            </div>
          )}
          {context.favor_shorts && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent-red">✅</span>
              <span className="text-text-primary">Favor SHORT signals</span>
            </div>
          )}
          {context.reduce_size && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent-orange">⚠️</span>
              <span className="text-text-primary">Reduce position size (high VIX)</span>
            </div>
          )}
          {context.avoid_trading && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent-red">❌</span>
              <span className="text-text-primary">AVOID TRADING (choppy market)</span>
            </div>
          )}
          {!context.favor_longs && !context.favor_shorts && !context.reduce_size && !context.avoid_trading && (
            <div className="text-sm text-text-muted">No specific recommendations</div>
          )}
        </div>
      </div>

      {/* Reasoning */}
      {context.reasoning && (
        <div className="mb-4 p-3 bg-bg-tertiary rounded-lg">
          <div className="text-text-secondary text-xs mb-1">Reasoning</div>
          <div className="text-sm text-text-primary">{context.reasoning}</div>
        </div>
      )}

      <div className="card-footer">
        <span className="text-text-muted">
          Updated {context.timestamp ? new Date(context.timestamp).toLocaleTimeString() : 'Never'}
        </span>
        <button
          onClick={loadContext}
          className="text-accent-blue hover:text-accent-blue/80 text-sm"
        >
          Refresh
        </button>
      </div>
    </Card>
  );
}

