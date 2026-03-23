import React from 'react';
import { motion } from 'framer-motion';
import type { DPSummary } from './types';
import { formatVolume, formatDollars } from './types';

interface Props {
  summary: DPSummary;
  currentPrice: number | null;
}

const StatCard = ({
  label,
  value,
  subtext,
  valueColor = 'text-white',
  subtextColor = 'text-zinc-600',
  barPct,
  barColor,
  delay = 0,
}: {
  label: string;
  value: string;
  subtext?: string;
  valueColor?: string;
  subtextColor?: string;
  barPct?: number;
  barColor?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 flex-1 shadow-xl relative overflow-hidden group"
  >
    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"
      style={{ backgroundColor: barColor ?? '#22d3ee' }}
    />
    <div className="relative z-10 flex flex-col gap-1 mb-2">
      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{label}</span>
      <h3 className={`text-4xl font-black tracking-tighter ${valueColor}`}>{value}</h3>
      {subtext && <span className={`text-[11px] font-bold ${subtextColor}`}>{subtext}</span>}
    </div>
    {barPct !== undefined && barColor && (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-950">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(barPct, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="h-full"
          style={{ backgroundColor: barColor, boxShadow: `0 0 8px ${barColor}80` }}
        />
      </div>
    )}
  </motion.div>
);

export const DPStatCards: React.FC<Props> = ({ summary, currentPrice }) => {
  const dpPct = summary.dp_percent;
  const bp = summary.buying_pressure;
  const svPct = summary.short_volume_pct;

  const bpColor = bp >= 55 ? '#10b981' : bp <= 45 ? '#f43f5e' : '#22d3ee';
  const dpColor = dpPct > 50 ? '#10b981' : '#f43f5e';

  return (
    <div className="flex gap-6">
      {/* Total Volume */}
      <StatCard
        label="Total Volume"
        value={formatVolume(summary.total_volume)}
        subtext={summary.dp_position_dollars ? `${formatDollars(summary.dp_position_dollars)} notional` : undefined}
        delay={0.05}
        barColor="#22d3ee"
      />

      {/* DP % */}
      <StatCard
        label="DP %"
        value={`${dpPct.toFixed(1)}%`}
        subtext={svPct !== null ? `${svPct.toFixed(1)}% short vol` : undefined}
        valueColor={dpPct > 50 ? 'text-emerald-400' : 'text-rose-400'}
        subtextColor={svPct !== null ? (svPct > 55 ? 'text-rose-700' : svPct < 45 ? 'text-emerald-700' : 'text-zinc-600') : 'text-zinc-600'}
        delay={0.1}
        barColor={dpColor}
        barPct={dpPct}
      />

      {/* Buying Pressure */}
      <StatCard
        label="Buying Pressure"
        value={`${bp.toFixed(1)}%`}
        subtext={bp >= 55 ? 'Bullish momentum' : bp <= 45 ? 'Bearish momentum' : 'Neutral momentum'}
        valueColor={bp >= 55 ? 'text-emerald-400' : bp <= 45 ? 'text-rose-400' : 'text-white'}
        delay={0.15}
        barColor={bpColor}
        barPct={bp}
      />

      {/* Current Price (right-aligned) */}
      {currentPrice !== null && (
        <div className="flex items-end pb-2">
          <span className="text-4xl font-black text-cyan-400 tracking-tighter">
            ${currentPrice.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};
