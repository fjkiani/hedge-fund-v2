/**
 * Institutional Signals Widget — Bullish/Bearish signal list
 */
import { AXLFICard } from './shared';

export function InstitutionalSignals({ data }: { data: any }) {
  const signals = data?.signals || [];
  if (!signals.length) return null;

  return (
    <AXLFICard title="Institutional Signals" icon="⚡">
      <div className="space-y-2">
        {signals.map((sig: any, i: number) => {
          const isBullish = sig.dir === 1;
          return (
            <div key={i} className="flex items-center justify-between bg-bg-tertiary rounded-lg px-3 py-2">
              <span className="text-sm font-bold text-text-primary">{sig.symbol}</span>
              <div className="flex items-center gap-2">
                <span style={{ color: isBullish ? '#00ff88' : '#ff3366' }}>
                  {isBullish ? '▲' : '▼'}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: isBullish ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)',
                    color: isBullish ? '#00ff88' : '#ff3366',
                  }}
                >
                  {isBullish ? 'BULLISH' : 'BEARISH'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-text-muted mt-3 text-right">
        {signals.length} active signals • {data?.as_of ? new Date(data.as_of).toLocaleTimeString() : ''}
      </div>
    </AXLFICard>
  );
}
