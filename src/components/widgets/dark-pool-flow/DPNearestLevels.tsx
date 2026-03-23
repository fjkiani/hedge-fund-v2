import React from 'react';
import { motion } from 'framer-motion';
import type { DPSummary } from './types';
import { formatPrice, formatVolume, fmt } from './types';

interface NearestLevelsProps { summary: DPSummary }

export const DPNearestLevels: React.FC<NearestLevelsProps> = ({ summary }) => {
  const { nearest_support, nearest_resistance } = summary;
  if (!nearest_support && !nearest_resistance) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {nearest_support && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0c0c0e] border border-emerald-500/20 rounded-2xl overflow-hidden"
        >
          <div className="px-4 py-2 border-b border-emerald-500/10 text-[10px] font-black font-mono text-emerald-500 uppercase tracking-[0.3em]">
            Nearest Support
          </div>
          <div className="p-4 space-y-1">
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {formatPrice(nearest_support.price)}
            </div>
            <div className="text-[11px] text-zinc-600 font-mono">{formatVolume(nearest_support.volume)} shares</div>
            {nearest_support.distance_from_price !== undefined && (
              <div className="text-[11px] text-zinc-600 font-mono">{fmt(nearest_support.distance_from_price)} pts away</div>
            )}
          </div>
        </motion.div>
      )}
      {nearest_resistance && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0c0c0e] border border-rose-500/20 rounded-2xl overflow-hidden"
        >
          <div className="px-4 py-2 border-b border-rose-500/10 text-[10px] font-black font-mono text-rose-500 uppercase tracking-[0.3em]">
            Nearest Resistance
          </div>
          <div className="p-4 space-y-1">
            <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">
              {formatPrice(nearest_resistance.price)}
            </div>
            <div className="text-[11px] text-zinc-600 font-mono">{formatVolume(nearest_resistance.volume)} shares</div>
            {nearest_resistance.distance_from_price !== undefined && (
              <div className="text-[11px] text-zinc-600 font-mono">{fmt(nearest_resistance.distance_from_price)} pts away</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
