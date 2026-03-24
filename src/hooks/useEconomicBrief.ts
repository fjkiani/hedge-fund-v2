/**
 * useEconomicBrief — slim /brief/master slice for Economic Exploit
 *
 * Reads economic fields from /brief/master — browser caches the GET so
 * Today's Brief and Economic Exploit share the same response.
 *
 * Returns:
 *   adp_prediction    → MISS_LIKELY | BEAT_LIKELY | IN_LINE
 *   gdp_nowcast       → MISS_LIKELY | BEAT_LIKELY | IN_LINE  (normalized)
 *   jobless_claims    → MISS_LIKELY | BEAT_LIKELY | IN_LINE
 *   economic_veto     → next_event, hours_away, tier, confidence_cap, upcoming_critical[]
 *   dynamic_thresholds→ cpi{}, core_pce{}, non_farm_payrolls{}
 *   nowcast           → raw Cleveland Fed nowcast (cpi_mom, pce_mom, etc.)
 *   alerts            → PreSignalAlertEngine output — includes PRE_SIGNAL type for CPI/PCE
 *   inflation_presignal → 'PRE_HOT' | 'PRE_COLD' | 'NEUTRAL' derived from alerts
 *
 * Re-fetches every 2 min (matches upcoming-critical poll cadence).
 */

import { useState, useEffect, useRef } from 'react';

const API_BASE    = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';
const BRIEF_URL   = `${API_BASE}/brief/master`;
const REFETCH_MS  = 2 * 60 * 1000;

export type PreSignal = 'MISS_LIKELY' | 'BEAT_LIKELY' | 'IN_LINE';
export type InflationPreSignal = 'PRE_HOT' | 'PRE_COLD' | 'NEUTRAL';

export interface PreSignalBlock {
  signal:       PreSignal;
  consensus:    number | null;
  prediction?:  number | null;   // ADP only
  estimate?:    number | null;   // GDP only (gdp_estimate)
  vs_consensus?: number | null;  // GDP only
  icsa_4wk_avg?: number | null;  // Jobless only
  delta?:       number | null;
  confidence:   number | null;
  edge:         string | null;
  reasons?:     string[];
  as_of?:       string | null;
}

export interface EconVeto {
  hours_away:       number | null;
  next_event:       string | null;
  tier:             string | null;
  confidence_cap:   number | null;
  upcoming_critical: Array<{
    event:     string;
    date:      string;
    time:      string;
    consensus: string;
    previous:  string;
  }>;
}

export interface DynamicThresholds {
  cpi?:              { HOT: number | null; COLD: number | null; consensus: number; std_dev: number };
  core_pce?:         { HOT: number | null; COLD: number | null; consensus: number; std_dev: number };
  non_farm_payrolls?:{ HOT: number | null; COLD: number | null; consensus: number; std_dev: number };
}

export interface NowcastBlock {
  cpi_mom:       number | null;
  core_cpi_mom:  number | null;
  pce_mom:       number | null;
  core_pce_mom:  number | null;
  cpi_yoy:       number | null;
  pce_yoy:       number | null;
  updated?:      string | null;
}

export interface EconomicBriefState {
  adp_prediction:       PreSignalBlock | null;
  gdp_nowcast:          PreSignalBlock | null;
  jobless_claims:       PreSignalBlock | null;
  pmi:                  PreSignalBlock | null;   // S&P Global PMI composite
  umich_sentiment:      PreSignalBlock | null;   // Michigan Sentiment
  umich_expectations:   PreSignalBlock | null;   // Michigan Expectations
  current_account:      PreSignalBlock | null;   // Current Account deviation
  economic_veto:        EconVeto | null;
  dynamic_thresholds:   DynamicThresholds | null;
  nowcast:              NowcastBlock | null;
  alerts:               any[];
  /** Derived from alerts → type:'PRE_SIGNAL' signal:'PRE_HOT'/'PRE_COLD' */
  inflation_presignal:  InflationPreSignal;
  /** True when any predictor has signal !== 'IN_LINE' or inflation is PRE_HOT */
  any_presignal_active: boolean;
  loading: boolean;
  error:   string | null;
  as_of:   string | null;
}

const EMPTY: EconomicBriefState = {
  adp_prediction:       null,
  gdp_nowcast:          null,
  jobless_claims:       null,
  pmi:                  null,
  umich_sentiment:      null,
  umich_expectations:   null,
  current_account:      null,
  economic_veto:        null,
  dynamic_thresholds:   null,
  nowcast:              null,
  alerts:               [],
  inflation_presignal:  'NEUTRAL',
  any_presignal_active: false,
  loading:              true,
  error:                null,
  as_of:                null,
};

