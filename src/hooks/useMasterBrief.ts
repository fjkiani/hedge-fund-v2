import { useEffect, useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface MasterBriefAlert {
  type: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  event?: string;
  signal?: string;
  edge?: string;
  action?: string;
  nowcast_value?: number;
  consensus?: number;
  divergence_pct?: number;
  hours?: number;
  tier?: string;
  cap?: number;
  regime?: string;
  ticker?: string;
  p_hike?: number;
  inflation_score?: number;
  growth_score?: number;
  penalty?: number;
  total_gex?: number;
  // ADP / GDP alert fields
  delta?: number;
  prediction?: number;
  estimate?: number;
}

export interface MasterBrief {
  as_of: string;
  scan_time: number;
  macro_regime: {
    regime: string;
    inflation_score: number;
    growth_score: number;
    modifier: { long_penalty: number; short_penalty: number; warning: string | null };
    error?: string;
  };
  fed_intelligence: {
    rate_path: {
      current_rate: number;
      current_range: number[];
      may_p_hike: number;
      may_p_hold: number;
      may_p_cut: number;
      terminal_bps: number;
      meetings_count: number;
      next_meeting: string;
      days_away: number;
      regime_multiplier: number;
    };
    full_path: Array<{
      date: string;
      label: string;
      p_cut_25: number;
      p_hold: number;
      p_hike_25: number;
      cumulative_bps: number;
      days_away: number;
    }>;
    error?: string;
  };
  economic_veto: {
    hours_away: number | null;
    next_event: string | null;
    tier: string;
    confidence_cap: number;
    upcoming_critical: Array<{
      event: string;
      date: string;
      time: string;
      consensus: string;
      previous: string;
    }>;
    error?: string;
  };
  nowcast: {
    cpi_mom: number;
    core_cpi_mom: number;
    pce_mom: number;
    core_pce_mom: number;
    cpi_yoy: number;
    pce_yoy: number;
    updated: string;
    error?: string;
  };
  dynamic_thresholds: Record<string, {
    HOT: number;
    COLD: number;
    consensus: number;
    std_dev: number;
  }>;
  hidden_hands: {
    politician_cluster: number;
    hot_tickers: string[];
    insider_net_usd: number;
    divergence_boost: number;
    fed_tone: string;
    hawk_count: number;
    dove_count: number;
    spouse_alerts: number;
    finnhub_signals: any[];
    top_divergence: string | null;
    error?: string;
  };
  derivatives: {
    gex_regime: string;
    total_gex: number;
    put_wall: number | null;
    call_wall: number | null;
    spot: number;
    gamma_flip: number | null;
    max_pain: number | null;
    cot_spec_net?: number;
    cot_spec_side?: string;
    cot_divergent?: boolean;
    cot_trap?: string;
    error?: string;
  };
  kill_chain_state: {
    alert_level: string;
    layers_active: number;
    narrative: string;
    mismatches_count: number;
    regime_modifier: number;
    confidence_cap: number;
    cap_reason: string;
    error?: string;
  };
  adp_prediction?: {
    signal: string;
    prediction: number;
    consensus: number;
    delta: number;
    confidence: number;
    reasons: string[];
    inputs: Record<string, number>;
    edge: string;
    as_of: string;
    error?: string;
  };
  gdp_nowcast?: {
    gdp_estimate: number;
    as_of: string;
    consensus: number;
    vs_consensus: number;
    signal: string;
    edge: string;
    source: string;
    error?: string;
  };
  alerts: MasterBriefAlert[];
}

export function useMasterBrief(refreshMs = 120000) {
  const [data, setData] = useState<MasterBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBrief = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/brief/master`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setData(d);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief();
    const interval = setInterval(fetchBrief, refreshMs);
    return () => clearInterval(interval);
  }, [fetchBrief, refreshMs]);

  return { data, loading, error, lastUpdated, refetch: fetchBrief };
}
