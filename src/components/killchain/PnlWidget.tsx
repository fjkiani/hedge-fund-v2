import React from 'react';
import { KillChainPosition, AiBriefingItem } from './types';

interface Props {
  position: KillChainPosition;
  spotPrice: number;
  onDrillDown: (item: AiBriefingItem) => void;
}

export const PnlWidget: React.FC<Props> = ({ position, spotPrice, onDrillDown }) => {
  const pnl = position.current_pnl ?? 0;
  const entry = position.entry_price ?? 0;
  const sign = pnl >= 0 ? '+' : '';
  const color = pnl >= 0 ? 'text-white' : 'text-rose-400';

  return (
    <div
      className="flex flex-col items-center justify-center py-6 space-y-2 relative group cursor-pointer"
      onClick={() =>
        onDrillDown({
          title: 'Weapon P&L',
          value: `${sign}${pnl.toFixed(2)}%`,
          unit: 'Active P&L',
          status: pnl >= 0 ? 'pass' : 'fail',
          slug: 'pnl-alpha-node',
        })
      }
    >
      <div className="absolute inset-0 bg-emerald-500/5 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
      <span className="text-sm font-black text-emerald-500 uppercase tracking-[0.5em] z-10">Active Weapon P&L</span>
      <h1 className={`text-[100px] font-black leading-none tracking-tighter z-10 drop-shadow-[0_0_50px_rgba(255,255,255,0.2)] ${color}`}>
        {sign}{pnl.toFixed(2)}%
      </h1>
      <div className="flex gap-10 text-[11px] font-mono font-bold text-zinc-600 uppercase tracking-widest z-10">
        <span>
          Entry: <span className="text-white">{entry > 0 ? `$${entry.toFixed(2)}` : 'Not Set'}</span>
        </span>
        <span>
          Spot: <span className="text-zinc-500">{spotPrice > 0 ? `$${spotPrice.toFixed(2)}` : '—'}</span>
        </span>
      </div>
    </div>
  );
};
