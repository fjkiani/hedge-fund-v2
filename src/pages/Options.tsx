/**
 * Options Page — Options flow analysis via CBOE data
 * Backend: GET /api/v1/options/{symbol}/flow → CBOE delayed options
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { optionsApi } from '../lib/api';
import { useIntradaySnapshot } from '../hooks/useIntradaySnapshot';

const SYMBOLS = ['SPY', 'QQQ', 'IWM', 'AAPL', 'NVDA', 'TSLA'] as const;

interface OptionsFlowItem {
  strike: number;
  expiration: string;
  type: 'CALL' | 'PUT';
  volume: number;
  open_interest: number;
  implied_volatility: number;
  delta: number;
  gamma: number;
  premium: number;
  unusual: boolean;
  signal?: string;
}

interface OptionsFlowResponse {
  symbol: string;
  flow: OptionsFlowItem[];
  summary?: {
    total_call_volume: number;
    total_put_volume: number;
    put_call_ratio: number;
    unusual_count: number;
  };
  timestamp: string;
}

export function Options() {
  const [searchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol')?.toUpperCase() || 'SPY';
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [data, setData] = useState<OptionsFlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { snapshot: intradaySnap } = useIntradaySnapshot();
  const thesisValid = intradaySnap ? (intradaySnap.thesis_valid || !intradaySnap.market_open) : true;

  const fetchFlow = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await optionsApi.flow(symbol) as OptionsFlowResponse;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load options flow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlow();
    const interval = setInterval(fetchFlow, 60000);
    return () => clearInterval(interval);
  }, [symbol]);

  const fmt = (n: number, decimals = 0) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(decimals);
  };

  return (
    <main style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {!thesisValid && (
        <div style={{
          width: '100%', padding: '0.75rem 1.25rem', marginBottom: '1rem',
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          border: '2px solid #ef4444', borderRadius: '0.75rem', color: '#fff',
          boxShadow: '0 0 20px rgba(220,38,38,0.25)',
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            ⛔ THESIS INVALIDATED — options flow shown for reference only
          </div>
          {intradaySnap?.thesis_invalidation_reason && (
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.125rem' }}>
              {intradaySnap.thesis_invalidation_reason}
            </div>
          )}
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Options Flow
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(148, 163, 184, 0.8)', marginTop: '0.25rem' }}>
            Unusual options activity from CBOE delayed data
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SYMBOLS.map(s => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: symbol === s ? 600 : 400,
                background: symbol === s ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                border: symbol === s ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: symbol === s ? '#6ee7b7' : 'rgba(148, 163, 184, 0.8)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && (
        <Card>
          <div className="p-8 text-center text-text-muted">
            <div className="animate-pulse">Loading options flow for {symbol}...</div>
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <div className="p-8 text-center">
            <div className="text-accent-red mb-2">❌ {error}</div>
            <button
              onClick={fetchFlow}
              className="mt-2 px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-lg hover:bg-accent-blue/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </Card>
      )}

      {data && (
        <>
          {/* Summary Stats */}
          {data.summary && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}>
              <Card>
                <div className="p-4 text-center">
                  <div className="text-xs text-text-muted mb-1">Call Volume</div>
                  <div className="text-lg font-bold" style={{ color: '#00ff88' }}>
                    {fmt(data.summary.total_call_volume)}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <div className="text-xs text-text-muted mb-1">Put Volume</div>
                  <div className="text-lg font-bold" style={{ color: '#ff3366' }}>
                    {fmt(data.summary.total_put_volume)}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <div className="text-xs text-text-muted mb-1">P/C Ratio</div>
                  <div className="text-lg font-bold text-text-primary">
                    {data.summary.put_call_ratio.toFixed(2)}
                  </div>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <div className="text-xs text-text-muted mb-1">Unusual Activity</div>
                  <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>
                    {data.summary.unusual_count}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Flow Table */}
          <Card>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span>📊</span>
                <h2 className="text-lg font-semibold text-text-primary">{symbol} Options Flow</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-text-muted">
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Strike</th>
                    <th className="text-left p-2">Exp</th>
                    <th className="text-right p-2">Volume</th>
                    <th className="text-right p-2">OI</th>
                    <th className="text-right p-2">IV</th>
                    <th className="text-right p-2">Premium</th>
                    <th className="text-left p-2">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.flow || []).slice(0, 30).map((item, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border-subtle/50 hover:bg-bg-tertiary transition-colors ${item.unusual ? 'bg-accent-orange/5' : ''}`}
                    >
                      <td className="p-2">
                        <Badge variant={item.type === 'CALL' ? 'bullish' : 'bearish'}>
                          {item.type}
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-mono text-text-primary">${item.strike}</td>
                      <td className="p-2 text-text-secondary">{item.expiration}</td>
                      <td className="p-2 text-right text-text-primary font-semibold">{fmt(item.volume)}</td>
                      <td className="p-2 text-right text-text-secondary">{fmt(item.open_interest)}</td>
                      <td className="p-2 text-right text-text-secondary">{(item.implied_volatility * 100).toFixed(1)}%</td>
                      <td className="p-2 text-right text-text-primary">${fmt(item.premium)}</td>
                      <td className="p-2">
                        {item.unusual && (
                          <span className="text-accent-orange text-xs font-semibold">🔥 UNUSUAL</span>
                        )}
                        {item.signal && (
                          <span className="text-accent-blue text-xs ml-1">{item.signal}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!data.flow || data.flow.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-text-muted">
                        No options flow data available for {symbol}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}
