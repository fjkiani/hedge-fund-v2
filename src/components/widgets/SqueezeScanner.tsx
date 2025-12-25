import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SqueezeCandidate {
  symbol: string;
  score: number;
  si_score: number;
  borrow_fee_score: number;
  ftd_score: number;
  dp_support_score: number;
  short_interest_pct: number;
  borrow_fee_pct: number;
  ftd_spike_ratio: number;
  dp_buying_pressure: number;
  entry_price: number;
  stop_price: number;
  target_price: number;
  risk_reward_ratio: number;
  reasoning: string[];
  warnings: string[];
  nearest_dp_support: number | null;
  nearest_dp_resistance: number | null;
  days_to_cover: number | null;
  volume_ratio: number | null;
  price_change_5d: number | null;
  timestamp: string;
}

interface SqueezeScanResponse {
  candidates: SqueezeCandidate[];
  count: number;
  timestamp: string;
}

interface SqueezeScannerProps {
  minScore?: number;
  maxResults?: number;
  autoRefresh?: boolean;
}

type SortField = 'score' | 'short_interest_pct' | 'borrow_fee_pct' | 'ftd_spike_ratio' | 'price_change_5d';
type SortDirection = 'asc' | 'desc';

export function SqueezeScanner({ 
  minScore = 55,
  maxResults = 20,
  autoRefresh = true
}: SqueezeScannerProps) {
  const [candidates, setCandidates] = useState<SqueezeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState({
    minScore: minScore,
    minSI: 15.0,
    minBorrowFee: 0.0
  });
  const [priceData, setPriceData] = useState<Record<string, any[]>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch squeeze candidates
  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const params = new URLSearchParams({
        min_score: filters.minScore.toString(),
        max_results: maxResults.toString()
      });
      
      const url = `${apiUrl}/api/v1/squeeze/scan?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }
      
      const data: SqueezeScanResponse = await response.json();
      
      // Apply filters
      let filtered = data.candidates.filter(c => 
        c.short_interest_pct >= filters.minSI &&
        c.borrow_fee_pct >= filters.minBorrowFee
      );
      
      // Sort
      filtered.sort((a, b) => {
        let aVal: number, bVal: number;
        
        switch (sortField) {
          case 'score':
            aVal = a.score;
            bVal = b.score;
            break;
          case 'short_interest_pct':
            aVal = a.short_interest_pct;
            bVal = b.short_interest_pct;
            break;
          case 'borrow_fee_pct':
            aVal = a.borrow_fee_pct;
            bVal = b.borrow_fee_pct;
            break;
          case 'ftd_spike_ratio':
            aVal = a.ftd_spike_ratio;
            bVal = b.ftd_spike_ratio;
            break;
          case 'price_change_5d':
            aVal = a.price_change_5d || 0;
            bVal = b.price_change_5d || 0;
            break;
          default:
            return 0;
        }
        
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
      
      setCandidates(filtered);
      
      // Fetch price data for sparklines
      for (const candidate of filtered.slice(0, 10)) {
        if (!priceData[candidate.symbol]) {
          fetchPriceData(candidate.symbol);
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch squeeze candidates');
      log.error('Error fetching squeeze candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch 5-day price data for sparkline
  const fetchPriceData = async (symbol: string) => {
    try {
      // Use yfinance via backend or direct API call
      // For now, generate mock data (replace with real API call)
      const mockData = Array.from({ length: 5 }, (_, i) => ({
        day: i + 1,
        price: 100 + Math.random() * 10
      }));
      setPriceData(prev => ({ ...prev, [symbol]: mockData }));
    } catch (err) {
      log.error(`Error fetching price data for ${symbol}:`, err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCandidates();
  }, [filters.minScore, filters.minSI, filters.minBorrowFee, sortField, sortDirection]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchCandidates();
    }, 60000); // Every 60 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, filters, sortField, sortDirection]);

  // WebSocket for real-time updates
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/api/v1/websocket/signals`);
    
    ws.onopen = () => {
      setWsConnected(true);
      log.info('✅ WebSocket connected for squeeze scanner');
    };
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'SQUEEZE_ALERT' || msg.channel === 'squeeze') {
          // Refresh candidates when new squeeze detected
          fetchCandidates();
        }
      } catch (err) {
        log.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onerror = (error) => {
      log.error('WebSocket error:', error);
      setWsConnected(false);
    };
    
    ws.onclose = () => {
      setWsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (autoRefresh) {
          wsRef.current = new WebSocket(`${wsUrl}/api/v1/websocket/signals`);
        }
      }, 3000);
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [autoRefresh]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-accent-green';
    if (score >= 60) return 'text-accent-orange';
    return 'text-accent-red';
  };

  const getScoreBadgeVariant = (score: number): 'bullish' | 'neutral' | 'bearish' => {
    if (score >= 75) return 'bullish';
    if (score >= 60) return 'neutral';
    return 'bearish';
  };

  if (loading && candidates.length === 0) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">Squeeze Scanner</h2>
        </div>
        <div className="p-8 text-center text-text-muted">
          <div className="animate-pulse">Loading squeeze candidates...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">Squeeze Scanner</h2>
        </div>
        <div className="p-8 text-center">
          <div className="text-accent-red mb-2">❌ Error</div>
          <div className="text-text-muted text-sm">{error}</div>
          <button 
            onClick={fetchCandidates}
            className="mt-4 px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-lg hover:bg-accent-blue/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title">Squeeze Scanner</h2>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{candidates.length} Candidates</Badge>
          {wsConnected && (
            <span className="text-accent-green text-xs" title="WebSocket connected">● Live</span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 p-3 bg-bg-tertiary rounded-lg border border-border-subtle">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Min Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseFloat(e.target.value) || 0 }))}
              className="w-full px-2 py-1 bg-bg-primary border border-border-subtle rounded text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Min SI %</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={filters.minSI}
              onChange={(e) => setFilters(prev => ({ ...prev, minSI: parseFloat(e.target.value) || 0 }))}
              className="w-full px-2 py-1 bg-bg-primary border border-border-subtle rounded text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Min Borrow Fee %</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={filters.minBorrowFee}
              onChange={(e) => setFilters(prev => ({ ...prev, minBorrowFee: parseFloat(e.target.value) || 0 }))}
              className="w-full px-2 py-1 bg-bg-primary border border-border-subtle rounded text-sm text-text-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted">
              <th className="text-left p-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('score')}>
                Score {sortField === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2">Symbol</th>
              <th className="text-left p-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('short_interest_pct')}>
                SI % {sortField === 'short_interest_pct' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('borrow_fee_pct')}>
                Borrow % {sortField === 'borrow_fee_pct' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2">Days to Cover</th>
              <th className="text-left p-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('ftd_spike_ratio')}>
                FTD Spike {sortField === 'ftd_spike_ratio' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('price_change_5d')}>
                5D Change {sortField === 'price_change_5d' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-2">Chart</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-text-muted">
                  No squeeze candidates found
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => {
                const isExpanded = expandedSymbol === candidate.symbol;
                const sparklineData = priceData[candidate.symbol] || [];
                
                return (
                  <tr
                    key={candidate.symbol}
                    className="border-b border-border-subtle/50 hover:bg-bg-tertiary cursor-pointer transition-colors"
                    onClick={() => setExpandedSymbol(isExpanded ? null : candidate.symbol)}
                  >
                    <td className="p-2">
                      <Badge variant={getScoreBadgeVariant(candidate.score)}>
                        <span className={getScoreColor(candidate.score)}>
                          {candidate.score.toFixed(0)}
                        </span>
                      </Badge>
                    </td>
                    <td className="p-2 font-semibold text-text-primary">{candidate.symbol}</td>
                    <td className="p-2 text-text-secondary">{candidate.short_interest_pct.toFixed(1)}%</td>
                    <td className="p-2 text-text-secondary">{candidate.borrow_fee_pct.toFixed(1)}%</td>
                    <td className="p-2 text-text-secondary">
                      {candidate.days_to_cover ? candidate.days_to_cover.toFixed(1) : 'N/A'}
                    </td>
                    <td className="p-2 text-text-secondary">{candidate.ftd_spike_ratio.toFixed(2)}x</td>
                    <td className="p-2">
                      {candidate.price_change_5d !== null ? (
                        <span className={candidate.price_change_5d >= 0 ? 'text-accent-green' : 'text-accent-red'}>
                          {candidate.price_change_5d >= 0 ? '+' : ''}{candidate.price_change_5d.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-text-muted">N/A</span>
                      )}
                    </td>
                    <td className="p-2">
                      {sparklineData.length > 0 ? (
                        <div className="w-16 h-8">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                              <Line
                                type="monotone"
                                dataKey="price"
                                stroke={candidate.price_change_5d && candidate.price_change_5d >= 0 ? '#00ff88' : '#ff3366'}
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs">Loading...</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded Details */}
      {expandedSymbol && (
        <div className="mt-4 p-4 bg-bg-tertiary rounded-lg border border-border-subtle">
          {(() => {
            const candidate = candidates.find(c => c.symbol === expandedSymbol);
            if (!candidate) return null;
            
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">{candidate.symbol} - Full Analysis</h3>
                  <button
                    onClick={() => setExpandedSymbol(null)}
                    className="text-text-muted hover:text-text-primary"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-text-muted mb-1">Entry/Stop/Target</div>
                    <div className="text-sm text-text-primary">
                      Entry: ${candidate.entry_price.toFixed(2)} | 
                      Stop: ${candidate.stop_price.toFixed(2)} | 
                      Target: ${candidate.target_price.toFixed(2)}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      R/R: {candidate.risk_reward_ratio.toFixed(2)}:1
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-text-muted mb-1">Component Scores</div>
                    <div className="text-xs text-text-secondary space-y-1">
                      <div>SI Score: {candidate.si_score.toFixed(1)}</div>
                      <div>Borrow Score: {candidate.borrow_fee_score.toFixed(1)}</div>
                      <div>FTD Score: {candidate.ftd_score.toFixed(1)}</div>
                      <div>DP Support: {candidate.dp_support_score.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
                
                {candidate.nearest_dp_support && (
                  <div>
                    <div className="text-xs text-text-muted mb-1">Dark Pool Levels</div>
                    <div className="text-sm text-text-secondary">
                      Support: ${candidate.nearest_dp_support.toFixed(2)} | 
                      Resistance: {candidate.nearest_dp_resistance ? `$${candidate.nearest_dp_resistance.toFixed(2)}` : 'N/A'}
                    </div>
                  </div>
                )}
                
                {candidate.reasoning.length > 0 && (
                  <div>
                    <div className="text-xs text-text-muted mb-1">Reasoning</div>
                    <ul className="text-sm text-text-secondary list-disc list-inside space-y-1">
                      {candidate.reasoning.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {candidate.warnings.length > 0 && (
                  <div>
                    <div className="text-xs text-accent-red mb-1">⚠️ Warnings</div>
                    <ul className="text-sm text-accent-red/80 list-disc list-inside space-y-1">
                      {candidate.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      <div className="card-footer">
        <span className="text-text-muted">
          {candidates.length > 0 && `Top ${candidates.length} candidates`}
        </span>
        <button
          onClick={fetchCandidates}
          className="text-accent-blue hover:text-accent-blue/80 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </Card>
  );
}

// Simple logger
const log = {
  info: (...args: any[]) => console.log('[SqueezeScanner]', ...args),
  error: (...args: any[]) => console.error('[SqueezeScanner]', ...args)
};

