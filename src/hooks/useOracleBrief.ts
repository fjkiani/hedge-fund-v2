import { useEffect, useState, useRef } from 'react';
import type { MasterBrief } from './useMasterBrief';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OracleSection {
  summary: string;
  confidence: number;
}

export interface OracleBrief {
  verdict: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  sections: {
    pre_signal?:   OracleSection;
    hidden_hands?: OracleSection;
    derivatives?:  OracleSection;
    kill_chain?:   OracleSection;
    regime?:       OracleSection;
  };
  trade_implication: string | null;
  generated_at: string;
  cached_until?: string;
}

interface UseOracleBriefResult {
  oracle: OracleBrief | null;
  oracleLoading: boolean;
  oracleError: string | null;
}

// ── Client-side cache (keyed on scan_time, 10 min max) ───────────────────────

const _clientCache: { scanTime?: number; result?: OracleBrief; fetchedAt?: number } = {};
const CLIENT_TTL_MS = 10 * 60 * 1000;

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useOracleBrief — fires once when masterData resolves.
 * POSTs the full /brief/master payload to /api/v1/oracle/brief.
 * Returns the unified oracle verdict + per-section summaries.
 *
 * Production rule: this is the ONLY oracle call path.
 * KillChainPanel, PreSignalSection, TacticalSection all read slices
 * from this result via OracleContext — they never call Groq directly.
 */
export function useOracleBrief(masterData: MasterBrief | null): UseOracleBriefResult {
  const [oracle, setOracle]           = useState<OracleBrief | null>(null);
  const [oracleLoading, setLoading]   = useState(false);
  const [oracleError, setError]       = useState<string | null>(null);
  const abortRef                      = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!masterData) return;

    const scanTime = masterData.scan_time;

    // Return cached result if same scan_time and within TTL
    if (
      _clientCache.result &&
      _clientCache.scanTime === scanTime &&
      _clientCache.fetchedAt &&
      Date.now() - _clientCache.fetchedAt < CLIENT_TTL_MS
    ) {
      setOracle(_clientCache.result);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchOracle = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_URL}/oracle/brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: masterData }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`oracle/brief returned ${res.status}`);

        const data: OracleBrief = await res.json();

        // Treat UNKNOWN as a soft failure — don't store, show nothing
        if (data.risk_level === 'UNKNOWN') {
          setOracle(null);
          return;
        }

        _clientCache.result    = data;
        _clientCache.scanTime  = scanTime;
        _clientCache.fetchedAt = Date.now();
        setOracle(data);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setError(err?.message ?? 'oracle/brief fetch failed');
        setOracle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOracle();

    return () => { abortRef.current?.abort(); };
  }, [masterData?.scan_time]); // only refetch when scan_time changes

  return { oracle, oracleLoading, oracleError };
}
