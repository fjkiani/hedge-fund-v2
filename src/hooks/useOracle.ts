/**
 * useOracle — v3 Oracle Unified Panel hook
 *
 * Two-step call:
 *   1. GET  /api/v1/brief/master        → full market brief dict
 *   2. POST /api/v1/oracle/brief        → NYX unified analysis (all sections)
 *
 * Panels read oracle.sections.<slice>.summary as their primary signal.
 * Returns UNKNOWN risk_level when either endpoint is unavailable (graceful degraded mode).
 *
 * PRODUCTION RULE: No panel calls Groq directly. This hook is the only oracle path.
 * Re-fetches every 10 minutes to align with the backend's cache TTL.
 */

import { useState, useEffect, useRef } from 'react';

const API_BASE      = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';
const BRIEF_URL     = `${API_BASE}/brief/master`;
const ORACLE_URL    = `${API_BASE}/oracle/brief`;
const REFETCH_MS    = 10 * 60 * 1000; // 10 min — matches backend cache TTL

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
  verdict:          string | null;
  risk_level:       string;       // 'UNKNOWN' = oracle unavailable
  trade_implication:string | null;
  sections:         OracleSections;
  generated_at:     string | null;
  cached_until:     string | null;
  loading:          boolean;
  error:            string | null;
}

const EMPTY_SECTIONS: OracleSections = {
  kill_chain:   null,
  pre_signal:   null,
  derivatives:  null,
  hidden_hands: null,
  regime:       null,
};

const DEGRADED: OracleState = {
  verdict:           null,
  risk_level:        'UNKNOWN',
  trade_implication: null,
  sections:          EMPTY_SECTIONS,
  generated_at:      null,
  cached_until:      null,
  loading:           false,
  error:             null,
};

export function useOracle(): OracleState {
  const [state, setState] = useState<OracleState>({ ...DEGRADED, loading: true });
  const cancelRef = useRef(false);

  const fetchOracle = async () => {
    cancelRef.current = false;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Step 1: GET /brief/master
      const briefRes = await fetch(BRIEF_URL);
      if (!briefRes.ok) throw new Error(`brief/master: ${briefRes.status}`);
      const brief = await briefRes.json();

      // Step 2: POST /oracle/brief with the brief payload
      const oracleRes = await fetch(ORACLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief }),
      });
      if (!oracleRes.ok) throw new Error(`oracle/brief: ${oracleRes.status}`);
      const json = await oracleRes.json();

      if (cancelRef.current) return;

      // Normalize sections — backend returns plain keys not typed objects
      const raw = json.sections ?? {};
      const normalize = (s: any): OracleSection => ({
        summary:    typeof s?.summary    === 'string' ? s.summary    : null,
        confidence: typeof s?.confidence === 'number' ? s.confidence : null,
      });

      setState({
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
      // Graceful degraded — panels fall back to KC snapshot path
      setState({ ...DEGRADED, error: e?.message ?? 'oracle unavailable' });
    }
  };

  useEffect(() => {
    fetchOracle();

    // Re-fetch every 10 min to align with backend cache TTL
    const interval = setInterval(fetchOracle, REFETCH_MS);

    return () => {
      cancelRef.current = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}
