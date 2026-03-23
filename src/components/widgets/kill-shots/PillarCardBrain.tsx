import React from 'react';
import type { KillShotsLayers } from './types';
import { PillarShell, PillarFooter, IntelligenceBriefing, DataPoint } from './ui';

interface Props { data: KillShotsLayers }

export const PillarCardBrain: React.FC<Props> = ({ data }) => {
  const isArmed = (data.brain_boost ?? 0) >= 2;
  const reasons = data.brain_reasons ?? [];
  const boostScore = data.brain_boost ?? 0;

  // Anchor for LLM briefing — shows it was generated for these specific signals
  const anchor = [
    `brain_boost=+${boostScore}`,
    reasons.length > 0 ? `signals=${reasons.length}` : null,
  ].filter(Boolean).join(', ');

  return (
    <PillarShell
      isArmed={isArmed}
      label="AI Conviction Engine"
      title="BRAIN"
      value={`+${boostScore}`}
      status={isArmed ? 'ARMED' : 'MONITORING'}
    >
      {/* Status header */}
      <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-white/5 mb-5">
        <div className="flex-1">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Conviction Level</span>
          <span className="text-xs font-black uppercase" style={{ color: isArmed ? '#f97316' : '#71717a' }}>
            {isArmed ? 'HIGH' : 'LOW'}
          </span>
        </div>
        <div className="h-8 w-px bg-zinc-800" />
        <div className="flex-1 text-right">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">
            Active Signals
          </span>
          <span className="text-xs font-black text-white">{reasons.length}</span>
        </div>
      </div>

      {/* Boost score as auditable DataPoint */}
      <div className="space-y-0 mb-4">
        <DataPoint
          label="Boost Score"
          value={`+${boostScore}`}
          color={isArmed ? '#f97316' : '#71717a'}
          tooltip={{
            what: 'Integer conviction score injected into the Kill Chain from the BRAIN multi-source LLM scan. Scored from 0-5. Each independent corroborating signal from the LLM scan adds to the score.',
            why: boostScore >= 4
              ? `Score of +${boostScore} is maximum conviction — multiple independent research sources (${reasons.length} signals) are confirming the same directional thesis. This overrides lower-confidence signals.`
              : boostScore >= 2
              ? `Score of +${boostScore} indicates moderate conviction. ${reasons.length} signals are active, providing meaningful but not decisive corroboration.`
              : `Score of +${boostScore} is low — insufficient signal alignment from the LLM scan to boost conviction materially.`,
            source: 'Cohere LLM multi-source scan (command-a-reasoning)',
          }}
        />
      </div>

      {/* Live reasons — each is a clickable DataPoint with source attribution */}
      <div className="space-y-0 mb-5">
        {reasons.length === 0 ? (
          <p className="text-[11px] text-zinc-600 italic">No active conviction signals from this scan.</p>
        ) : (
          <>
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2">
              Extracted Signals ({reasons.length})
            </span>
            {reasons.map((r, i) => (
              <DataPoint
                key={i}
                label={`Signal ${i + 1}`}
                value={r.length > 48 ? r.slice(0, 46) + '…' : r}
                color={isArmed ? '#f97316' : '#a1a1aa'}
                tooltip={{
                  what: r,
                  why: `This signal contributed +1 conviction point to the BRAIN boost score. ${boostScore >= 4 ? 'With 4+ points, this signal is part of a maximum-conviction cluster.' : boostScore >= 2 ? 'Combined with other signals, this reaches actionable conviction threshold.' : 'Signal is noted but conviction threshold not yet met.'}`,
                  source: 'Cohere command-a-reasoning LLM scan (multi-source)',
                }}
              />
            ))}
          </>
        )}
      </div>

      <IntelligenceBriefing content={data.explanation_BRAIN} anchor={anchor} />
      <PillarFooter src="brain-manager" slug={data.brain_slug} />
    </PillarShell>
  );
};
