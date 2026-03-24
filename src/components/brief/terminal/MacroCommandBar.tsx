import React from 'react';
import { MasterBrief } from '../../../hooks/useMasterBrief';
import { CommandBlock } from './primitives';

export function LiveMacroCommandBar({ data }: { data: MasterBrief }) {
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl flex items-center justify-between mb-8 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      <div className="flex items-center gap-12">
        <CommandBlock
          label="Macro Regime"
          value={data.macro_regime?.regime || 'UNKNOWN'}
          color={data.macro_regime?.regime === 'NEUTRAL' ? 'text-zinc-500 dark:text-zinc-400' : 'text-rose-500'}
        />
        <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800" />
        <CommandBlock
          label="Next Event"
          value={data.economic_veto?.next_event || '—'}
          sub={data.economic_veto?.hours_away != null ? `Countdown: ${data.economic_veto.hours_away.toFixed(1)}h` : undefined}
        />
      </div>
      <div className="flex items-center gap-12 text-right">
        <CommandBlock
          label="Confidence Cap"
          value={`${data.kill_chain_state?.confidence_cap ?? '—'}%`}
          color="text-yellow-600 dark:text-yellow-500"
        />
        <CommandBlock
          label="System Scan"
          value={`${data.scan_time?.toFixed(1) ?? '—'}s`}
          color="text-zinc-400 dark:text-zinc-600"
        />
      </div>
    </div>
  );
}
