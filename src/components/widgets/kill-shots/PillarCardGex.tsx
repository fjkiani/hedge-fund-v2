import React from 'react';
import type { KillShotsLayers } from './types';
import { PillarShell, PillarFooter, IntelligenceBriefing, DataPoint, KV } from './ui';

interface Props { data: KillShotsLayers }

export const PillarCardGex: React.FC<Props> = ({ data }) => {
  const gexBillions = data.total_gex_dollars ? (data.total_gex_dollars / 1e9).toFixed(1) : null;
  const isNeg = (data.total_gex_dollars ?? 0) < 0;
  const isArmed = (data.gex_boost ?? 0) >= 2;

  const spotAboveFlip = data.gex_spot_price && data.gex_gamma_flip
    ? data.gex_spot_price > data.gex_gamma_flip
    : null;

  const flipPct = data.gex_gamma_flip && data.gex_spot_price
    ? (((data.gex_spot_price - data.gex_gamma_flip) / data.gex_gamma_flip) * 100).toFixed(2)
    : null;

  // Anchor text for the LLM briefing — proves it was generated from live data, not generic copy
  const anchor = [
    gexBillions ? `Total GEX=${isNeg ? '' : '+'}$${gexBillions}B` : null,
    data.gex_regime ? `regime=${data.gex_regime}` : null,
    data.gex_gamma_flip ? `flip=$${data.gex_gamma_flip.toLocaleString()}` : null,
  ].filter(Boolean).join(', ');

  return (
    <PillarShell
      isArmed={isArmed}
      label="Derivatives Positioning"
      title="SPX GEX"
      value={gexBillions ? `$${gexBillions}B` : '—'}
      status={isArmed ? 'ARMED' : data.gex_regime ?? 'INACTIVE'}
    >
      {/* Status + Boost header */}
      <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-white/5 mb-5">
        <div className="flex-1">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Regime</span>
          <span className="text-xs font-black uppercase" style={{ color: isNeg ? '#f43f5e' : '#10b981' }}>
            {data.gex_regime ?? '—'}
          </span>
        </div>
        <div className="h-8 w-px bg-zinc-800" />
        <div className="flex-1 text-right">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Boost</span>
          <span className="text-xs font-black text-white">+{data.gex_boost ?? 0}</span>
        </div>
      </div>

      {/* Auditable data points — each is click-to-explain */}
      <div className="space-y-0 mb-5">
        <DataPoint
          label="Gamma Flip"
          value={data.gex_gamma_flip?.toLocaleString() ?? '—'}
          tooltip={{
            what: 'The strike price at which dealer gamma exposure crosses zero. Above this level, dealers are long gamma and act as stabilizers (buy dips/sell rips). Below it, dealers are short gamma and amplify moves.',
            why: `SPX is currently ${spotAboveFlip === null ? 'unknown' : spotAboveFlip ? 'ABOVE' : 'BELOW'} the flip level${flipPct ? ` by ${Math.abs(Number(flipPct))}%` : ''}. ${spotAboveFlip === false ? 'This is bearish — dealer hedging is now amplifying downside.' : 'Dealer flow is currently stabilizing the market.'}`,
            source: 'CBOE / SpotGamma (delayed)',
          }}
        />
        <DataPoint
          label="Spot Price"
          value={data.gex_spot_price?.toLocaleString() ?? '—'}
          tooltip={{
            what: 'Current SPX index spot price at the time this scan ran.',
            why: 'Used as the reference point to determine distance from Gamma Flip and Max Pain. The relationship between spot, flip, and max pain determines dealer hedging pressure.',
            source: 'CBOE real-time feed',
          }}
        />
        <DataPoint
          label="Max Pain"
          value={data.gex_max_pain?.toLocaleString() ?? '—'}
          tooltip={{
            what: 'The strike at which the aggregate dollar value of outstanding options (calls + puts) is minimized — i.e., where the maximum number of contracts expire worthless.',
            why: 'Price gravitates toward this level near expiry as market makers manage their books. A large divergence between spot and max pain signals potential pinning or reversal pressure.',
            source: 'CBOE options chain (delayed)',
          }}
        />
        {spotAboveFlip !== null && (
          <DataPoint
            label="Spot vs Flip"
            value={`${spotAboveFlip ? 'ABOVE' : 'BELOW'} flip (${flipPct}%)`}
            color={spotAboveFlip ? '#10b981' : '#f43f5e'}
            tooltip={{
              what: 'Directional relationship between SPX spot and the Gamma Flip level, expressed as a percentage distance.',
              why: spotAboveFlip
                ? `SPX is ${flipPct}% above the flip — dealers are in long-gamma territory, acting as stabilizers. Suppressed volatility environment.`
                : `SPX is ${Math.abs(Number(flipPct))}% below the flip — dealers are in short-gamma territory, amplifying moves. Elevated realized vol expected.`,
              source: 'Derived from CBOE GEX data',
            }}
          />
        )}
        <DataPoint
          label="Total GEX $"
          value={gexBillions ? `$${gexBillions}B` : '—'}
          color={isNeg ? '#f43f5e' : '#10b981'}
          tooltip={{
            what: 'Total dollar gamma exposure across all SPX/SPY options, aggregated. Represents how much dealers must buy/sell per 1% SPX move to stay delta-hedged.',
            why: isNeg
              ? `Negative GEX ($${gexBillions}B) means dealers are net short gamma — they BUY into rallies and SELL into dips, which AMPLIFIES price swings.`
              : `Positive GEX ($${gexBillions}B) means dealers are net long gamma — they SELL into rallies and BUY dips, which SUPPRESSES volatility.`,
            source: 'CBOE / SpotGamma (delayed)',
          }}
        />
        {data.gex_boost !== undefined && (
          <KV
            label="Kill Chain Boost"
            value={`+${data.gex_boost}`}
            color={isArmed ? '#f97316' : '#71717a'}
          />
        )}
      </div>

      <IntelligenceBriefing content={data.explanation_GEX} anchor={anchor} />
      <PillarFooter src="cboe" slug={data.gex_slug} />
    </PillarShell>
  );
};
