/**
 * Index Snapshot Widget — SPY/QQQ/IWM prices + change
 */
import { AXLFICard } from './shared';

export function IndexSnapshot({ snapshot }: { snapshot: any }) {
  if (!snapshot?.market_snapshot) return null;
  const indices = Object.values(snapshot.market_snapshot) as any[];

  return (
    <AXLFICard title="Market Snapshot" icon="📈">
      <div className="grid grid-cols-3 gap-3">
        {indices.map((idx: any) => (
          <div key={idx.symbol} className="bg-bg-tertiary rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted font-medium">{idx.symbol}</div>
            <div className="text-lg font-bold text-text-primary mt-1">${idx.close?.toFixed(2)}</div>
            <div
              className="text-xs font-semibold mt-1"
              style={{ color: idx.change_pct < 0 ? '#ff3366' : '#00ff88' }}
            >
              {idx.change_pct >= 0 ? '+' : ''}{idx.change_pct?.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </AXLFICard>
  );
}
