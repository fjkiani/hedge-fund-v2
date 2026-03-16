/**
 * useIntradaySnapshot — Poll /api/v1/intraday/snapshot every 60 seconds
 *
 * Returns the current intraday snapshot: thesis validity, wall status, circuit breaker.
 * Stops polling automatically when market_open = false.
 */

import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';

export interface IntradaySnapshot {
  timestamp: string;
  market_open: boolean;
  spy_price: number;
  spy_call_wall: number;
  spy_put_wall: number;
  spy_poc: number;
  spy_vs_wall: string;
  wall_status: string;
  wall_break_time: string | null;
  volume_character: string;
  volume_ratio: number;
  thesis_valid: boolean;
  thesis_invalidation_reason: string | null;
  circuit_breaker_active: boolean;
  circuit_breaker_reason: string | null;
  consecutive_losses_today: number;
  signals_active: number;
  signals_invalidated: number;
  morning_verdict: string | null;
  last_check: string | null;
  error?: string;
}

export function useIntradaySnapshot() {
  const [snapshot, setSnapshot] = useState<IntradaySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSnapshot = async () => {
      try {
        const data = await api.get<IntradaySnapshot>('/intraday/snapshot', 8000);
        if (mounted) {
          setSnapshot(data);
          setError(null);
          setLoading(false);

          // Stop polling if market is closed
          if (!data.market_open && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch snapshot');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchSnapshot();

    // Poll every 60 seconds
    intervalRef.current = setInterval(fetchSnapshot, 60_000);

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { snapshot, loading, error };
}
