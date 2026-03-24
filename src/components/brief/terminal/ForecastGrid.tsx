import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Zap, BarChart4, ChevronDown } from 'lucide-react';
import { MasterBrief } from '../../../hooks/useMasterBrief';
import { MetricBadge } from './primitives';
import { InlineOracleBriefing } from './InlineOracleBriefing';

export function MacroSnapshotCard({ item, isExpanded, onToggle, briefData }: {
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

export function DivergenceCard({ item, isExpanded, onToggle, briefData }: {
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
