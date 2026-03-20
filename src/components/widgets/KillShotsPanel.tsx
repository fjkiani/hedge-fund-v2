/**
 * ⚔️ Kill Shots Panel — Zeta Divergence Score (v2)
 *
 * Fetches /kill-shots-live and renders:
 *   - Multi-layer divergence score with score ring
 *   - Verdict + action line
 *   - Layer breakdown with source_date + slug traceability
 *   - LLM-powered plain-English explanations (expandable)
 *   - Conviction reasons with slugs
 *
 * Endpoint response (v2):
 *   { divergence_score, verdict, action, layers, reasons, explanations, timestamp }
 */

import { useState, useEffect, useCallback } from 'react';

interface KillShotsData {
  divergence_score: number;
  verdict: 'BOOST' | 'NEUTRAL' | 'SOFT_VETO' | 'HARD_VETO';
  action: string;
  layers: Record<string, any>;
  reasons: string[];
  explanations: Record<string, string>;
  timestamp: string;
  error?: string;
}

const MONITOR_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

const VERDICT_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  BOOST:     { bg: 'rgba(34,197,94,0.08)',  border: '#22c55e', text: '#4ade80', icon: '🚀' },
  NEUTRAL:   { bg: 'rgba(250,204,21,0.08)', border: '#facc15', text: '#fde047', icon: '⚖️' },
  SOFT_VETO: { bg: 'rgba(251,146,60,0.08)', border: '#fb923c', text: '#fdba74', icon: '⚠️' },
  HARD_VETO: { bg: 'rgba(239,68,68,0.08)',  border: '#ef4444', text: '#f87171', icon: '🛑' },
};

function scoreColor(score: number): string {
  if (score >= 8) return '#22c55e';
  if (score >= 5) return '#facc15';
  if (score >= 1) return '#fb923c';
  return '#ef4444';
}

function formatGexDollars(gex: number): string {
  const abs = Math.abs(gex);
  if (abs >= 1e9) return `${(gex / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(gex / 1e6).toFixed(0)}M`;
  return gex.toLocaleString();
}

