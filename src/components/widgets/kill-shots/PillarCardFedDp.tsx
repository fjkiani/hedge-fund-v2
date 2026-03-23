import React from 'react';
import type { KillShotsLayers } from './types';
import { PillarShell, PillarFooter, IntelligenceBriefing, DataPoint, KV } from './ui';

interface Props { data: KillShotsLayers }

export const PillarCardFedDp: React.FC<Props> = ({ data }) => {
  const isArmed = (data.fed_dp_boost ?? 0) >= 3;
  const svPct = data.spy_short_vol_pct ?? 0;
  const svColor = svPct > 55 ? '#f43f5e' : svPct < 45 ? '#10b981' : '#f59e0b';

  // Fix: use live SV% as the displayed value, not a hardcoded "LOADING/NEUTRAL" placeholder
  const displayValue = data.spy_short_vol_pct != null ? `${svPct.toFixed(1)}% SV` : '—';

  // Anchor for LLM briefing
  const anchor = [
    data.spy_short_vol_pct != null ? `SPY_SV%=${svPct.toFixed(1)}%` : null,
    data.vix != null ? `VIX=${data.vix}` : null,
    data.fed_dp_divergence != null ? `divergence=${data.fed_dp_divergence ? 'ACTIVE' : 'NEUTRAL'}` : null,
  ].filter(Boolean).join(', ');

  return (
    <PillarShell
      isArmed={isArmed}
      label="Order Flow vs Policy"
      title="FED / DP"
      value={displayValue}
      status={isArmed ? 'ARMED' : 'WATCH'}
    >
      {/* Status + Boost header */}
      <div className="flex items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-white/5 mb-5">
        <div className="flex-1">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">DP Divergence</span>
          <span className="text-xs font-black uppercase" style={{ color: data.fed_dp_divergence ? '#f43f5e' : '#71717a' }}>
            {data.fed_dp_divergence ? 'ACTIVE' : 'NEUTRAL'}
          </span>
        </div>
        <div className="h-8 w-px bg-zinc-800" />
        <div className="flex-1 text-right">
          <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Boost</span>
          <span className="text-xs font-black text-white">+{data.fed_dp_boost ?? 0}</span>
        </div>
      </div>

      {/* Auditable data points */}
      <div className="space-y-0 mb-5">
        <DataPoint
          label="SPY SV%"
          value={`${svPct.toFixed(1)}%`}
          color={svColor}
          tooltip={{
            what: 'Percentage of SPY total volume traded off-exchange (dark pools, internalizers) as reported by Stockgrid\'s daily dark pool feed.',
            why: svPct > 55
              ? `At ${svPct.toFixed(1)}%, a majority of SPY flow is hidden from lit markets. This level signals institutional bearish positioning — they are routing sell orders through dark pools to minimize market impact.`
              : svPct < 45
              ? `At ${svPct.toFixed(1)}%, most SPY flow is on lit exchanges — transparent, likely retail-driven or bullish institutional buying without concealment.`
              : `At ${svPct.toFixed(1)}%, SPY dark pool volume is neutral (40-55% range). No strong directional signal from order routing alone.`,
            source: 'Stockgrid dark pool feed (daily)',
          }}
        />
        {data.vix !== undefined && (
          <DataPoint
            label="VIX"
            value={String(data.vix)}
            color={data.vix > 25 ? '#f43f5e' : data.vix > 18 ? '#f59e0b' : '#10b981'}
            tooltip={{
              what: 'CBOE Volatility Index — measures the 30-day implied volatility of S&P 500 options. Often called the "fear gauge."',
              why: data.vix > 25
                ? `VIX at ${data.vix} is in fear regime (>25). Options premiums are elevated, suggesting the market is pricing in significant tail risk. High VIX + high SV% = institutional hedging activity.`
                : data.vix > 18
                ? `VIX at ${data.vix} is in caution zone (18-25). Moderate uncertainty. Watch for expansion above 25 as a risk-off trigger.`
                : `VIX at ${data.vix} is complacent (<18). Low implied vol — options are cheap, market is pricing in stability.`,
              source: 'CBOE real-time',
            }}
          />
        )}
        <DataPoint
          label="Divergent"
          value={data.fed_dp_divergence ? 'YES' : 'NO'}
          color={data.fed_dp_divergence ? '#f43f5e' : '#71717a'}
          tooltip={{
            what: 'Boolean flag triggered when dark pool short-volume percentage diverges significantly from the prevailing Fed policy narrative or price action direction.',
            why: data.fed_dp_divergence
              ? 'ACTIVE divergence detected: institutional dark pool flow is contradicting the surface narrative. This is a high-conviction signal that smart money is positioned opposite to the crowd.'
              : 'No divergence — dark pool flow and macro narrative are aligned. Lower signal weight for this pillar.',
            source: 'Kill Chain divergence engine (Stockgrid + FRED overlay)',
          }}
        />
        <KV
          label="Kill Chain Boost"
          value={`+${data.fed_dp_boost ?? 0}`}
          color={isArmed ? '#f97316' : '#71717a'}
        />
        {data.dp_trend_velocity != null && (
          <DataPoint
            label="DP Velocity"
            value={`${data.dp_trend_velocity > 0 ? '+' : ''}${data.dp_trend_velocity.toFixed(1)}%`}
            color={data.dp_trend_velocity > 0 ? '#10b981' : '#f43f5e'}
            tooltip={{
              what: '5-day dark pool volume velocity — the rate of change in aggregate dark pool volume over the last 5 trading sessions.',
              why: data.dp_trend_velocity > 0
                ? `DP velocity at +${data.dp_trend_velocity.toFixed(1)}% — institutional accumulation is accelerating. Smart money is increasing dark pool buying activity.`
                : `DP velocity at ${data.dp_trend_velocity.toFixed(1)}% — institutional distribution is increasing. Smart money is routing more sell flow through dark pools.`,
              source: 'AXLFI / Stockgrid dark pool data (DarkPoolTrend signal)',
            }}
          />
        )}
        {data.dp_trend_direction != null && (
          <KV
            label="DP Direction"
            value={data.dp_trend_direction}
            color={data.dp_trend_direction === 'ACCUMULATION' ? '#10b981' : '#f43f5e'}
          />
        )}
      </div>

      {/* SPY SV% intensity gauge — real data, not synthetic */}
      <div className="space-y-2 border-t border-white/5 pt-4 mb-2">
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">SPY SV% Intensity</span>
        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(svPct, 100)}%`, backgroundColor: svColor }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-zinc-700">
          <span>0%</span><span>50% threshold</span><span>100%</span>
        </div>
      </div>

      <IntelligenceBriefing content={data.explanation_FED_DP} anchor={anchor} />
      <PillarFooter src="stockgrid" slug={data.fed_dp_slug} />
    </PillarShell>
  );
};
