import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { DPTopPosition } from './types';
import { formatVolume, formatDollars } from './types';

interface Props {
  positions: DPTopPosition[];
  onDrillDown?: (item: any) => void;
  activeSlug?: string;
}

/* ── Dynamic tooltip for Short Vol % context ── */
function ShortVolTooltip({ ticker, pct }: { ticker: string; pct: number }) {
  const [show, setShow] = useState(false);

  const tooltipText = `${ticker} Short Vol ${pct.toFixed(1)}% = FINRA reported off-exchange short volume. Includes market maker hedging. Above 50% is common for liquid ETFs. Directional signal only when combined with dark pool block print trend.`;

  return (
    <span
      className="relative cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black border ${
        pct > 55 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        : pct < 45 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'text-zinc-600 border-transparent'
      }`}>
        {pct.toFixed(1)}%
        <span className="ml-1 text-zinc-600 text-[9px]">ℹ</span>
      </span>

      {/* Tooltip popover */}
      {show && (
        <div
          className="absolute z-50 bottom-full right-0 mb-2 w-64 p-3 rounded-lg text-[11px] leading-relaxed shadow-xl border pointer-events-none"
          style={{
            background: 'rgba(12, 12, 14, 0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {tooltipText}
          <div
            className="absolute top-full right-4 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(255,255,255,0.1)',
            }}
          />
        </div>
      )}
    </span>
  );
}

export const DPTopPositions: React.FC<Props> = ({ positions, onDrillDown, activeSlug }) => {
  if (positions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="bg-[#0c0c0e] border border-white/5 rounded-2xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em]">Top Dark Pool Positions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-[9px] font-black font-mono text-zinc-700 uppercase tracking-[0.2em] bg-black/30">
              <th className="px-6 py-3">Ticker</th>
              <th className="px-6 py-3 text-right">Shares</th>
              <th className="px-6 py-3 text-right">Notional</th>
              <th className="px-6 py-3 text-right">
                <span className="inline-flex items-center gap-1">
                  Short Vol %
                  <span className="text-zinc-800 text-[8px] normal-case tracking-normal" title="FINRA reported short volume — includes market maker hedging">ℹ</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {positions.slice(0, 8).map((pos, i) => {
              const sv = pos.short_volume_pct;
              return (
                <tr
                  key={i}
                  onClick={() => onDrillDown?.({ slug: `DP:POS_${pos.ticker}`, title: `${pos.ticker} Dark Pool Position`, actual: formatDollars(pos.dp_position_dollars), surprise: `${sv.toFixed(1)}% Short Vol` })}
                  className={`cursor-pointer transition-colors ${activeSlug === `DP:POS_${pos.ticker}` ? 'bg-white/[0.05] border-l-2 border-cyan-500' : 'hover:bg-white/[0.02]'}`}
                >
                  <td className="px-6 py-3 font-black text-white">{pos.ticker}</td>
                  <td className="px-6 py-3 text-right font-mono text-zinc-500 text-xs">{formatVolume(pos.dp_position_shares)}</td>
                  <td className="px-6 py-3 text-right font-mono text-zinc-300 text-xs">{formatDollars(pos.dp_position_dollars)}</td>
                  <td className="px-6 py-3 text-right">
                    <ShortVolTooltip ticker={pos.ticker} pct={sv} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
