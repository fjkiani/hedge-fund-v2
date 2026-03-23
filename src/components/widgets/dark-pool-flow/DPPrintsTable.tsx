import React from 'react';
import { motion } from 'framer-motion';
import type { DPPrint } from './types';
import { formatPrice, formatVolume } from './types';

interface Props { prints: DPPrint[] }

export const DPPrintsTable: React.FC<Props> = ({ prints }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.35 }}
    className="bg-[#0c0c0e] border border-white/5 rounded-2xl overflow-hidden"
  >
    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
      <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em]">Recent Prints</h3>
      {/* FINRA T-1 disclosure */}
      <span className="text-[9px] font-mono text-yellow-600 bg-yellow-500/5 border border-yellow-500/15 px-2 py-1 rounded">
        ⚠ FINRA T-1 — prior session
      </span>
    </div>

    {prints.length === 0 ? (
      <p className="text-zinc-700 text-sm font-mono text-center py-8">No recent prints</p>
    ) : (
      <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
        {prints.map((print, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center justify-center w-12 px-2 py-0.5 rounded text-[10px] font-black border ${
                print.side === 'BUY'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {print.side}
              </span>
              <span className="font-black font-mono text-sm text-white">{formatPrice(print.price)}</span>
              <span className="text-zinc-600 text-xs font-mono">{formatVolume(print.volume)}</span>
            </div>
            <span className="text-[9px] text-zinc-800 font-mono uppercase tracking-widest">T-1</span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);
