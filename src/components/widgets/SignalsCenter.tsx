import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { signalsApi, dpApi } from '../../lib/api';
import { DPPredictionBadge } from './DPPredictionBadge';
import { SignalSlug, type SignalData } from '../ui/SignalSlug';

interface SignalResponse {
  signals: SignalData[];
  count: number;
  master_count: number;
  timestamp: string;
  regime_tier?: number;
  regime_veto?: boolean;
  reason?: string;
}

export function SignalsCenter() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [masterSignals, setMasterSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'master' | 'high'>('all');
  const [dpConfluence, setDpConfluence] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [regimeTier, setRegimeTier] = useState<number>(1);

  useEffect(() => {
    loadSignals();
    const interval = setInterval(loadSignals, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkDpConfluence();
  }, [signals]);

  const loadSignals = async () => {
    try {
      setLoading(true);
      const [allRes, masterRes] = await Promise.allSettled([
        signalsApi.getAll() as Promise<SignalResponse>,
        signalsApi.getMaster() as Promise<SignalResponse>
      ]);

      if (allRes.status === 'fulfilled') {
        setSignals(allRes.value?.signals || []);
        setRegimeTier(allRes.value?.regime_tier ?? 1);
      }
      if (masterRes.status === 'fulfilled') setMasterSignals(masterRes.value?.signals || []);
      setError(null);
    } catch {
      // Silently fail — signals widget is informational, not critical
    } finally {
      setLoading(false);
    }
  };

  const checkDpConfluence = async () => {
    try {
      const divergenceSignals = await dpApi.getDivergenceSignals() as { signals: any[] };
      const confluenceSymbols = new Set<string>(
        (divergenceSignals?.signals || [])
          .filter((s: any) => s.signal_type === 'DP_CONFLUENCE')
          .map((s: any) => s.symbol as string)
      );
      setDpConfluence(confluenceSymbols);
    } catch {
      // Non-critical
    }
  };

  const handleShowOnChart = (symbol: string, levels: { entry: number; target: number; stop: number }) => {
    // Navigate to dashboard with signal overlay params
    const params = new URLSearchParams({
      symbol,
      signal_entry: levels.entry.toString(),
      signal_target: levels.target.toString(),
      signal_stop: levels.stop.toString(),
    });
    window.location.href = `/?${params.toString()}`;
  };

  const handleTakeTrade = async (signal: SignalData) => {
    try {
      const result = await signalsApi.takeTrade(signal.id) as any;
      if (result?.status === 'already_tracked') {
        alert(`Already tracking ${signal.symbol} — ${result.outcome}`);
      } else {
        alert(`📊 Now tracking ${signal.action} ${signal.symbol} @ $${signal.entry_price.toFixed(2)}`);
      }
    } catch {
      alert('Failed to register trade — check backend connection');
    }
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
          <h2 className="card-title">Live Trading Signals</h2>
        </div>
        <div className="text-text-secondary text-center py-8">Loading signals...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="card-header">
          <h2 className="card-title">Live Trading Signals</h2>
        </div>
        <div className="text-accent-red text-center py-8">Error: {error}</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="card-header">
        <h2 className="card-title flex items-center gap-2">
          <span className="live-indicator !w-2 !h-2 !mr-0"></span>LIVE TRADING SIGNALS
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">{signals.length} Total</Badge>
          <Badge variant="bullish">{masterSignals.length} Master</Badge>
        </div>
      </div>

      {/* Regime Badge */}
      {(() => {
        const badgeConfig: Record<number, { label: string; bg: string; color: string; border: string }> = {
          1: { label: 'TIER 1 — CALM', bg: 'rgba(0, 200, 83, 0.1)', color: '#00c853', border: 'rgba(0, 200, 83, 0.3)' },
          2: { label: 'TIER 2 — LONGS PERMITTED', bg: 'rgba(0, 200, 83, 0.1)', color: '#00c853', border: 'rgba(0, 200, 83, 0.3)' },
          3: { label: 'TIER 3 — LONGS SUPPRESSED', bg: 'rgba(255, 165, 0, 0.12)', color: '#ffa726', border: 'rgba(255, 165, 0, 0.3)' },
          4: { label: 'REGIME VETO — ALL SIGNALS SUPPRESSED', bg: 'rgba(255, 50, 50, 0.15)', color: '#ff5252', border: 'rgba(255, 50, 50, 0.4)' },
        };
        const cfg = badgeConfig[regimeTier] || badgeConfig[1];
        const isTier4 = regimeTier >= 4;
        return (
          <div style={{
            padding: isTier4 ? '10px 16px' : '6px 12px',
            marginBottom: '12px',
            borderRadius: '8px',
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            color: cfg.color,
            fontSize: isTier4 ? '13px' : '11px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            textAlign: isTier4 ? 'center' : 'left',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {isTier4 ? '🚨 ' : '◈ '}{cfg.label}
          </div>
        );
      })()}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all ${filter === 'all'
            ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
            : 'bg-bg-tertiary text-text-muted hover:text-white border border-white/5 hover:border-white/20'
            }`}
        >
          ALL SIGNALS
        </button>
        <button
          onClick={() => setFilter('master')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all flex items-center gap-1 ${filter === 'master'
            ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]'
            : 'bg-bg-tertiary text-text-muted hover:text-white border border-white/5 hover:border-white/20'
            }`}
        >
          <span>🎯</span> MASTER
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all flex items-center gap-1 ${filter === 'high'
            ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/40 shadow-[0_0_10px_rgba(255,165,0,0.2)]'
            : 'bg-bg-tertiary text-text-muted hover:text-white border border-white/5 hover:border-white/20'
            }`}
        >
          <span>⚡</span> HIGH CONVICTION
        </button>
      </div>

      {/* Signals List */}
      {filteredSignals.length === 0 ? (
        <div className="text-text-muted text-sm text-center py-12 bg-black/20 rounded-xl border border-white/5">
          No {filter === 'all' ? '' : filter} signals active in the current regime.
        </div>
      ) : (
        <div className="space-y-3 max-h-[700px] overflow-y-auto sidebar-scroll pr-2">
          {filteredSignals.map((signal) => (
            <div key={signal.id} className="relative">
              <SignalSlug
                signal={signal}
                isExpanded={expandedId === signal.id}
                onToggle={() => setExpandedId(expandedId === signal.id ? null : signal.id)}
                onShowOnChart={handleShowOnChart}
                onTakeTrade={handleTakeTrade}
              />
              
              {/* DP Confluence Overlay */}
              {dpConfluence.has(signal.symbol) && !expandedId && (
                <div className="absolute top-3 right-24">
                  <DPPredictionBadge symbol={signal.symbol} compact />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card-footer mt-4 pt-4 border-t border-border-subtle flex justify-between items-center">
        <span className="text-xs font-mono text-text-muted">
          {masterSignals.length} MASTER / {signals.length} TOTAL | UPDATED {new Date().toLocaleTimeString()}
        </span>
        <button
          onClick={loadSignals}
          className="text-accent-blue hover:text-accent-blue/80 text-xs font-bold tracking-wider uppercase"
        >
          [ REFRESH ]
        </button>
      </div>
    </Card>
  );
}
