import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Ghost, Workflow, LineChart, Crosshair, History } from 'lucide-react';
import { MasterBrief } from '../../../hooks/useMasterBrief';
import { useOracle } from '../OracleContext';
import { InlineOracleBriefing } from './InlineOracleBriefing';
import { fmtUsd, fmtGex } from './helpers';

export function LiveTacticalSection({ data, expandedSlug, onToggle }: {
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