function normalizePreSignal(raw: any): PreSignalBlock | null {
  if (!raw || raw.error) return null;
  return {
    signal:        raw.signal         ?? 'IN_LINE',
    consensus:     raw.consensus      ?? null,
    prediction:    raw.prediction     ?? null,
    estimate:      raw.gdp_estimate   ?? null,
    vs_consensus:  raw.vs_consensus   ?? null,
    icsa_4wk_avg:  raw.icsa_4wk_avg  ?? null,
    delta:         raw.delta          ?? null,
    confidence:    raw.confidence     ?? null,
    edge:          raw.edge           ?? null,
    reasons:       raw.reasons        ?? [],
    as_of:         raw.as_of         ?? null,
  };
}

function normalizeVeto(raw: any): EconVeto | null {
  if (!raw || raw.error) return null;
  return {
    hours_away:       raw.hours_away       ?? null,
    next_event:       raw.next_event       ?? null,
    tier:             raw.tier             ?? null,
    confidence_cap:   raw.confidence_cap   ?? null,
    upcoming_critical: raw.upcoming_critical ?? [],
  };
}

function normalizeNowcast(raw: any): NowcastBlock | null {
  if (!raw || raw.error) return null;
  return {
    cpi_mom:      raw.cpi_mom      ?? null,
    core_cpi_mom: raw.core_cpi_mom ?? null,
    pce_mom:      raw.pce_mom      ?? null,
    core_pce_mom: raw.core_pce_mom ?? null,
    cpi_yoy:      raw.cpi_yoy     ?? null,
    pce_yoy:      raw.pce_yoy     ?? null,
    updated:      raw.updated      ?? null,
  };
}

function deriveInflationPresignal(alerts: any[]): InflationPreSignal {
  for (const a of alerts) {
    if (a.type === 'PRE_SIGNAL') {
      if (a.signal === 'PRE_HOT')  return 'PRE_HOT';
      if (a.signal === 'PRE_COLD') return 'PRE_COLD';
    }
  }
  return 'NEUTRAL';
}

function isActive(block: PreSignalBlock | null): boolean {
  return !!block && block.signal !== 'IN_LINE';
}

export function useEconomicBrief(): EconomicBriefState {
  const [state, setState] = useState<EconomicBriefState>(EMPTY);
  const cancelRef = useRef(false);

  const fetch_ = async () => {
    cancelRef.current = false;
    try {
      const res = await fetch(BRIEF_URL);
      if (!res.ok) throw new Error(`brief/master: ${res.status}`);
      const json = await res.json();
      if (cancelRef.current) return;

      const adp           = normalizePreSignal(json.adp_prediction);
      const gdp           = normalizePreSignal(json.gdp_nowcast);
      const jobless       = normalizePreSignal(json.jobless_claims);
      const pmi           = normalizePreSignal(json.pmi);
      const umichSent     = normalizePreSignal(json.umich_sentiment);
      const umichExp      = normalizePreSignal(json.umich_expectations);
      const currentAcc    = normalizePreSignal(json.current_account);
      const alerts        = Array.isArray(json.alerts) ? json.alerts : [];
      const inflationPs   = deriveInflationPresignal(alerts);

      setState({
        adp_prediction:       adp,
        gdp_nowcast:          gdp,
        jobless_claims:       jobless,
        pmi:                  pmi,
        umich_sentiment:      umichSent,
        umich_expectations:   umichExp,
        current_account:      currentAcc,
        economic_veto:        normalizeVeto(json.economic_veto),
        dynamic_thresholds:   json.dynamic_thresholds ?? null,
        nowcast:              normalizeNowcast(json.nowcast),
        alerts,
        inflation_presignal:  inflationPs,
        any_presignal_active: (
          isActive(adp) || isActive(gdp) || isActive(jobless) ||
          isActive(pmi) || isActive(umichSent) || isActive(umichExp) ||
          isActive(currentAcc) || inflationPs !== 'NEUTRAL'
        ),
        loading: false,
        error:   null,
        as_of:   json.as_of ?? null,
      });
    } catch (e: any) {
      if (cancelRef.current) return;
      setState(prev => ({ ...prev, loading: false, error: e?.message ?? 'brief/master unavailable' }));
    }
  };

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, REFETCH_MS);
    return () => { cancelRef.current = true; clearInterval(id); };
  }, []);

  return state;
}
