import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, Pause, Brain, RefreshCw } from 'lucide-react';
import type { KillChainData } from './types';

interface Props {
  kc: KillChainData;
  totalChecks: number;
  activations: number;
  lastRefresh: Date | null;
  onRefresh?: () => void;
}

const CONFLUENCE_LABEL: Record<string, string> = {
  TRIPLE: 'Armed - Triple Confluence',
  DOUBLE: 'Armed - Double Confluence',
  SINGLE: 'Single Layer Active',
  WAITING: 'Watching — Waiting for Confluence',
};

export const KillChainHeader: React.FC<Props> = ({ kc, totalChecks, activations, lastRefresh, onRefresh }) => {
  const [spinning, setSpinning] = useState(false);
  const label = CONFLUENCE_LABEL[kc.confluence] ?? kc.confluence;

  const handleRefresh = () => {
    if (spinning || !onRefresh) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 800);
  };

  return (
    <div className="flex justify-between items-center bg-zinc-950/40 p-6 rounded-2xl border border-white/5">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Target className="w-8 h-8 text-emerald-400" />
          </div>
          <motion.div
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full blur-[2px]"
          />
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
            Kill Chain Engine
          </h2>
          <div className="flex items-center gap-4">
            <div
              className={`px-3 py-1 border rounded-lg text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] ${
                kc.armed
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
              }`}
            >
              {kc.armed ? <Flame className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {label}
            </div>
            <div className="h-4 w-px bg-zinc-800" />
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
              Checks: {totalChecks} · Strikes: {activations} ·{' '}
              {lastRefresh?.toLocaleTimeString() ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="block text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">
            Status Oracle
          </span>
          <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-2">
            <Brain className="w-3.5 h-3.5" />
            {kc.armed ? 'ARMED — Oracle_Engine_ACTIVE' : 'SCANNING — Oracle_Engine_ACTIVE'}
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            title="Refresh kill chain data"
            className="p-2 rounded-full bg-zinc-900/60 border border-white/5 hover:border-emerald-500/30 hover:text-emerald-400 text-zinc-600 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};
