import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { MasterBrief } from '../../../hooks/useMasterBrief';
import { InlineOracleBriefing } from './InlineOracleBriefing';
import { fmt } from './helpers';

export function LivePreSignalSection({ data, expandedSlug, onToggle }: {
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
