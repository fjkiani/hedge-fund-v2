/**
 * TrapCompressionSignal — Modular orchestrator
 * Replaces the monolithic `TrapCompressionSignal.tsx`.
 *
 * Data: 100% from chartApi.getMatrix(symbol) → /charts/{symbol}/matrix
 * Sub-components:
 *   TrapAlertStatus   — dynamic alert banner (GREEN/YELLOW/RED)
 *   TrapWallCards     — live GEX call/put walls, gamma flip, max pain, COT
 *   TrapScenarios     — algorithmically computed SHORT/LONG scenarios from walls
 *   TrapZoneLegend    — classified trap zones with conviction scores
 *   DPVolumeChart     — dark pool levels horizontal bar chart (reused from dp module)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap, Database } from 'lucide-react';

import { chartApi } from '../../lib/api';
import type { TrapMatrixState } from './trap-compression/types';
import { ALERT_COLORS } from './trap-compression/types';

import { TrapAlertStatus }  from './trap-compression/TrapAlertStatus';
import { TrapWallCards }    from './trap-compression/TrapWallCards';
import { TrapScenarios }    from './trap-compression/TrapScenarios';
import { TrapZoneLegend }   from '../charts/TrapZoneLegend';

interface Props {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 border-2 border-orange-500/10 rounded-full" />
        <div className="absolute inset-0 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <span className="text-[10px] font-black font-mono text-zinc-700 uppercase tracking-[0.5em] animate-pulse">
        Loading trap matrix…
      </span>
    </div>
  </div>
);

// ─── Error Block ──────────────────────────────────────────────────────────────

const ErrorBlock = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex items-center justify-center h-48">
    <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl px-8 py-6 text-center space-y-3">
      <p className="text-[10px] font-mono text-rose-500 uppercase tracking-widest">MATRIX_UPLINK_FAILURE</p>
      <p className="text-xs text-zinc-500">{message}</p>
      <button onClick={onRetry} className="text-xs text-orange-500 underline hover:text-orange-300 transition-colors">
        Retry
      </button>
    </div>
  </div>
);

// ─── Staleness Footer ─────────────────────────────────────────────────────────

const StalenessFooter = ({ staleness }: { staleness: TrapMatrixState['staleness'] }) => {
  const entries = Object.entries(staleness);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 px-8 py-4 border-t border-white/5 text-[9px] font-mono uppercase tracking-widest">
      {entries.map(([src, info]) => (
        <div key={src} className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${info.stale ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span className={info.stale ? 'text-rose-700' : 'text-zinc-700'}>
            {src}: {info.age}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function TrapCompressionSignal({
  symbol = 'SPY',
  autoRefresh = true,
  refreshInterval = 60_000,
}: Props) {
  const [state, setState] = useState<TrapMatrixState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await chartApi.getMatrix(symbol) as any;
      // Handle both the raw MarketState dict and possible wrapper
      const data: TrapMatrixState = raw?.data ?? raw;
      setState(data);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trap matrix');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [symbol, autoRefresh, refreshInterval, fetchData]);

  const alertLevel = state?.context?.alert_level ?? 'GREEN';
  const alertColors = ALERT_COLORS[alertLevel] ?? ALERT_COLORS.GREEN;
  const topTrapConviction = state?.traps?.[0]?.conviction ?? 0;

  return (
    <div className="bg-[#07070a] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="p-2 bg-orange-600/10 rounded-lg">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white tracking-tight">Trap Compression Zone</h2>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-3">
              <span>{symbol}</span>
              <span className="w-px h-3 bg-zinc-800" />
              <span>GEX walls · DP levels · trap classifier</span>
            </p>
          </div>

          {/* Alert level badge — from live data */}
          {state && (
            <div
              className="px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase border"
              style={{ backgroundColor: alertColors.bg, borderColor: alertColors.border, color: alertColors.text }}
            >
              {alertLevel}
            </div>
          )}

          {/* Conviction badge from top trap */}
          {topTrapConviction > 0 && (
            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/40 rounded text-[10px] font-black text-yellow-500 tracking-widest uppercase">
              {topTrapConviction}/5 Conviction
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="hidden lg:block text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
              {lastRefresh}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-zinc-950 border border-white/5 rounded-xl hover:border-orange-500/30 hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Body ────────────────────────────────────────────────────────── */}
      <div className="p-8 space-y-8">
        <AnimatePresence mode="wait">
          {loading && !state ? (
            <Loader key="loader" />
          ) : error ? (
            <ErrorBlock key="error" message={error} onRetry={fetchData} />
          ) : state ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* 1. Alert status banner */}
              <TrapAlertStatus state={state} />

              {/* 2. Option walls + gamma levels */}
              <div>
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">
                  Gamma Walls & Key Levels
                </h3>
                <TrapWallCards state={state} />
              </div>

              {/* 3. Classified trap zones (from trap classifier) */}
              {state.traps.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">
                    Active Trap Zones ({state.traps.length})
                  </h3>
                  <TrapZoneLegend traps={state.traps} />
                </div>
              )}

              {/* 4. Computed trade scenarios */}
              <div>
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">
                  Live Scenarios
                </h3>
                <TrapScenarios state={state} />
              </div>

              {/* 5. Data source attribution */}
              <div className="flex items-center gap-2 pt-2">
                <Database className="w-3 h-3 text-zinc-800" />
                <span className="text-[9px] font-mono text-zinc-800 uppercase tracking-widest">
                  SRC: Stockgrid (DP) · CBOE/SpotGamma (GEX) · CFTC (COT) · v{state.version} · {state.rebuild_reason}
                </span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ─── Staleness Footer ─────────────────────────────────────────────── */}
      {state && <StalenessFooter staleness={state.staleness} />}
    </div>
  );
}

// Default export for backward compat with any existing routing
export default TrapCompressionSignal;
