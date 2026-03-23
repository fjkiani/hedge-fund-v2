/**
 * Option Walls Widget — Call wall / POC / Put wall per symbol
 */
import { AXLFICard } from './shared';

export function TodayWalls({ symbol, walls }: { symbol: string; walls: any }) {
  if (!walls) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg p-4">
      <div className="text-xs text-text-muted font-medium mb-2">{symbol}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-text-muted">Call Wall</div>
          <div className="text-lg font-bold" style={{ color: '#ff3366' }}>${walls.call_wall}</div>
          <div className="text-[9px] text-text-muted/60 italic">Ceiling</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">POC</div>
          <div className="text-lg font-bold" style={{ color: '#ffd700' }}>${walls.poc}</div>
          <div className="text-[9px] text-text-muted/60 italic">Magnet</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Put Wall</div>
          <div className="text-lg font-bold" style={{ color: '#00ff88' }}>${walls.put_wall}</div>
          <div className="text-[9px] text-text-muted/60 italic">Floor</div>
        </div>
      </div>
      {walls.call_wall_2 && (
        <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-2 border-t border-border-subtle">
          <div className="text-xs text-text-muted">CW2: ${walls.call_wall_2}</div>
          <div className="text-xs text-text-muted">CW3: ${walls.call_wall_3}</div>
          <div className="text-xs text-text-muted">PW2: ${walls.put_wall_2}</div>
        </div>
      )}
    </div>
  );
}

/** Wrapper that groups SPY/QQQ/IWM walls into a single card */
export function OptionWallsPanel({ spyWalls, qqqWalls, iwmWalls }: {
  spyWalls: any; qqqWalls: any; iwmWalls: any;
}) {
  return (
    <AXLFICard title="Option Walls — Today" icon="🧱" className="mb-6">
      <p className="text-[11px] text-text-muted/80 italic mb-3">These are the price levels where options market makers must buy or sell to stay hedged. Call walls are ceilings. Put walls are floors. POC (point of control) is where the most volume traded — price is magnetically attracted here.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TodayWalls symbol="SPY" walls={spyWalls} />
        <TodayWalls symbol="QQQ" walls={qqqWalls} />
        <TodayWalls symbol="IWM" walls={iwmWalls} />
      </div>
    </AXLFICard>
  );
}
