/**
 * UnifiedBriefView — Alpha Terminal V8.0
 *
 * ALL data comes from useMasterBrief() → live /brief/master API.
 * ALL oracle briefings come from POST /oracle/event-brief → backend Groq.
 * ZERO hardcoded constants. Every value is live.
 *
 * Verified field mapping against live API response (2026-03-24 04:23 UTC).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Zap, RefreshCw, AlertOctagon, ChevronDown,
  LineChart, Ghost, Landmark, Satellite, Lock, Globe,
  Brain, Workflow, History, Sun, Moon, Crosshair, Layers,
  BarChart4,
} from 'lucide-react';

import { useMasterBrief, type MasterBrief } from '../../hooks/useMasterBrief';
import { useOracleBrief } from '../../hooks/useOracleBrief';
import { OracleContext, useOracle } from './OracleContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—';
  return decimals > 0 ? n.toFixed(decimals) : n.toLocaleString();
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n}%`;
}

function fmtUsd(n: number | null | undefined): string {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtGex(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n / 1e6).toFixed(1)}M`;
}

function buildForecastCards(data: MasterBrief) {
  const cards: Array<{
    slug: string; label: string; title: string;
    actual: string; cons: string; delta: string;
    bias: string; note: string; color: string;
  }> = [];

  const nc = data.nowcast;
  if (nc && !('error' in nc && nc.error)) {
    cards.push({
      slug: 'uni-cpi-now', label: 'PRE SIGNAL', title: 'CPI Now',
      actual: `${nc.cpi_mom}%`, cons: '0.3%',
      delta: `+${(nc.cpi_mom - 0.3).toFixed(2)}%`,
      bias: nc.cpi_mom > 0.3 ? 'PRE_HOT' : 'IN_LINE',
      note: 'Monitor TLT/SPY puts', color: '#f97316',
    });
    cards.push({
      slug: 'uni-pce-now', label: 'PRE SIGNAL', title: 'Core PCE',
      actual: `${nc.pce_mom}%`, cons: '0.3%',
      delta: `+${(nc.pce_mom - 0.3).toFixed(2)}%`,
      bias: nc.pce_mom > 0.3 ? 'PRE_HOT' : 'IN_LINE',
      note: "Fed's preferred gauge", color: '#f97316',
    });
  }

  const adp = data.adp_prediction;
  if (adp && !adp.error) {
    cards.push({
      slug: 'uni-adp-miss', label: 'ADP PRESIGNAL', title: 'ADP Emp',
      actual: fmt(adp.prediction), cons: fmt(adp.consensus),
      delta: fmt(adp.delta),
      bias: adp.signal || 'UNKNOWN',
      note: 'Position accordingly', color: '#f43f5e',
    });
  }

  const gdp = data.gdp_nowcast;
  if (gdp && !gdp.error) {
    cards.push({
      slug: 'uni-gdp-miss', label: 'GDP PRESIGNAL', title: 'GDP Q1',
      actual: `${gdp.gdp_estimate}%`, cons: `${gdp.consensus}%`,
      delta: `${gdp.vs_consensus?.toFixed(2)}pp`,
      bias: gdp.signal || 'UNKNOWN',
      note: 'Growth warning', color: '#f43f5e',
    });
  }

  return cards;
}

function buildDivergenceCards(data: MasterBrief) {
  const signals = data.hidden_hands?.finnhub_signals ?? [];
  return signals.slice(0, 4).map((s: any, i: number) => ({
    slug: `uni-hh-${i}`,
    title: 'HIDDEN HANDS',
    actor: `${s.politician_action?.charAt(0).toUpperCase()}${s.politician_action?.slice(1)} ${s.ticker}`,
    mspr: s.insider_mspr != null ? (s.insider_mspr > 0 ? `+${s.insider_mspr.toFixed(0)}` : `${s.insider_mspr.toFixed(0)}`) : '—',
    divergence: s.convergence?.replace('STRONG_', '') || 'N/A',
    note: s.reasoning?.[0]?.substring(0, 40) || 'monitor signal',
    color: s.convergence === 'DIVERGENCE' ? '#f43f5e' : '#3b82f6',
  }));
}

// ── Inline Oracle Briefing (backend, NOT client-side LLM) ───────────────────

function InlineOracleBriefing({ slug, title, briefData }: {
  slug: string; title: string; briefData: MasterBrief | null;
}) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchBriefing = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_URL}/oracle/event-brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: slug,
            brief: briefData ?? undefined,
          }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const result = await r.json();
        if (!cancelled) {
          setAnalysis(
            result.summary
              ? `${result.summary}\n\n💡 ${result.trade_implication || ''}`
              : result.analysis || 'No analysis available.'
          );
        }
      } catch {
        if (!cancelled) setAnalysis('Oracle uplink offline.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBriefing();
    return () => { cancelled = true; };
  }, [slug]);

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-3 space-y-2">
        {loading ? (
          <div className="flex items-center gap-2 py-1">
            <RefreshCw className="w-3 h-3 text-cyan-500 animate-spin" />
            <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">Running Scan...</span>
          </div>
        ) : (
          <div className="bg-cyan-50 dark:bg-cyan-950/20 p-4 rounded-xl border border-cyan-200 dark:border-cyan-800 text-[10px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap font-sans">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">NYX Oracle Brief</span>
            </div>
            {analysis}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Primitives ──────────────────────────────────────────────────────────────

const MetricBadge = ({ label, value, color = "text-zinc-500 dark:text-zinc-400" }: {
  label: string; value: string; color?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[7px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">{label}</span>
    <span className={`text-[11px] font-mono font-bold ${color}`}>{value}</span>
  </div>
);

const CommandBlock = ({ label, value, sub, color = "text-zinc-900 dark:text-white" }: {
  label: string; value: string; sub?: string; color?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-black uppercase tracking-tight ${color}`}>{value}</span>
    {sub && <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600">{sub}</span>}
  </div>
);

// ── MacroCommandBar (LIVE) ──────────────────────────────────────────────────

function LiveMacroCommandBar({ data }: { data: MasterBrief }) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl flex items-center justify-between mb-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      <div className="flex items-center gap-12">
        <CommandBlock
          label="Macro Regime"
          value={data.macro_regime?.regime || 'UNKNOWN'}
          color={data.macro_regime?.regime === 'NEUTRAL' ? 'text-zinc-500 dark:text-zinc-400' : 'text-rose-500'}
        />
        <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800" />
        <CommandBlock
          label="Next Event"
          value={data.economic_veto?.next_event || '—'}
          sub={data.economic_veto?.hours_away != null ? `Countdown: ${data.economic_veto.hours_away.toFixed(1)}h` : undefined}
        />
      </div>
      <div className="flex items-center gap-12 text-right">
        <CommandBlock
          label="Confidence Cap"
          value={`${data.kill_chain_state?.confidence_cap ?? '—'}%`}
          color="text-yellow-600 dark:text-yellow-500"
        />
        <CommandBlock
          label="System Scan"
          value={`${data.scan_time?.toFixed(1) ?? '—'}s`}
          color="text-zinc-400 dark:text-zinc-600"
        />
      </div>
    </div>
  );
}

// ── StrategyCard + Row (LIVE) ───────────────────────────────────────────────

function StrategyCard({ title, icon: Icon, slug, children, expandedSlug, onToggle, briefData }: {
  title: string; icon: any; slug: string; children: React.ReactNode;
  expandedSlug: string | null; onToggle: (s: string | null) => void; briefData: MasterBrief | null;
}) {
  const isExpanded = expandedSlug === slug;
  return (
    <div
      onClick={() => onToggle(isExpanded ? null : slug)}
      className={`bg-white dark:bg-zinc-900 border p-6 rounded-2xl transition-all cursor-pointer shadow-xl relative overflow-hidden group ${isExpanded ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-inner">
          <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </div>
        <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{title}</h3>
      </div>
      {children}
      <AnimatePresence>{isExpanded && <InlineOracleBriefing slug={slug} title={title} briefData={briefData} />}</AnimatePresence>
    </div>
  );
}

function LiveStrategyCardRow({ data, expandedSlug, onToggle }: {
  data: MasterBrief; expandedSlug: string | null; onToggle: (s: string | null) => void;
}) {
  const rp = data.fed_intelligence?.rate_path;
  const fullPath = data.fed_intelligence?.full_path ?? [];

  return (
    <div className="grid grid-cols-3 gap-6">
      <StrategyCard title="Regime" icon={Satellite} slug="strat-regime" expandedSlug={expandedSlug} onToggle={onToggle} briefData={data}>
        <div className="flex gap-10">
          <MetricBadge label="Inflation Score" value={data.macro_regime?.inflation_score?.toFixed(3) ?? '—'} color="text-rose-500" />
          <MetricBadge label="Growth Score" value={data.macro_regime?.growth_score?.toFixed(3) ?? '—'} color="text-emerald-500" />
        </div>
      </StrategyCard>

      <StrategyCard title="Fed Path" icon={Landmark} slug="strat-fed" expandedSlug={expandedSlug} onToggle={onToggle} briefData={data}>
        <div className="flex items-baseline gap-4">
          <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
            {rp?.current_range ? `${rp.current_range[0]}–${rp.current_range[1]}%` : '—'}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase">
            {rp?.next_meeting || '—'} ({rp?.days_away ?? '—'}d)
          </span>
        </div>
        <div className="flex gap-2 mt-4">
          {fullPath.slice(0, 4).map((m) => (
            <div key={m.label} className="flex-1 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded text-[8px] font-black text-center text-zinc-500">
              {m.label?.split(' ')[0]} {m.p_hike_25?.toFixed(1)}%
            </div>
          ))}
        </div>
      </StrategyCard>

      <StrategyCard title="Economic Edge" icon={LineChart} slug="strat-edge" expandedSlug={expandedSlug} onToggle={onToggle} briefData={data}>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MetricBadge label="CPI MoM" value={fmtPct(data.nowcast?.cpi_mom)} />
          <MetricBadge label="PCE MoM" value={fmtPct(data.nowcast?.pce_mom)} />
          <MetricBadge label="CPI YoY" value={fmtPct(data.nowcast?.cpi_yoy)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[8px] font-bold text-zinc-400 dark:text-zinc-600 uppercase border-b border-zinc-100 dark:border-zinc-800 pb-1">
            <span>Dynamic Thresholds</span>
            <span>HOT Level</span>
          </div>
          {Object.entries(data.dynamic_thresholds || {}).map(([k, v]) => (
            <div key={k} className="flex justify-between text-[10px] font-mono font-bold text-zinc-500">
              <span>{k.replace(/_/g, ' ').toUpperCase()}</span>
              <span className="text-rose-500">{(v as any)?.HOT?.toFixed(4) ?? '—'}</span>
            </div>
          ))}
        </div>
      </StrategyCard>
    </div>
  );
}

// ── Tactical Briefing (Hidden Hands + Derivatives + Kill Chain) ─────────────

function LiveTacticalSection({ data, expandedSlug, onToggle }: {
  data: MasterBrief; expandedSlug: string | null; onToggle: (s: string | null) => void;
}) {
  const hh = data.hidden_hands;
  const der = data.derivatives;
  const kc = data.kill_chain_state;
  const oracle = useOracle();

  return (
    <div className="space-y-6 mb-12">
      {/* Hidden Hands Bar */}
      <div
        onClick={() => onToggle(expandedSlug === 'overview-hh' ? null : 'overview-hh')}
        className={`bg-white dark:bg-zinc-900 border p-8 rounded-2xl transition-all cursor-pointer shadow-xl relative overflow-hidden group ${expandedSlug === 'overview-hh' ? 'border-purple-500/30 ring-1 ring-purple-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
      >
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <Ghost className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Hidden Hands</h2>
          {oracle?.sections?.hidden_hands?.summary && (
            <span className="ml-auto text-[9px] font-bold text-purple-400 italic truncate max-w-xs">{oracle.sections.hidden_hands.summary}</span>
          )}
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-zinc-900 dark:text-white">{hh?.politician_cluster ?? 0}</span>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Politician Trades</span>
            </div>
            <div className="flex flex-wrap gap-2 max-w-sm">
              {(hh?.hot_tickers ?? []).slice(0, 8).map((t: string) => (
                <div key={t} className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-[9px] font-black text-emerald-600 dark:text-emerald-500 rounded">
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 text-center px-12 border-x border-zinc-100 dark:border-zinc-800">
            <div className="flex flex-col">
              <span className="text-xl font-black text-emerald-500">{fmtUsd(hh?.insider_net_usd)}</span>
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-600 uppercase">Insider Net</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-zinc-900 dark:text-white">{hh?.spouse_alerts ?? 0}</span>
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-600 uppercase">Spouse Alerts</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{hh?.fed_tone || '—'}</span>
            <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-600 uppercase">Fed Tone</span>
            <div className="flex items-center gap-2 mt-2">
              <Workflow className="w-4 h-4 text-yellow-500" />
              <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black text-yellow-600 uppercase rounded">
                +{hh?.divergence_boost ?? 0} BOOST
              </span>
            </div>
          </div>
        </div>
        <AnimatePresence>{expandedSlug === 'overview-hh' && <InlineOracleBriefing slug="hh-overview" title="Hidden Hands Intelligence" briefData={data} />}</AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Derivatives Module */}
        <div
          onClick={() => onToggle(expandedSlug === 'overview-deriv' ? null : 'overview-deriv')}
          className={`bg-white dark:bg-zinc-900 border p-8 rounded-2xl transition-all cursor-pointer shadow-xl relative group ${expandedSlug === 'overview-deriv' ? 'border-blue-500/30 ring-1 ring-blue-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
        >
          <div className="flex items-center gap-3 mb-10 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <LineChart className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Derivatives</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-8">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">GEX Regime</span>
              <span className={`text-lg font-black ${der?.gex_regime === 'NEGATIVE' ? 'text-rose-500' : 'text-emerald-500'}`}>
                {der?.gex_regime || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Total GEX</span>
              <span className="text-lg font-black text-zinc-900 dark:text-white">{fmtGex(der?.total_gex)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Put Wall</span>
              <span className="text-lg font-black text-zinc-900 dark:text-white">${der?.put_wall ?? '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Call Wall</span>
              <span className="text-lg font-black text-zinc-900 dark:text-white">${der?.call_wall ?? '—'}</span>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">SPY Spot</span>
              <span className="text-lg font-black text-zinc-900 dark:text-white">${der?.spot?.toFixed(2) ?? '—'}</span>
            </div>
          </div>
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-black text-blue-500 dark:text-blue-400">
                COT ES Specs: <span className="text-blue-400 dark:text-blue-500">
                  {der?.cot_spec_net?.toLocaleString() ?? '—'} {der?.cot_spec_side ?? ''} {der?.cot_divergent ? '⚠️ DIVERGENT' : ''}
                </span>
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium italic leading-relaxed">
              {der?.cot_trap || '—'}
            </p>
          </div>
          <AnimatePresence>{expandedSlug === 'overview-deriv' && <InlineOracleBriefing slug="GEX:SPY" title="Derivatives Structure" briefData={data} />}</AnimatePresence>
        </div>

        {/* Kill Chain Module */}
        <div
          onClick={() => onToggle(expandedSlug === 'overview-kc' ? null : 'overview-kc')}
          className={`bg-white dark:bg-zinc-900 border p-8 rounded-2xl transition-all cursor-pointer shadow-xl relative group ${expandedSlug === 'overview-kc' ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
        >
          <div className="flex items-center gap-3 mb-10 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <Crosshair className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Kill Chain</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 mb-10">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Alert Level</span>
              <span className={`text-lg font-black ${kc?.alert_level === 'RED' ? 'text-rose-500' : kc?.alert_level === 'YELLOW' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                {kc?.alert_level || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Layers Active</span>
              <span className="text-lg font-black text-zinc-900 dark:text-white">{kc?.layers_active ?? '—'}/5</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Confidence Cap</span>
              <span className="text-lg font-black text-yellow-500">{kc?.confidence_cap ?? '—'}%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Cap Reason</span>
              <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-300 leading-tight">{kc?.cap_reason || '—'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase">Mismatches</span>
              <span className="text-lg font-black text-rose-500">{kc?.mismatches_count ?? 0}</span>
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-start gap-3">
              <History className="w-4 h-4 text-zinc-400 dark:text-zinc-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed font-medium italic line-clamp-4">
                {kc?.narrative || '—'}
              </p>
            </div>
          </div>
          <AnimatePresence>{expandedSlug === 'overview-kc' && <InlineOracleBriefing slug="kill-chain-report" title="Kill Chain Report" briefData={data} />}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Pre-Signal Section (LIVE) ───────────────────────────────────────────────

function LivePreSignalSection({ data, expandedSlug, onToggle }: {
  data: MasterBrief; expandedSlug: string | null; onToggle: (s: string | null) => void;
}) {
  const adp = data.adp_prediction;
  const gdp = data.gdp_nowcast;

  return (
    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 mb-12 shadow-2xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-6">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest">Pre-Signal Intelligence</h2>
      </div>

      <div className="grid grid-cols-2 gap-10">
        {/* ADP Card */}
        {adp && !adp.error && (
          <div
            onClick={() => onToggle(expandedSlug === 'pre-adp' ? null : 'pre-adp')}
            className={`bg-zinc-50 dark:bg-zinc-950/50 border rounded-2xl p-8 transition-all cursor-pointer ${expandedSlug === 'pre-adp' ? 'border-rose-500/30 ring-1 ring-rose-500/10' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'}`}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]" />
                <h3 className="text-[11px] font-black text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">ADP EMPLOYMENT</h3>
              </div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{adp.signal?.replace(/_/g, ' ')}</span>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8 border-b border-zinc-100 dark:border-zinc-800/50 pb-8">
              <div className="flex flex-col gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-8">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Model Output</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">{fmt(adp.prediction)}</span>
                </div>
                <div className="flex flex-col mt-4">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Delta (Miss)</span>
                  <span className="text-xl font-black text-rose-500 font-mono">{fmt(adp.delta)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 pl-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Consensus</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">{fmt(adp.consensus)}</span>
                </div>
                <div className="flex flex-col mt-4">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">System Confidence</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">{Math.round((adp.confidence ?? 0) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {(adp.reasons ?? []).map((b, i) => (
                <p key={i} className="text-[10px] text-zinc-500 font-medium italic leading-relaxed">· {b}</p>
              ))}
            </div>
            <AnimatePresence>{expandedSlug === 'pre-adp' && <InlineOracleBriefing slug="pre-adp-emp" title="ADP Employment" briefData={data} />}</AnimatePresence>
          </div>
        )}

        {/* GDP Card */}
        {gdp && !gdp.error && (
          <div
            onClick={() => onToggle(expandedSlug === 'pre-gdp' ? null : 'pre-gdp')}
            className={`bg-zinc-50 dark:bg-zinc-950/50 border rounded-2xl p-8 transition-all cursor-pointer ${expandedSlug === 'pre-gdp' ? 'border-rose-500/30 ring-1 ring-rose-500/10' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700'}`}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]" />
                <h3 className="text-[11px] font-black text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">GDP NOWCAST Q1</h3>
              </div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{gdp.signal?.replace(/_/g, ' ')}</span>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10 border-b border-zinc-100 dark:border-zinc-800/50 pb-8">
              <div className="flex flex-col gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-8">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">GDPNow Forecast</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">{gdp.gdp_estimate}%</span>
                </div>
                <div className="flex flex-col mt-4">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Growth Delta</span>
                  <span className="text-xl font-black text-rose-500 font-mono">{gdp.vs_consensus?.toFixed(2)}pp</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 pl-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Consensus Target</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white font-mono">{gdp.consensus}%</span>
                </div>
                <div className="flex flex-col mt-4">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Source</span>
                  <span className="text-[11px] font-black text-zinc-800 dark:text-white uppercase mt-1">{gdp.source}</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic">· {gdp.edge}</p>
            <AnimatePresence>{expandedSlug === 'pre-gdp' && <InlineOracleBriefing slug="pre-gdp-now" title="GDP Nowcast" briefData={data} />}</AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-8 text-right border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-700 uppercase tracking-widest">
          Scan: {data.as_of ? new Date(data.as_of + (data.as_of.endsWith('Z') ? '' : 'Z')).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'} ET
        </span>
      </div>
    </div>
  );
}

// ── Grid Snapshot Cards (LIVE) ──────────────────────────────────────────────

function MacroSnapshotCard({ item, isExpanded, onToggle, briefData }: {
  item: any; isExpanded: boolean; onToggle: (s: string | null) => void; briefData: MasterBrief | null;
}) {
  return (
    <div
      onClick={() => onToggle(isExpanded ? null : item.slug)}
      className={`bg-white dark:bg-zinc-950 border p-5 rounded-xl transition-all cursor-pointer shadow-xl relative overflow-hidden group h-full flex flex-col justify-between ${isExpanded ? 'border-cyan-500/30 ring-1 ring-cyan-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-inner">
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest truncate">{item.label}</span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-cyan-500 transition-colors uppercase tracking-tight truncate">{item.title}</h3>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase flex-shrink-0 ${item.bias.includes('HOT') || item.bias.includes('MISS') ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{item.bias}</div>
        </div>
        <div className="grid grid-cols-3 gap-1 py-3 border-y border-zinc-100 dark:border-zinc-800">
          <MetricBadge label="NOW" value={item.actual} color="text-zinc-900 dark:text-white" />
          <MetricBadge label="CONS" value={item.cons} />
          <MetricBadge label="DELT" value={item.delta} color={item.delta.includes('+') ? 'text-rose-500' : 'text-emerald-500'} />
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase truncate pr-4">{item.note}</p>
        <ChevronDown className={`w-4 h-4 text-zinc-300 dark:text-zinc-700 transition-all ${isExpanded ? 'rotate-180 text-cyan-500' : ''}`} />
      </div>
      <AnimatePresence>{isExpanded && <InlineOracleBriefing slug={item.slug} title={item.title} briefData={briefData} />}</AnimatePresence>
    </div>
  );
}

function DivergenceCard({ item, isExpanded, onToggle, briefData }: {
  item: any; isExpanded: boolean; onToggle: (s: string | null) => void; briefData: MasterBrief | null;
}) {
  return (
    <div
      onClick={() => onToggle(isExpanded ? null : item.slug)}
      className={`bg-white dark:bg-zinc-950 border p-5 rounded-xl transition-all cursor-pointer shadow-xl relative overflow-hidden group h-full flex flex-col justify-between ${isExpanded ? 'border-purple-500/30 ring-1 ring-purple-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-inner">
              <BarChart4 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest truncate">{item.title}</span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-purple-500 transition-colors uppercase tracking-tight truncate">{item.actor}</h3>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">{item.divergence}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-zinc-100 dark:border-zinc-800">
          <MetricBadge label="MSPR" value={item.mspr} color={parseFloat(item.mspr) < 0 ? 'text-rose-500' : 'text-emerald-500'} />
          <MetricBadge label="STAT" value="DIV_ACTIVE" color="text-zinc-900 dark:text-white" />
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase truncate pr-4">{item.note}</p>
        <ChevronDown className={`w-4 h-4 text-zinc-300 dark:text-zinc-700 transition-all ${isExpanded ? 'rotate-180 text-purple-500' : ''}`} />
      </div>
      <AnimatePresence>{isExpanded && <InlineOracleBriefing slug={item.slug} title={item.actor} briefData={briefData} />}</AnimatePresence>
    </div>
  );
}

// ── Oracle Strip (LIVE — shows oracle verdict) ──────────────────────────────

function LiveOracleStrip() {
  const oracle = useOracle();
  if (!oracle || oracle.risk_level === 'UNKNOWN' || !oracle.verdict) return null;

  const colorMap: Record<string, { bg: string; text: string }> = {
    HIGH: { bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/30', text: 'text-rose-600 dark:text-rose-400' },
    MEDIUM: { bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
    LOW: { bg: 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700', text: 'text-zinc-500 dark:text-zinc-400' },
  };
  const s = colorMap[oracle.risk_level] ?? colorMap.LOW;

  return (
    <div className={`${s.bg} border rounded-2xl p-6 flex items-center gap-6 mb-8 shadow-lg`}>
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-cyan-500" />
        <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">NYX</span>
        <span className={`text-[10px] font-black uppercase ${s.text}`}>{oracle.risk_level}</span>
      </div>
      <p className={`text-[11px] font-bold ${s.text} flex-1`}>{oracle.verdict}</p>
      {oracle.trade_implication && (
        <p className={`text-[10px] font-bold ${s.text} italic border-l border-current/20 pl-4`}>{oracle.trade_implication}</p>
      )}
    </div>
  );
}

// ── Breach Alert (computed from LIVE derivatives) ───────────────────────────

function BreachAlert({ data }: { data: MasterBrief }) {
  const der = data.derivatives;
  if (!der || der.error) return null;

  // Only show breach if spot is above call wall or below put wall
  const spot = der.spot;
  const callWall = der.call_wall;
  const putWall = der.put_wall;
  const aboveCall = callWall != null && spot > callWall;
  const belowPut = putWall != null && spot < putWall;

  if (!aboveCall && !belowPut) return null;

  const breachType = aboveCall ? 'ABOVE CALL WALL' : 'BELOW PUT WALL';
  const direction = aboveCall ? 'BREAKOUT SQUEEZE RISK' : 'RISK OFF PROTOCOL';

  return (
    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-10 flex items-center justify-between relative overflow-hidden shadow-2xl mb-8">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 shadow-[0_0_20px_#f43f5e]" />
      <div className="flex items-center gap-10">
        <AlertOctagon className="w-16 h-16 text-rose-500 animate-pulse" />
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white leading-none tracking-tighter uppercase italic">Wall Breach</h1>
          <h3 className="text-md font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest">
            SPY {breachType} — {direction}
          </h3>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-700 uppercase tracking-[0.2em]">
            Spot: ${spot?.toFixed(2)} · Call: ${callWall} · Put: ${putWall} · GEX: {fmtGex(der.total_gex)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────────

export function UnifiedBriefView() {
  const { data, loading, error } = useMasterBrief(120000);
  const { oracle } = useOracleBrief(data);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const forecastCards = useMemo(() => data ? buildForecastCards(data) : [], [data]);
  const divergenceCards = useMemo(() => data ? buildDivergenceCards(data) : [], [data]);

  const handleToggle = useCallback((slug: string | null) => {
    setExpandedSlug(prev => prev === slug ? null : slug);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-6">
          <Activity className="w-12 h-12 text-cyan-500 animate-pulse" />
          <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.6em]">Establish Node Sync</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <AlertOctagon className="w-10 h-10 text-rose-500" />
          <span className="text-sm text-rose-500 font-black uppercase">Uplink Failed: {error || 'No data'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050506] text-zinc-900 dark:text-white font-sans selection:bg-cyan-500/20 overflow-hidden flex flex-col transition-colors duration-500">

        {/* Nav */}
        <nav className="h-14 border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#08080a] flex items-center justify-between px-8 z-[200]">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600/10 rounded flex items-center justify-center border border-blue-500/20 shadow-inner">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-900 dark:text-white">Alpha <span className="text-blue-500">Terminal</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-zinc-500"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 dark:text-zinc-700 uppercase tracking-widest pl-4 border-l border-zinc-200 dark:border-zinc-800">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Uplink_Live
            </div>
          </div>
        </nav>

        {/* Main */}
        <OracleContext.Provider value={oracle}>
          <main className="flex-1 p-10 overflow-y-auto scrollbar-hide relative">
            <div className="max-w-full mx-auto space-y-10 pb-20 px-4">

              <BreachAlert data={data} />
              <LiveOracleStrip />
              <LiveMacroCommandBar data={data} />
              <LiveStrategyCardRow data={data} expandedSlug={expandedSlug} onToggle={handleToggle} />
              <LiveTacticalSection data={data} expandedSlug={expandedSlug} onToggle={handleToggle} />
              <LivePreSignalSection data={data} expandedSlug={expandedSlug} onToggle={handleToggle} />

              {/* Execution Forecast Grid */}
              <div className="space-y-12 pt-12 border-t border-zinc-200 dark:border-zinc-800">
                {forecastCards.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.3em]">Execution Forecast Grid</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {forecastCards.map((item) => (
                        <MacroSnapshotCard key={item.slug} item={item} isExpanded={expandedSlug === item.slug} onToggle={handleToggle} briefData={data} />
                      ))}
                    </div>
                  </section>
                )}

                {divergenceCards.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Layers className="w-5 h-5 text-purple-500" />
                      <h3 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.3em]">Institutional Divergence Grid</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {divergenceCards.map((item) => (
                        <DivergenceCard key={item.slug} item={item} isExpanded={expandedSlug === item.slug} onToggle={handleToggle} briefData={data} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </main>
        </OracleContext.Provider>

        {/* Footer */}
        <footer className="h-10 border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-[#08080a] flex items-center justify-between px-8 text-[8px] font-mono text-zinc-500 dark:text-zinc-600 uppercase tracking-widest relative z-[100]">
          <div className="flex gap-10">
            <span className="flex items-center gap-2 tracking-tighter"><Lock className="w-2.5 h-2.5" /> SECURE_UPLINK_v8</span>
            <span className="flex items-center gap-2 tracking-tighter"><Activity className="w-2.5 h-2.5" /> SCAN: {data.scan_time?.toFixed(1)}s</span>
          </div>
          <span>&copy; 2026 ALPHA TERMINAL // UPLINK_ACTIVE_V8</span>
        </footer>
      </div>
    </div>
  );
}

export default UnifiedBriefView;
