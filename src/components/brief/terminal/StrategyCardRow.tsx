import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Satellite, Landmark, LineChart } from 'lucide-react';
import type { MasterBrief } from '../../../hooks/useMasterBrief';
import { MetricBadge } from './primitives';
import { InlineOracleBriefing } from './InlineOracleBriefing';
import { fmtPct } from './helpers';

export function StrategyCard({ title, icon: Icon, slug, children, expandedSlug, onToggle, briefData }: {
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

export function LiveStrategyCardRow({ data, expandedSlug, onToggle }: {
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
