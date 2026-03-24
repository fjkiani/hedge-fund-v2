import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { KillChainLayer, AiBriefingItem } from './types';
import { fmtLayerValue, layerGoal, layerMeaning } from './helpers';

interface Props {
  title: string;
  layer: KillChainLayer;
  onClick: (item: AiBriefingItem) => void;
}

export const ConfluenceCard: React.FC<Props> = ({ title, layer, onClick }) => {
  const displayValue = fmtLayerValue(layer);
  const goal = layerGoal(layer);
  const meaning = layerMeaning(layer);

  return (
    <div
      onClick={() =>
        onClick({
          title,
          value: displayValue,
          unit: layer.unit,
          goal,
          meaning,
          status: layer.triggered ? 'pass' : 'fail',
          slug: `kc-${layer.name.toLowerCase().replace(/\s+/g, '-')}`,
        })
      }
      className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 flex-1 shadow-xl relative overflow-hidden group cursor-pointer hover:border-white/10 transition-all"
    >
      {/* Triggered indicator */}
      <div
        className={`absolute top-4 right-6 w-5 h-5 rounded border flex items-center justify-center ${
          layer.triggered ? 'bg-emerald-500 border-emerald-400' : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        {layer.triggered && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
      </div>

      <div className="flex flex-col gap-1 mb-6">
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{title}</span>
        <div className="flex items-baseline gap-2">
          <h3 className={`text-3xl font-black tracking-tighter ${layer.triggered ? 'text-white' : 'text-zinc-400'}`}>
            {displayValue}
          </h3>
          <span className="text-[11px] font-bold text-zinc-500 uppercase">{layer.unit}</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-[9px] font-black text-zinc-700 uppercase tracking-widest">{goal}</span>
        <p className="text-[10px] text-zinc-600 leading-tight italic">{meaning}</p>
      </div>
    </div>
  );
};
