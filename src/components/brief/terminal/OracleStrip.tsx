import React from 'react';
import { Brain } from 'lucide-react';
import { useOracle } from '../OracleContext';

export function LiveOracleStrip() {
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
