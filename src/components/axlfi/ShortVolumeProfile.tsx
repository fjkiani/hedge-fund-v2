/**
 * Short Volume Profile — 30-day short volume vs total volume bar chart
 */
import { AXLFICard } from './shared';

export function ShortVolumeProfile({ detail }: { detail: any }) {
  if (!detail?.individual_short_volume) return null;

  const sv = detail.individual_short_volume;
  const dates = detail.individual_dark_pool_position_data?.dates || [];
  const shortVol = sv.short_volume || [];
  const totalVol = sv.total_volume || [];
  const svPct = sv.short_volume_pct || [];
  const maxVol = Math.max(...totalVol, 1);

  return (
    <AXLFICard title={`${detail.symbol || 'SPY'} Short Volume (30D)`} icon="📉">
      <div className="space-y-1">
        {shortVol.slice(-15).map((_: any, i: number) => {
          const idx = shortVol.length - 15 + i;
          const svRatio = (shortVol[idx] || 0) / maxVol;
          const tvRatio = (totalVol[idx] || 0) / maxVol;
          const pctVal = svPct[idx] || 0;

          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-text-muted w-14 text-right shrink-0">
                {dates[idx] ? dates[idx].slice(5) : `D${idx}`}
              </span>
              <div className="flex-1 h-4 bg-bg-tertiary rounded overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 rounded opacity-30"
                  style={{ width: `${tvRatio * 100}%`, background: '#4a5568' }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded"
                  style={{ width: `${svRatio * 100}%`, background: '#ff3366' }}
                />
              </div>
              <span className="text-text-secondary w-10 text-right font-mono shrink-0">
                {pctVal.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-text-muted mt-3">
        <span>■ Short Volume  ■ Total Volume</span>
        <span>Latest: {svPct[svPct.length - 1]?.toFixed(1)}% SV</span>
      </div>
    </AXLFICard>
  );
}
