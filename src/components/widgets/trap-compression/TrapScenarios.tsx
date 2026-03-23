// TrapScenarios — renders SHORT / LONG trade scenarios derived from live GEX walls.
// All entry/stop/target prices are computed from live data. Zero hardcoded prices.
// If the backend doesn't return gex_walls, the section renders nothing.

import React from 'react';
import { motion } from 'framer-motion';
import type { TrapMatrixState, GexWall } from './types';

interface Props {
  state: TrapMatrixState;
}

interface ScenarioData {
  type: 'SHORT' | 'LONG';
  entry: number;
  stop: number;
  target: number;
  rrRatio: string;
  entryLabel: string;
  triggerNarrative: string;
}

function computeScenarios(state: TrapMatrixState): ScenarioData[] {
  const walls = state.levels.gex_walls ?? [];
  if (walls.length === 0) return [];

  const calls = walls.filter(w => w.type === 'call').sort((a, b) => b.gamma - a.gamma);
  const puts  = walls.filter(w => w.type === 'put').sort((a, b) => b.gamma - a.gamma);
  const topCall = calls[0];
  const topPut  = puts[0];

  const scenarios: ScenarioData[] = [];

  // SHORT: entry at call wall, stop 2 pts above, target at put wall
  if (topCall && topPut && topCall.price > topPut.price) {
    const entry  = topCall.price;
    const stop   = entry + 2;
    const target = topPut.price;
    const risk   = stop - entry;
    const reward = entry - target;
    const rr = reward > 0 && risk > 0 ? (reward / risk).toFixed(1) : '?';

    scenarios.push({
      type: 'SHORT',
      entry, stop, target,
      rrRatio: `${rr}:1`,
      entryLabel: `Call wall rejection at $${entry.toFixed(2)}`,
      triggerNarrative: `SPY tests $${entry.toFixed(2)} call wall and gets rejected. ${formatGamma(topCall.gamma)} of gamma at this strike means dealers will aggressively sell into any test. Short gamma regime amplifies the move down toward the put wall at $${target.toFixed(2)}.`,
    });
  }

  // LONG: entry at put wall, stop 2 pts below, target at call wall
  if (topPut && topCall && topCall.price > topPut.price) {
    const entry  = topPut.price;
    const stop   = entry - 2;
    const target = topCall.price;
    const risk   = entry - stop;
    const reward = target - entry;
    const rr = reward > 0 && risk > 0 ? (reward / risk).toFixed(1) : '?';

    scenarios.push({
      type: 'LONG',
      entry, stop, target,
      rrRatio: `${rr}:1`,
      entryLabel: `Put wall bounce at $${entry.toFixed(2)}`,
      triggerNarrative: `SPY pulls back to $${entry.toFixed(2)} put wall and holds. ${formatGamma(topPut.gamma)} of gamma at this strike means dealers are forced buyers on any dip here. Bounce target toward the call wall at $${target.toFixed(2)}.`,
    });
  }

  return scenarios;
}

function formatGamma(gamma: number): string {
  if (gamma >= 1e6) return `${(gamma / 1e6).toFixed(1)}M γ`;
  if (gamma >= 1e3) return `${(gamma / 1e3).toFixed(1)}K γ`;
  return `${gamma.toFixed(0)} γ`;
}

const ScenarioCard: React.FC<{ scenario: ScenarioData; delay: number }> = ({ scenario, delay }) => {
  const isShort = scenario.type === 'SHORT';
  const accentColor = isShort ? '#f43f5e' : '#10b981';
  const accentBg    = isShort ? 'bg-rose-950/20'    : 'bg-emerald-950/20';
  const accentText  = isShort ? 'text-rose-500'      : 'text-emerald-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 flex-1 shadow-2xl relative overflow-hidden"
    >
      {/* Accent stripe */}
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: accentColor }} />

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{scenario.type} SCENARIO</h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${accentBg} ${accentText}`}>
          {scenario.rrRatio} R:R
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Entry</span>
          <span className="text-xl font-black text-white">${scenario.entry.toFixed(2)}</span>
          <span className="text-[9px] font-bold text-zinc-700">{scenario.entryLabel}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Stop</span>
          <span className="text-xl font-black text-rose-500/80">${scenario.stop.toFixed(2)}</span>
          <span className="text-[9px] font-bold text-zinc-700">
            ${Math.abs(scenario.stop - scenario.entry).toFixed(2)} risk
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Target</span>
          <span className="text-xl font-black text-emerald-500">${scenario.target.toFixed(2)}</span>
          <span className="text-[9px] font-bold text-zinc-700">
            ${Math.abs(scenario.target - scenario.entry).toFixed(2)} reward
          </span>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-4">
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Trigger:</span>
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">{scenario.triggerNarrative}</p>
      </div>

      {/* Traceability footer */}
      <div className="mt-4 pt-3 border-t border-white/5 text-[9px] font-mono text-zinc-800 uppercase tracking-widest">
        SRC: gex_walls · computed from live gamma data
      </div>
    </motion.div>
  );
};

export const TrapScenarios: React.FC<Props> = ({ state }) => {
  const scenarios = computeScenarios(state);

  if (scenarios.length === 0) {
    return (
      <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-8 text-center text-zinc-700 font-mono text-xs uppercase tracking-widest">
        Insufficient wall data to compute scenarios — awaiting live GEX feed
      </div>
    );
  }

  return (
    <div className="flex gap-10">
      {scenarios.map((s, i) => (
        <ScenarioCard key={s.type} scenario={s} delay={i * 0.1} />
      ))}
    </div>
  );
};
