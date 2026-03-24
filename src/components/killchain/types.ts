// Shared TypeScript types for the Kill Chain dashboard

export interface KillChainLayer {
  name: string;
  triggered: boolean;
  value: number;
  unit: string;
  signal: string;
}

export interface KillChainPosition {
  entry_price: number;
  current_pnl: number;
  activated_at: string | null;
}

export interface KillChainData {
  score: number;
  verdict: string;
  direction: string;
  confluence: string;
  triggered_count: number;
  armed: boolean;
  bullish_points: number;
  bearish_points: number;
  layer_1: KillChainLayer;
  layer_2: KillChainLayer;
  layer_3: KillChainLayer;
  position: KillChainPosition;
}

export interface RawHistoryEntry {
  timestamp: string;
  /** "check" | "ACTIVATION" | "DEACTIVATION" */
  type: string;
  triple_active: boolean;
  layers: {
    cot_divergence?: boolean;
    gex_positive?: boolean;
    dp_selling?: boolean;
    dvr?: number;
    [key: string]: any;
  };
  spy_price: number;
  event?: string;
  pnl_pct?: number;
  activation_price?: number;
}

export interface MonitorResponse {
  total_checks: number;
  activations: number;
  current_state: any;
  history: RawHistoryEntry[];
  kill_chain: KillChainData;
  error?: string;
}

export interface UpcomingEvent {
  event: string;
  date?: string;
  importance?: string;
  consensus?: string;
  previous?: string;
  [key: string]: any;
}

/** Shape passed into AiBriefingPanel when a user clicks a card or row. */
export interface AiBriefingItem {
  title?: string;
  action?: string;
  value?: string | number;
  price?: string | number;
  unit?: string;
  result?: string;
  goal?: string;
  layers?: string;
  meaning?: string;
  status?: string;
  slug?: string;
  /** Full Kill Chain snapshot — injected by KillChainDashboard for rich Oracle context */
  killChainContext?: KillChainContext;
}

/** Full Kill Chain state snapshot passed to the Oracle for context-aware analysis */
export interface KillChainContext {
  score: number;
  verdict: string;
  direction: string;
  confluence: string;
  triggered_count: number;
  armed: boolean;
  bullish_points: number;
  bearish_points: number;
  spy_spot: number;
  layers: {
    name: string;
    triggered: boolean;
    value: number;
    unit: string;
    signal: string;
  }[];
  total_checks?: number;
  activations?: number;
}
