import React from 'react';
import { AlertOctagon } from 'lucide-react';
import type { MasterBrief } from '../../../hooks/useMasterBrief';
import { fmtGex } from './helpers';

export function BreachAlert({ data }: { data: MasterBrief }) {
  const der = data.derivatives;
  if (!der || der.error) return null;

  // Only show breach if spot is above call wall or below put wall
  const spot = der.spot;
  const callWall = der.call_wall;
  const putWall = der.put_wall;
  
  if (spot == null) return null;
  const aboveCall = callWall != null && spot > callWall;
  const belowPut = putWall != null && spot < putWall;

  if (!aboveCall && !belowPut) return null;

  const breachType = aboveCall ? 'ABOVE CALL WALL' : 'BELOW PUT WALL';
  const direction = aboveCall ? 'BREAKOUT SQUEEZE RISK' : 'RISK OFF PROTOCOL';

  return (
    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-10 flex items-center justify-between relative overflow-hidden shadow-2xl mb-8">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 shadow-[0_0_20px_#f43f5e]" />
      <div className="flex items-center gap-10">
        <AlertOctagon className="w-16 h-16 text-rose-500 animate-pulse" />
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white leading-none tracking-tighter uppercase italic">Wall Breach</h1>
          <h3 className="text-md font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest">
            SPY {breachType} — {direction}
          </h3>
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-700 uppercase tracking-[0.2em]">
            Spot: ${spot?.toFixed(2)} · Call: ${callWall} · Put: ${putWall} · GEX: {fmtGex(der.total_gex)}
          </p>
        </div>
      </div>
    </div>
  );
}
