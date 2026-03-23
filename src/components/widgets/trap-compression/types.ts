// Strict TypeScript types for /charts/{symbol}/matrix response.
// Maps directly to tm_models.py MarketState.to_dict()
// DO NOT add fields not verified in the backend. Anti-slop rule enforced here.

export interface TrapZone {
  type: string;        // BULL_TRAP | BEAR_TRAP_COIL | CEILING_TRAP | LIQUIDITY_TRAP | DEATH_CROSS_TRAP | WAR_HEADLINE
  price_min: number;
  price_max: number;
  conviction: number;  // 1-5
  narrative: string;
  data_point?: string;
  supporting_sources: string[];
  emoji: string;
}

export interface GexWall {
  price: number;
  gamma: number;
  type: 'call' | 'put';
}

export interface DpLevel {
  price: number;
  volume: number;
  type: 'support' | 'resistance' | 'battleground';
}

export interface TrapMatrixState {
  symbol: string;
  current_price: number;
  timestamp: string;
  levels: {
    dp_levels: DpLevel[];
    gex_walls: GexWall[];
    gamma_flip: number | null;
    max_pain: number | null;
    pivots: Record<string, number>;
    moving_averages: Record<string, number>;
    vwap: number | null;
  };
  traps: TrapZone[];
  context: {
    cot_net_spec: number | null;
    cot_signal: string;
    gamma_regime: string;
    vix: number | null;
    vix_regime: string;
    death_cross: boolean;
    alert_level: 'GREEN' | 'YELLOW' | 'RED';
  };
  staleness: Record<string, { age: string; stale: boolean; last_updated: string }>;
  rebuild_reason: string;
  version: number;
}

// Alert level color mapping
export const ALERT_COLORS = {
  GREEN:  { text: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: '#10b981' },
  YELLOW: { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: '#f59e0b' },
  RED:    { text: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: '#f43f5e' },
} as const;

// Trap type → accent color
export const TRAP_ACCENT: Record<string, string> = {
  BEAR_TRAP_COIL:    '#10b981',
  BULL_TRAP:         '#f43f5e',
  CEILING_TRAP:      '#f43f5e',
  DEATH_CROSS_TRAP:  '#f43f5e',
  LIQUIDITY_TRAP:    '#f59e0b',
  WAR_HEADLINE:      '#a78bfa',
};
