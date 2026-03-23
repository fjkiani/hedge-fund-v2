import { KillChainLayer, RawHistoryEntry } from './types';

/** Count active layers from a raw log entry. */
export function deriveLayers(entry: RawHistoryEntry): { active: number; total: number } {
  const l = entry.layers ?? {};
  const active = [l.cot_divergence, l.gex_positive, l.dp_selling].filter(Boolean).length;
  return { active: entry.triple_active ? Math.max(active, 2) : active, total: 3 };
}

export function fmtTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts.slice(11, 16) || '--:--';
  }
}

export function fmtDate(raw?: string): string {
  if (!raw) return 'TBD';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return (
      d.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) +
      ' 08:30 ET'
    );
  } catch {
    return raw;
  }
}

/** Format the numeric value for a layer card headline. */
export function fmtLayerValue(layer: KillChainLayer): string {
  const unit = (layer.unit ?? '').toLowerCase();
  if (unit.includes('specs net') || unit.includes('cot')) {
    return `${(layer.value / 1000).toFixed(0)}k`;
  }
  if (unit.includes('%') || unit.includes('short vol')) {
    return `${layer.value.toFixed(1)}%`;
  }
  return layer.value.toFixed(3);
}

/** One-line human goal string per layer. */
export function layerGoal(layer: KillChainLayer): string {
  const unit = (layer.unit ?? '').toLowerCase();
  if (unit.includes('specs net')) return 'Goal: Specs Net < 0 (Crowded Short)';
  if (unit.includes('gex')) return 'Goal: Negative Gamma (Dealers Amplify Moves)';
  if (unit.includes('short vol') || unit.includes('%')) return 'Goal: Short Vol > 55% (Panic Threshold)';
  return layer.signal;
}

/** Brief meaning sentence per layer. */
export function layerMeaning(layer: KillChainLayer): string {
  const unit = (layer.unit ?? '').toLowerCase();
  if (unit.includes('specs net')) {
    return "Institutional 'Smart Money' net position. Extreme shorts create short-squeeze potential.";
  }
  if (unit.includes('gex')) {
    return 'Gamma Exposure regime. Negative GEX means dealers amplify price moves — volatility accelerant.';
  }
  if (unit.includes('short vol') || unit.includes('%')) {
    return 'Short-volume ratio (DVR). Above 55% signals panic selling — high-probability reversal zone.';
  }
  return layer.signal;
}

/** Result label for a signal log row. */
export function signalRowResult(entry: RawHistoryEntry): string {
  const t = entry.type.toUpperCase();
  if (t === 'ACTIVATION') return '🔥 ARMED';
  if (t === 'DEACTIVATION') {
    const pnl = entry.pnl_pct ?? 0;
    return `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`;
  }
  return entry.triple_active ? '🔥 ARMED' : 'WAITING';
}
