import React from 'react';
import type { KillShotsLayers } from './types';
import { PillarShell, PillarFooter, IntelligenceBriefing, DataPoint, KV } from './ui';

interface Props { data: KillShotsLayers }

export const PillarCardCot: React.FC<Props> = ({ data }) => {
  const isArmed = (data.cot_boost ?? 0) >= 3;
  const specsNet = data.cot_specs_net ?? 0;
  const commsNet = data.cot_comm_net ?? 0;

  const statusLabel = (data.cot_boost ?? 0) >= 3 ? 'EXTREME' : (data.cot_boost ?? 0) > 0 ? 'MILD' : 'NEUTRAL';
  const statusColor = (data.cot_boost ?? 0) >= 3 ? '#f43f5e' : (data.cot_boost ?? 0) > 0 ? '#f97316' : '#71717a';

  // Normalize for bar widths (0-100%) — uses real values
  const maxAbs = Math.max(Math.abs(specsNet), Math.abs(commsNet), 1);
  const specsWidth = Math.round((Math.abs(specsNet) / maxAbs) * 100);
  const commsWidth = Math.round((Math.abs(commsNet) / maxAbs) * 100);

  // Anchor for LLM briefing
  const anchor = [
    data.cot_specs_net != null ? `specs_net=${specsNet > 0 ? '+' : ''}${specsNet.toLocaleString()}` : null,
    data.cot_comm_net != null ? `comms_net=${commsNet > 0 ? '+' : ''}${commsNet.toLocaleString()}` : null,
    data.cot_divergent != null ? `divergent=${data.cot_divergent ? 'YES' : 'NO'}` : null,
  ].filter(Boolean).join(', ');

  return (
    <PillarShell
      isArmed={isArmed}
      label="Futures Positioning"
      title="COT"
      value={statusLabel}
      status={isArmed ? 'ARMED' : 'WATCH'}
    >
      {/* Status + Boost header */}
      <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-white/5 mb-5">
        <div className="flex-1">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Divergence</span>
          <span className="text-xs font-black uppercase" style={{ color: statusColor }}>{statusLabel}</span>
        </div>
        <div className="h-8 w-px bg-zinc-800" />
        <div className="flex-1 text-right">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Boost</span>
          <span className="text-xs font-black text-white">+{data.cot_boost ?? 0}</span>
        </div>
      </div>

      {/* Auditable data points */}
      <div className="space-y-0 mb-5">
        <DataPoint
          label="Specs Net"
          value={specsNet >= 0 ? `+${specsNet.toLocaleString()}` : specsNet.toLocaleString()}
          color={specsNet < 0 ? '#f43f5e' : '#10b981'}
          tooltip={{
            what: 'Net futures contract position of non-commercial (speculative) traders as reported in the CFTC Commitments of Traders (COT) weekly report. Positive = net long, negative = net short.',
            why: specsNet < -50000
              ? `Speculators are extremely net short (${specsNet.toLocaleString()} contracts). This is a contrarian BULLISH signal — heavily-crowded short positions are fuel for a short-squeeze rally.`
              : specsNet > 100000
              ? `Speculators are extremely net long (${specsNet.toLocaleString()} contracts). This is a contrarian BEARISH signal — crowded longs are vulnerable to fast unwinds.`
              : `Spec positioning is moderate at ${specsNet.toLocaleString()} contracts. No extreme contrarian signal.`,
            source: 'CFTC COT report (weekly, via Barchart)',
          }}
        />
        <DataPoint
          label="Comms Net"
          value={commsNet >= 0 ? `+${commsNet.toLocaleString()}` : commsNet.toLocaleString()}
          color={commsNet > 0 ? '#10b981' : '#f43f5e'}
          tooltip={{
            what: 'Net futures contract position of commercial traders (actual producers, consumers, and corporate hedgers) from the CFTC COT weekly report.',
            why: commsNet > 0
              ? `Commercials are net long (${commsNet.toLocaleString()} contracts). Since commercials hedge real exposures and move opposite to price trends, net-long commercials are often aligned with bullish price reversals.`
              : `Commercials are net short (${commsNet.toLocaleString()} contracts). They are hedging against downside in their actual business holdings — a sign of defensive institutional positioning.`,
            source: 'CFTC COT report (weekly, via Barchart)',
          }}
        />
        <DataPoint
          label="Divergent"
          value={data.cot_divergent ? 'YES' : 'NO'}
          color={data.cot_divergent ? '#f43f5e' : '#71717a'}
          tooltip={{
            what: 'Flags when speculative (non-commercial) and commercial positioning are both at relative extremes in opposite directions — the highest-conviction COT signal.',
            why: data.cot_divergent
              ? 'Extreme divergence active: specs are heavily positioned one way while commercials are positioned the other. Historically, commercials win. This is a high-conviction signal for a spec-driven reversal.'
              : 'No extreme divergence between specs and commercials. Lower conviction from COT alone.',
            source: 'Kill Chain COT divergence engine (CFTC data)',
          }}
        />
        <KV
          label="Kill Chain Boost"
          value={`+${data.cot_boost ?? 0}`}
          color={isArmed ? '#f97316' : '#71717a'}
        />
      </div>

      {/* Relative Strength Bar — real values, normalized */}
      <div className="space-y-2 border-t border-white/5 pt-4 mb-2">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Positioning Balance</span>
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="w-12 text-right font-mono">SPECS</span>
            <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${specsWidth}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="w-12 text-right font-mono">COMMS</span>
            <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${commsWidth}%` }} />
            </div>
          </div>
        </div>
      </div>

      <IntelligenceBriefing content={data.explanation_COT} anchor={anchor} />
      <PillarFooter src="cftc/barchart" slug={data.cot_slug} />
    </PillarShell>
  );
};