export function KillShotsPanel() {
  const [data, setData] = useState<KillShotsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (title: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${MONITOR_URL}/kill-shots-live`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setError(null);

      // Auto-expand cards with score >= 2 (ARMED state)
      const autoExpand = new Set<string>();
      const layers = json.layers || {};
      if ((layers.brain_boost ?? 0) >= 2) autoExpand.add('BRAIN');
      if ((layers.cot_boost ?? 0) >= 2) autoExpand.add('COT');
      if ((layers.gex_boost ?? 0) >= 2) autoExpand.add('GEX');
      if ((layers.combined_boost ?? 0) >= 2) autoExpand.add('COMBINED');
      if (layers.fed_dp_divergence) autoExpand.add('FED vs DP');
      if (autoExpand.size > 0) setExpandedCards(autoExpand);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch kill shots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  /* ── Loading state ── */
  if (loading && !data) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center animate-pulse text-text-muted font-mono">
        ⚔️ Scanning Kill Shots divergence layers…
      </div>
    );
  }

  /* ── Error state ── */
  if (error && !data) {
    return (
      <div className="glass-panel rounded-xl p-4 flex justify-between items-center border border-red-500/30">
        <span className="text-sm text-red-400 font-mono">❌ Kill Shots: {error}</span>
        <button onClick={fetchData} className="text-xs px-3 py-1 bg-red-500/20 rounded hover:bg-red-500/30 text-red-300">
          RETRY
        </button>
      </div>
    );
  }

  if (!data) return null;

  const vs = VERDICT_STYLES[data.verdict] || VERDICT_STYLES.NEUTRAL;
  const l = data.layers || {};
  const explanations = data.explanations || {};

  /* ── Layer cards with traceability ── */
  const layerCards = [
    {
      title: 'BRAIN',
      value: l.brain_boost ?? '—',
      detail: l.brain_error ? `err: ${l.brain_error}` : `${(l.brain_reasons || []).length} conviction signals`,
      active: (l.brain_boost ?? 0) > 0,
      sourceDate: l.brain_source_date,
      slug: l.brain_slug,
    },
    {
      title: 'COT',
      value: l.cot_boost ?? '—',
      detail: l.cot_error ? `err: ${l.cot_error}` :
        l.cot_specs_net !== undefined ? `specs ${Number(l.cot_specs_net).toLocaleString()} / comms ${Number(l.cot_comm_net).toLocaleString()}` : 'no data',
      active: (l.cot_boost ?? 0) > 0,
      sourceDate: l.cot_source_date,
      slug: l.cot_slug,
    },
    {
      title: 'GEX',
      value: l.gex_boost ?? '—',
      detail: l.gex_error ? `err: ${l.gex_error}` :
        l.total_gex_dollars !== undefined
          ? `$${formatGexDollars(l.total_gex_dollars)} · ${l.gex_regime || '—'}${l.gex_gamma_flip ? ` · flip ${l.gex_gamma_flip.toFixed(0)}` : ''}`
          : `${l.gex_regime || '—'}`,
      active: (l.gex_boost ?? 0) > 0,
      sourceDate: l.gex_source_date,
      slug: l.gex_slug,
      armed: (l.gex_boost ?? 0) >= 2,
    },
    {
      title: 'COMBINED',
      value: l.combined_boost ?? '—',
      detail: (l.combined_boost ?? 0) > 0
        ? 'GEX + COT convergence confirmed'
        : l.gex_regime?.includes('NEGATIVE') && (l.cot_boost ?? 0) >= 3
          ? 'Coil loaded via GEX section (+2 already scored)'
          : 'No cross-layer amplification',
      active: (l.combined_boost ?? 0) > 0 || ((l.gex_boost ?? 0) >= 2),
      sourceDate: l.combined_timestamp ? l.combined_timestamp.split('T')[0] : undefined,
      slug: l.combined_slug,
    },
    {
      title: 'FED vs DP',
      value: l.fed_dp_divergence ? '+3' : '0',
      detail: l.dp_error ? `err: ${l.dp_error}` :
        `SPY SV% ${l.spy_short_vol_pct ?? '?'}${l.fed_dp_divergence ? ' · HAWKISH + DP LOADING' : ''}`,
      active: !!l.fed_dp_divergence,
      sourceDate: l.fed_dp_source_date,
      slug: l.fed_dp_slug,
    },
  ];

  return (
    <div
      className="glass-panel rounded-xl overflow-hidden"
      style={{ borderColor: vs.border, borderWidth: '1px', borderStyle: 'solid' }}
    >
      {/* ── Header: Score ring + Verdict ── */}
      <div
        className="p-5 flex items-center justify-between"
        style={{ background: vs.bg }}
      >
        <div className="flex items-center gap-5">
          {/* Score circle */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: 72, height: 72 }}
          >
            <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke={scoreColor(data.divergence_score)}
                strokeWidth="5"
                strokeDasharray={`${(data.divergence_score / 10) * 175.9} 175.9`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <span className="text-2xl font-black" style={{ color: scoreColor(data.divergence_score) }}>
              {data.divergence_score}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{vs.icon}</span>
              <span className="text-xl font-bold tracking-tight" style={{ color: vs.text }}>
                {data.verdict}
              </span>
            </div>
            <p className="text-sm text-text-muted font-mono">{data.action}</p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-text-muted">
          <div>⚔️ KILL SHOTS LIVE</div>
          <div>{new Date(data.timestamp).toLocaleTimeString()}</div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="mt-1 px-2 py-0.5 bg-white/5 rounded hover:bg-white/10 transition text-text-muted"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {/* ── Layer breakdown with traceability ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-white/5 border-t border-white/5">
        {layerCards.map((lc) => {
          const isExpanded = expandedCards.has(lc.title);
          const isArmed = (lc as any).armed || (lc.active && (Number(lc.value) >= 2));
          const explanation = explanations[lc.title === 'FED vs DP' ? 'FED_DP' : lc.title] || '';

          return (
            <div
              key={lc.title}
              className={`p-3 transition cursor-pointer ${isArmed ? 'bg-green-500/[0.06]' : 'hover:bg-white/[0.02]'}`}
              onClick={() => explanation && toggleCard(lc.title)}
              style={isArmed ? { boxShadow: `inset 0 0 20px ${scoreColor(Number(lc.value))}15` } : {}}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{lc.title}</span>
                <span className={lc.active ? 'text-green-400' : 'text-text-muted/40'}>
                  {isArmed ? '🔥' : lc.active ? '✅' : '⚪'}
                </span>
              </div>
              <div className="text-xl font-black text-text-primary">+{lc.value}</div>
              <div className="text-[9px] text-text-muted mt-1 leading-tight line-clamp-2">{lc.detail}</div>

              {/* Source date + slug */}
              {lc.sourceDate && (
                <div className="text-[8px] text-text-muted/50 mt-1 font-mono truncate">
                  📅 {lc.sourceDate}
                </div>
              )}

              {/* LLM Explanation — expanded or auto-expanded when armed */}
              {explanation && (isExpanded || isArmed) && (
                <div className="mt-2 text-[10px] text-text-secondary leading-snug bg-white/[0.03] rounded p-2 border border-white/5">
                  💡 {explanation}
                </div>
              )}

              {/* Slug for traceability */}
              {lc.slug && isExpanded && (
                <div className="text-[7px] text-text-muted/30 mt-1 font-mono truncate" title={lc.slug}>
                  🔗 {lc.slug}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Conviction reasons ── */}
      {data.reasons.length > 0 && (
        <div className="border-t border-white/5 p-4 space-y-1.5">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2">
            Conviction Signals ({data.reasons.length})
          </div>
          {data.reasons.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-text-secondary font-mono bg-white/[0.02] rounded px-3 py-2"
            >
              <span className="text-accent-purple mt-0.5 shrink-0">→</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── GEX Detail Banner (when real dollar GEX is available) ── */}
      {l.total_gex_dollars !== undefined && (
        <div className="border-t border-white/5 px-4 py-2 flex items-center gap-3 text-[10px] font-mono text-text-muted">
          <span>📊 SPX GEX: <strong className={l.total_gex_dollars < 0 ? 'text-red-400' : 'text-green-400'}>
            ${formatGexDollars(l.total_gex_dollars)}
          </strong></span>
          {l.gex_gamma_flip && <span>· Flip: {l.gex_gamma_flip.toFixed(0)}</span>}
          {l.gex_spot_price && <span>· Spot: {l.gex_spot_price.toFixed(2)}</span>}
          {l.gex_max_pain && <span>· MaxPain: {l.gex_max_pain.toFixed(0)}</span>}
          {l.vix && <span>· VIX: {l.vix}</span>}
          <span className="text-text-muted/40">src: {l.gex_source || 'CBOE'}</span>
        </div>
      )}
    </div>
  );
}
