import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DPLevel, DPSummary } from './types';
import { formatVolume, formatPrice, getLevelColor } from './types';

interface Props {
  levels: DPLevel[];
  summary?: DPSummary | null;  // extra level sources (nearest_support, resistance, battlegrounds)
}

const LEGEND = [
  { label: 'Support',     color: '#10b981' },
  { label: 'Resistance',  color: '#f43f5e' },
  { label: 'Battleground',color: '#eab308' },
];

export const DPVolumeChart: React.FC<Props> = ({ levels, summary }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  // Merge all level sources — the /levels endpoint returns the dominant DP print,
  // but summary.nearest_support / nearest_resistance / battlegrounds have more context.
  // Deduplicate by price so no level appears twice.
  const allLevels: DPLevel[] = [];
  const seen = new Set<number>();

  [...levels,
    summary?.nearest_support,
    summary?.nearest_resistance,
    ...(summary?.battlegrounds ?? []),
  ].forEach(l => {
    if (l && !seen.has(l.price)) {
      seen.add(l.price);
      allLevels.push(l);
    }
  });

  // Sort by volume descending, show top 8
  const sorted = allLevels.sort((a, b) => b.volume - a.volume).slice(0, 8);
  const maxVolume = sorted[0]?.volume ?? 1;

  // Use sqrt scaling so the dominant bar doesn't completely crush smaller ones visually,
  // then clamp to [8, 100]% minimum width so every bar is visible.
  const getBarWidth = (vol: number) => {
    const raw = (Math.sqrt(vol) / Math.sqrt(maxVolume)) * 100;
    return Math.max(8, Math.min(100, raw));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-8 shadow-xl"
    >
      <div className="flex flex-col gap-1 mb-8">
        <h3 className="text-lg font-black text-white tracking-tight">Dark Pool Levels by Volume</h3>
        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest">
          Price levels with significant off-exchange activity
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-zinc-700 text-sm font-mono text-center py-12">No level data</p>
      ) : (
        <div className="space-y-5">
          {sorted.map((level, i) => {
            const colors = getLevelColor(level.level_type);
            const barW = getBarWidth(level.volume);
            return (
              <div
                key={i}
                className="relative flex items-center gap-4 group cursor-default"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Price label */}
                <span className="w-20 text-[11px] font-mono text-zinc-500 text-right flex-shrink-0">
                  {formatPrice(level.price)}
                </span>

                {/* Bar */}
                <div className="flex-1 h-9 relative bg-zinc-950 rounded-r-sm overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barW}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                    className="h-full rounded-r-sm"
                    style={{
                      backgroundColor: colors.bg,
                      opacity: hovered !== null && hovered !== i ? 0.25 : 0.75,
                      transition: 'opacity 0.2s',
                    }}
                  />
                  {/* Level type label inside bar */}
                  <span
                    className="absolute inset-0 flex items-center px-3 text-[9px] font-black uppercase tracking-widest"
                    style={{ color: colors.text, opacity: 0.6 }}
                  >
                    {level.level_type}
                  </span>
                </div>

                {/* Volume label */}
                <span className="w-16 text-[11px] font-mono text-zinc-600 text-left flex-shrink-0">
                  {formatVolume(level.volume)}
                </span>

                {/* Tooltip */}
                <AnimatePresence>
                  {hovered === i && (
                    <motion.div
                      initial={{ opacity: 0, x: -8, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.95 }}
                      className="absolute left-[calc(20px+8rem)] z-50 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 shadow-2xl pointer-events-none"
                      style={{ borderColor: `${colors.bg}40` }}
                    >
                      <div className="flex flex-col gap-1 min-w-[140px]">
                        <span className="text-[9px] font-black uppercase tracking-widest"
                          style={{ color: colors.text }}>{level.level_type}</span>
                        <div className="flex justify-between gap-6 items-baseline">
                          <span className="text-[10px] text-zinc-500">Price</span>
                          <span className="text-sm font-black text-white font-mono">{formatPrice(level.price)}</span>
                        </div>
                        <div className="flex justify-between gap-6 items-baseline">
                          <span className="text-[10px] text-zinc-500">Volume</span>
                          <span className="text-sm font-black text-white font-mono">{formatVolume(level.volume)}</span>
                        </div>
                        <div className="flex justify-between gap-6 items-baseline">
                          <span className="text-[10px] text-zinc-500">Strength</span>
                          <span className="text-sm font-black text-white font-mono">{level.strength.toFixed(2)}</span>
                        </div>
                        {level.distance_from_price !== undefined && (
                          <div className="flex justify-between gap-6 items-baseline">
                            <span className="text-[10px] text-zinc-500">Distance</span>
                            <span className="text-sm font-black text-white font-mono">{level.distance_from_price.toFixed(2)} pts</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 flex gap-6">
        {LEGEND.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
