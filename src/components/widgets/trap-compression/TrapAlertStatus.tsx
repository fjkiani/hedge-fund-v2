// TrapAlertStatus — the "Wait / Act / Alarm" banner at the top of Trap Compression Zone.
// All values from live TrapMatrixState. Zero hardcoded data.

import React from 'react';
import { motion } from 'framer-motion';
import { Pause, Zap, AlertTriangle } from 'lucide-react';
import type { TrapMatrixState } from './types';
import { ALERT_COLORS } from './types';

interface Props {
  state: TrapMatrixState;
}

// Derive how far price is within the coil range (0-100%)
function coilPosition(price: number, coilMin: number | null, coilMax: number | null): number | null {
  if (!coilMin || !coilMax || coilMax <= coilMin) return null;
  const pct = ((price - coilMin) / (coilMax - coilMin)) * 100;
  return Math.max(0, Math.min(100, pct));
}

// Pull call wall and put wall from gex_walls (highest gamma per side)
function getCoilBounds(state: TrapMatrixState): { coilFloor: number | null; coilCeiling: number | null } {
  const walls = state.levels.gex_walls ?? [];
  const putWalls = walls.filter(w => w.type === 'put').sort((a, b) => b.gamma - a.gamma);
  const callWalls = walls.filter(w => w.type === 'call').sort((a, b) => b.gamma - a.gamma);
  return {
    coilFloor: putWalls[0]?.price ?? null,
    coilCeiling: callWalls[0]?.price ?? null,
  };
}

export const TrapAlertStatus: React.FC<Props> = ({ state }) => {
  const alertLevel = state.context.alert_level;
  const colors = ALERT_COLORS[alertLevel] ?? ALERT_COLORS.GREEN;
  const price = state.current_price;

  const { coilFloor, coilCeiling } = getCoilBounds(state);
  const positionPct = coilPosition(price, coilFloor, coilCeiling);

  // Dynamically derive the status message from real data
  const Icon = alertLevel === 'RED' ? AlertTriangle : alertLevel === 'YELLOW' ? Pause : Zap;
  const statusLabel = alertLevel === 'RED' ? 'ALERT — Trap Active'
    : alertLevel === 'YELLOW' ? 'Wait — Near Zone Boundary'
    : 'Monitoring — No Active Trap';

  // Active trap summaries from the live trap list
  const activeTrapCount = state.traps.length;
  const topTrap = state.traps[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#121214] rounded-2xl p-8 relative overflow-hidden group"
      style={{ borderWidth: 1, borderStyle: 'solid', borderColor: colors.border }}
    >
      {/* Left accent stripe */}
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: colors.text }} />

      <div className="flex items-start gap-6 relative z-10">
        <div className="w-14 h-14 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center shadow-2xl flex-shrink-0">
          <Icon className="w-8 h-8" style={{ color: colors.text }} />
        </div>

        <div className="space-y-4 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter" style={{ color: colors.text }}>
              {statusLabel}
            </h3>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex flex-wrap gap-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
              <span>Price ${price.toFixed(2)}</span>
              {coilFloor && <span>Floor ${coilFloor.toFixed(2)}</span>}
              {coilCeiling && <span>Ceiling ${coilCeiling.toFixed(2)}</span>}
              {positionPct !== null && (
                <span className="text-zinc-400">{positionPct.toFixed(0)}% from bottom</span>
              )}
            </div>
          </div>

          {/* Primary context from live trap data */}
          {topTrap ? (
            <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-4xl italic">
              {topTrap.narrative}
            </p>
          ) : (
            <p className="text-sm text-zinc-600 font-medium italic">
              No active trap zones detected in current scan. Monitoring {state.context.gamma_regime} gamma regime.
            </p>
          )}

          {/* Trap count + staleness warning */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-zinc-700 uppercase tracking-widest">
            <span>{activeTrapCount} trap{activeTrapCount !== 1 ? 's' : ''} active</span>
            <span className="h-3 w-px bg-zinc-900" />
            <span>{state.context.gamma_regime} gamma</span>
            {state.context.vix !== null && (
              <>
                <span className="h-3 w-px bg-zinc-900" />
                <span>VIX {state.context.vix?.toFixed(1)}</span>
              </>
            )}
            <span className="h-3 w-px bg-zinc-900" />
            <span className="text-zinc-800">v{state.version} · {state.timestamp}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
