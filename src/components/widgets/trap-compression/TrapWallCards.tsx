// TrapWallCards — renders the GEX option walls and Max Pain as level cards.
// All values from live gex_walls[], gamma_flip, max_pain from TrapMatrixState.
// Zero hardcoded prices.

import React from 'react';
import { motion } from 'framer-motion';
import type { TrapMatrixState, GexWall } from './types';

interface Props {
  state: TrapMatrixState;
}

type AccentKey = 'rose' | 'emerald' | 'blue' | 'orange' | 'purple';

interface WallCardData {
  label: string;
  price: string;
  sub: string;
  desc: string;
  accent: AccentKey;
}

const BORDER_COLORS: Record<AccentKey, string> = {
  rose:    'border-rose-500/20 hover:border-rose-500/50',
  emerald: 'border-emerald-500/20 hover:border-emerald-500/50',
  blue:    'border-blue-500/20 hover:border-blue-500/50',
  orange:  'border-orange-500/20 hover:border-orange-500/50',
  purple:  'border-purple-500/20 hover:border-purple-500/50',
};
const TEXT_COLORS: Record<AccentKey, string> = {
  rose:    'text-rose-500',
  emerald: 'text-emerald-500',
  blue:    'text-blue-400',
  orange:  'text-orange-400',
  purple:  'text-purple-400',
};

const WallCard = ({ label, price, sub, desc, accent, delay }: WallCardData & { delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`bg-[#0c0c0e] border p-5 rounded-xl flex-1 flex flex-col gap-1 transition-all group cursor-default ${BORDER_COLORS[accent]}`}
  >
    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
    <h4 className={`text-2xl font-black ${TEXT_COLORS[accent]}`}>{price}</h4>
    <span className="text-[10px] font-bold text-zinc-700">{sub}</span>
    <p className="text-[10px] text-zinc-500 italic leading-tight mt-2">{desc}</p>
  </motion.div>
);

// From the top call wall (call) + top put wall (put) by gamma
function getTopWalls(walls: GexWall[]): { topCall: GexWall | null; topPut: GexWall | null } {
  const calls = walls.filter(w => w.type === 'call').sort((a, b) => b.gamma - a.gamma);
  const puts  = walls.filter(w => w.type === 'put').sort((a, b) => b.gamma - a.gamma);
  return { topCall: calls[0] ?? null, topPut: puts[0] ?? null };
}

function formatGamma(gamma: number): string {
  if (gamma >= 1e6) return `${(gamma / 1e6).toFixed(1)}M γ`;
  if (gamma >= 1e3) return `${(gamma / 1e3).toFixed(1)}K γ`;
  return `${gamma.toFixed(0)} γ`;
}

function ptsAbove(price: number, ref: number): string {
  const diff = price - ref;
  return diff >= 0 ? `${diff.toFixed(1)} pts above` : `${Math.abs(diff).toFixed(1)} pts below`;
}

export const TrapWallCards: React.FC<Props> = ({ state }) => {
  const price = state.current_price;
  const { topCall, topPut } = getTopWalls(state.levels.gex_walls ?? []);
  const gammaFlip = state.levels.gamma_flip;
  const maxPain = state.levels.max_pain;

  const cards: WallCardData[] = [];

  if (topCall) {
    cards.push({
      label: 'Call Wall',
      price: `$${topCall.price.toFixed(2)}`,
      sub: formatGamma(topCall.gamma),
      desc: 'Ceiling. Dealers sell here to hedge. Gamma suppresses moves above this level.',
      accent: 'rose',
    });
  }

  if (topPut) {
    cards.push({
      label: 'Put Wall',
      price: `$${topPut.price.toFixed(2)}`,
      sub: formatGamma(topPut.gamma),
      desc: 'Floor. Dealers buy here to hedge. Strongest support in the gamma field.',
      accent: 'emerald',
    });
  }

  if (gammaFlip) {
    cards.push({
      label: 'Gamma Flip',
      price: `$${gammaFlip.toFixed(2)}`,
      sub: price ? ptsAbove(price, gammaFlip) : '--',
      desc: price > (gammaFlip ?? 0)
        ? 'SPX above flip — dealers in long gamma territory. Suppresses volatility.'
        : 'SPX below flip — dealers in short gamma territory. Amplifying moves.',
      accent: price > (gammaFlip ?? 0) ? 'emerald' : 'rose',
    });
  }

  if (maxPain) {
    cards.push({
      label: 'Max Pain',
      price: `$${maxPain.toFixed(2)}`,
      sub: price ? ptsAbove(price, maxPain) : '--',
      desc: 'Options gravity. Maximum contracts expire worthless here. Price drifts toward this by expiry.',
      accent: 'blue',
    });
  }

  // COT signal if present
  if (state.context.cot_net_spec !== null) {
    const net = state.context.cot_net_spec;
    cards.push({
      label: 'COT Spec Net',
      price: `${net > 0 ? '+' : ''}${net.toLocaleString()}`,
      sub: state.context.cot_signal || '--',
      desc: net < 0
        ? 'Speculators are net short. Contrarian fuel — crowded shorts can squeeze fast.'
        : 'Speculators are net long. Crowded longs are vulnerable to unwind.',
      accent: net < -50000 ? 'purple' : 'orange',
    });
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-700 font-mono text-xs uppercase tracking-widest">
        No level data available — backend may still be loading
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {cards.map((card, i) => (
        <WallCard key={card.label} {...card} delay={i * 0.06} />
      ))}
    </div>
  );
};
