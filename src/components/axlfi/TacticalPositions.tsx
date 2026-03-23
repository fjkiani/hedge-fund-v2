/**
 * Tactical Positions Widget — AXLFI model long/short positions
 */
import { AXLFICard } from './shared';

export function TacticalPositions({ dashboard }: { dashboard: any }) {
  const positions = dashboard?.tactical_allocation?.positions || [];
  if (!positions.length) return null;

  return (
    <AXLFICard title="AXLFI Tactical Positions" icon="🎯">
      <div className="space-y-2">
        {positions.map((pos: any, i: number) => (
          <div key={i} className="flex items-center justify-between bg-bg-tertiary rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-xs"
                style={{
                  background: pos.dir === 1 ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)',
                  color: pos.dir === 1 ? '#00ff88' : '#ff3366',
                }}
              >
                {pos.dir === 1 ? '↑' : '↓'}
              </span>
              <span className="text-sm font-bold text-text-primary">{pos.ticker}</span>
            </div>
            <span
              className="text-xs font-semibold uppercase"
              style={{ color: pos.position === 'long' ? '#00ff88' : '#ff3366' }}
            >
              {pos.position}
            </span>
          </div>
        ))}
      </div>
    </AXLFICard>
  );
}
