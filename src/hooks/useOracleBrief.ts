/**
 * useOracleBrief(masterData) — MDC-spec oracle hook
 *
 * Signature: takes MasterBrief from useMasterBrief as input.
 * Does NOT re-fetch /brief/master internally.
 * Caches on masterData.scan_time to avoid duplicate POSTs.
 *
 * Fallback: any 4xx/5xx → risk_level = 'UNKNOWN', panels still render.
 * PRODUCTION RULE: no panel calls Groq directly. Only this hook.
 */

import { useState, useEffect, useRef } from 'react';
import type { MasterBrief } from './useMasterBrief';

const API_BASE   = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';
const ORACLE_URL = `${API_BASE}/oracle/brief`;

export interface OracleSection {
  summary:    string | null;
  confidence: number | null;
}

export interface OracleSections {
  kill_chain:   OracleSection | null;
  pre_signal:   OracleSection | null;
  derivatives:  OracleSection | null;
  hidden_hands: OracleSection | null;
  regime:       OracleSection | null;
}

export interface OracleState {
  verdict:           string | null;
  risk_level:        string;       // 'UNKNOWN' = oracle unavailable — panels still render
  trade_implication: string | null;
  sections:          OracleSections;
  generated_at:      string | null;
  cached_until:      string | null;
  loading:           boolean;
  error:             string | null;
}

const EMPTY_SECTIONS: OracleSections = {
  kill_chain:   null,
  pre_signal:   null,
  derivatives:  null,
  hidden_hands: null,
  regime:       null,
};

/**
 * DEGRADED shape — returned whenever oracle is unavailable.
 * All panels except OracleBriefStrip must render fully in this state.
 */
export const ORACLE_DEGRADED: OracleState = {
  verdict:           null,
  risk_level:        'UNKNOWN',
  trade_implication: null,
  sections:          EMPTY_SECTIONS,
  generated_at:      null,
  cached_until:      null,
  loading:           false,
  error:             null,
};

export function useOracleBrief(masterData: MasterBrief | null): { oracle: OracleState } {
  const [oracle, setOracle] = useState<OracleState>({ ...ORACLE_DEGRADED, loading: false });
  const lastScanRef  = useRef<number | null>(null);
  const cancelRef    = useRef(false);

  useEffect(() => {
    if (!masterData) return;

    // Cache on scan_time — skip POST if brief hasn't changed
    const scanTime = masterData.scan_time ?? null;
    if (scanTime !== null && scanTime === lastScanRef.current) return;

    cancelRef.current = false;
    lastScanRef.current = scanTime;
    setOracle(prev => ({ ...prev, loading: true, error: null }));

    const run = async () => {
      try {
        const res = await fetch(ORACLE_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ brief: masterData }),
        });

        if (cancelRef.current) return;

        if (!res.ok) {
          // 4xx/5xx → graceful degraded, panels still render without oracle
          setOracle({ ...ORACLE_DEGRADED, error: `oracle/brief: ${res.status}` });
          return;
        }

        const json = await res.json();
        if (cancelRef.current) return;

        const raw = json.sections ?? {};
        const normalize = (s: any): OracleSection => ({
          summary:    typeof s?.summary    === 'string' ? s.summary    : null,
          confidence: typeof s?.confidence === 'number' ? s.confidence : null,
        });

        setOracle({
          verdict:           json.verdict           ?? null,
          risk_level:        json.risk_level        ?? 'UNKNOWN',
          trade_implication: json.trade_implication ?? null,
          sections: {
            kill_chain:   normalize(raw.kill_chain),
            pre_signal:   normalize(raw.pre_signal),
            derivatives:  normalize(raw.derivatives),
            hidden_hands: normalize(raw.hidden_hands),
            regime:       normalize(raw.regime),
          },
          generated_at:  json.generated_at  ?? null,
          cached_until:  json.cached_until  ?? null,
          loading:       false,
          error:         null,
        });

      } catch (e: any) {
        if (cancelRef.current) return;
        // Network error → UNKNOWN, never crash panels
        setOracle({ ...ORACLE_DEGRADED, error: e?.message ?? 'oracle unavailable' });
      }
    };

    run();
    return () => { cancelRef.current = true; };
  }, [masterData?.scan_time]);   // Only re-fire when the brief has new data

  return { oracle };
}
