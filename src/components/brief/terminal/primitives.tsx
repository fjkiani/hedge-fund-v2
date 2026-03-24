import React from 'react';

export const MetricBadge = ({ label, value, color = "text-zinc-500 dark:text-zinc-400" }: {
  label: string; value: string; color?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[7px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">{label}</span>
    <span className={`text-[11px] font-mono font-bold ${color}`}>{value}</span>
  </div>
);

export const CommandBlock = ({ label, value, sub, color = "text-zinc-900 dark:text-white" }: {
  label: string; value: string; sub?: string; color?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-black uppercase tracking-tight ${color}`}>{value}</span>
    {sub && <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600">{sub}</span>}
  </div>
);
