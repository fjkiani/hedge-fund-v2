// Dark Pool Flow — TypeScript interfaces.
// These match the API contract from darkpoolApi (backend /darkpool/* endpoints).
// DO NOT add fields not verified in the backend. No synthetic data.

export interface DPLevel {
  price: number;
  volume: number;
  level_type: 'SUPPORT' | 'RESISTANCE' | 'BATTLEGROUND';
  strength: number;
  distance_from_price?: number;
}

export interface DPPrint {
  price: number;
  volume: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
}

export interface DPSummary {
  total_volume: number;
  dp_percent: number;
  buying_pressure: number;
  dp_position_dollars: number | null;
  net_short_dollars: number | null;
  short_volume_pct: number | null;
  nearest_support: DPLevel | null;
  nearest_resistance: DPLevel | null;
  battlegrounds: DPLevel[];
}

export interface DPTopPosition {
  ticker: string;
  dp_position_dollars: number;
  dp_position_shares: number;
  short_volume_pct: number;
  net_short_volume: number | null;
  date: string;
}

// ---- Formatting helpers (shared across all sub-components) ----

export function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

export function formatDollars(dollars: number): string {
  if (dollars >= 1_000_000_000) return `$${(dollars / 1_000_000_000).toFixed(1)}B`;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  return `$${dollars.toLocaleString()}`;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getLevelColor(type: string): { bg: string; text: string; border: string } {
  switch (type) {
    case 'SUPPORT':     return { bg: '#10b981', text: '#10b981', border: 'border-emerald-500/30' };
    case 'RESISTANCE':  return { bg: '#f43f5e', text: '#f43f5e', border: 'border-rose-500/30' };
    case 'BATTLEGROUND':return { bg: '#eab308', text: '#eab308', border: 'border-yellow-500/30' };
    default:            return { bg: '#52525b', text: '#71717a', border: 'border-zinc-700/30' };
  }
}
