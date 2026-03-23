// Strict TypeScript types for /kill-shots-live `layers` response.
// DO NOT add fields not verified in the backend. Anti-slop rule enforced here.

export interface KillShotsLayers {
  // BRAIN
  brain_boost?: number;
  brain_reasons?: string[];
  brain_slug?: string;
  explanation_BRAIN?: string;

  // COT
  cot_boost?: number;
  cot_specs_net?: number;
  cot_comm_net?: number;
  cot_divergent?: boolean;
  cot_slug?: string;
  explanation_COT?: string;

  // GEX
  gex_boost?: number;
  total_gex_dollars?: number;
  gex_regime?: string;
  gex_gamma_flip?: number;
  gex_spot_price?: number;
  gex_max_pain?: number;
  gex_slug?: string;
  explanation_GEX?: string;

  // FED vs DP
  fed_dp_boost?: number;
  spy_short_vol_pct?: number;
  fed_dp_divergence?: boolean;
  fed_dp_slug?: string;
  vix?: number;
  explanation_FED_DP?: string;

  // DP Signal enrichment (from DarkPoolTrend via signalsApi)
  dp_trend_velocity?: number | null;
  dp_trend_direction?: 'ACCUMULATION' | 'DISTRIBUTION' | null;
}

export interface KillShotsResponse {
  divergence_score: number;
  verdict: string;
  action: string;
  action_plan?: {
    position: string;
    entry_trigger: string;
    invalidation: string;
    time_window: string;
  };
  layers: KillShotsLayers;
  reasons: string[];
  explanations: Record<string, string>;
  timestamp: string;
  error?: string;
}
