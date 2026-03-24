import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import type { RawHistoryEntry, AiBriefingItem } from './types';
import { deriveLayers, fmtTime, signalRowResult } from './helpers';

interface Props {
  history: RawHistoryEntry[];
  totalChecks: number;
  onRowClick: (item: AiBriefingItem) => void;
}

export const SignalLog: React.FC<Props> = ({ history, totalChecks, onRowClick }) => {
  const rows = [...history].reverse().slice(0, 20);

  const actionColor = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'ACTIVATION') return 'text-emerald-500';
    if (t === 'DEACTIVATION') return 'text-rose-500';
    return 'text-zinc-400';
  };

  const rowBg = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'ACTIVATION') return 'bg-emerald-950/10';
    if (t === 'DEACTIVATION') return 'bg-rose-950/10';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-zinc-600" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            Zeta Signal Log (Latest 20)
          </h3>
        </div>
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Polling every 30min · {totalChecks} checks total
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white/[0.02] border-b border-white/5 px-8 py-4 grid grid-cols-12 text-xs font-black text-zinc-400 uppercase tracking-widest">
          <div className="col-span-2">Time</div>
          <div className="col-span-3">Action</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2">Layers</div>
          <div className="col-span-3 text-right">Result</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.03]">
          {rows.length === 0 && (
            <div className="px-8 py-8 text-center text-sm text-zinc-400 font-mono">
              No signals logged yet — monitoring active
            </div>
          )}
          {rows.map((entry, i) => {
            const { active, total } = deriveLayers(entry);
            const t = entry.type.toUpperCase();
            const result = signalRowResult(entry);
            const isDeact = t === 'DEACTIVATION';

            return (
              <motion.div
                key={i}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                onClick={() =>
                  onRowClick({
                    action: t,
                    price: `$${(entry.spy_price ?? 0).toFixed(2)}`,
                    layers: `${active}/${total}`,
                    result,
                    slug: `sig-${t.toLowerCase()}-${i}`,
                  })
                }
                className={`px-8 py-5 grid grid-cols-12 items-center cursor-pointer transition-all ${rowBg(entry.type)}`}
              >
                <div className="col-span-2 text-xs font-mono font-bold text-zinc-500">
                  {fmtTime(entry.timestamp)}
                </div>
                <div className={`col-span-3 text-xs font-black tracking-widest ${actionColor(entry.type)}`}>
                  {t}
                </div>
                <div className="col-span-2 text-xs font-mono font-bold text-white">
                  ${(entry.spy_price ?? 0).toFixed(2)}
                </div>
                <div className="col-span-2 text-xs font-mono font-bold text-zinc-300">
                  {active}/{total}
                </div>
                <div
                  className={`col-span-3 text-right text-xs font-black tracking-widest ${
                    t === 'ACTIVATION'
                      ? 'text-emerald-500'
                      : isDeact
                      ? 'text-rose-500'
                      : 'text-zinc-400'
                  }`}
                >
                  {result}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
