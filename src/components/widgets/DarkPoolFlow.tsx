/**
 * DarkPoolFlow — Modular, fully dynamic replacement.
 * Visual design: brushed-dark brutalist cards from the draft.
 * Data: 100% from darkpoolApi (no hardcoded values anywhere).
 *
 * Sub-components:
 *   DPStatCards      — total volume, DP%, buying pressure
 *   DPVolumeChart    — horizontal bar chart of levels by volume
 *   DPNearestLevels  — nearest support / resistance
 *   DPPrintsTable    — recent institutional prints
 *   DPTopPositions   — top dark pool position table
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { darkpoolApi, createWebSocket } from '../../lib/api';
import type { DPLevel, DPPrint, DPSummary, DPTopPosition } from './dark-pool-flow/types';
import { DPStatCards }      from './dark-pool-flow/DPStatCards';
import { DPVolumeChart }    from './dark-pool-flow/DPVolumeChart';
import { DPNearestLevels }  from './dark-pool-flow/DPNearestLevels';
import { DPPrintsTable }    from './dark-pool-flow/DPPrintsTable';
import { DPTopPositions }   from './dark-pool-flow/DPTopPositions';

interface DarkPoolFlowProps {
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full" />
        <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <span className="text-[10px] font-black font-mono text-zinc-700 uppercase tracking-[0.5em] animate-pulse">
        Decrypting flow…
      </span>
    </div>
  </div>
);

const ErrorBlock = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="flex items-center justify-center h-48">
    <div className="border border-rose-500/20 bg-rose-500/5 rounded-2xl px-8 py-6 text-center space-y-3">
      <p className="text-[10px] font-mono text-rose-500 uppercase tracking-widest">UPLINK_FAILURE</p>
      <p className="text-xs text-zinc-500">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-cyan-500 underline hover:text-cyan-300 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

export function DarkPoolFlow({
  symbol = 'SPY',
  autoRefresh = true,
  refreshInterval = 30_000,
}: DarkPoolFlowProps) {
  const [levels, setLevels]           = useState<DPLevel[]>([]);
  const [summary, setSummary]         = useState<DPSummary | null>(null);
  const [prints, setPrints]           = useState<DPPrint[]>([]);
  const [narrative, setNarrative]     = useState<string | null>(null);
  const [topPositions, setTopPositions] = useState<DPTopPosition[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [levelsData, summaryData, printsData, narrativeData, topPosData] = await Promise.all([
        darkpoolApi.getLevels(symbol) as Promise<any>,
        darkpoolApi.getSummary(symbol) as Promise<any>,
        darkpoolApi.getPrints(symbol, 10) as Promise<any>,
        darkpoolApi.getNarrative().catch(() => ({ narrative: null })),
        darkpoolApi.getTopPositions(10).catch(() => ({ positions: [] })),
      ]);
      setLevels(levelsData.levels ?? []);
      setCurrentPrice(levelsData.current_price ?? null);
      setSummary(summaryData.summary ?? null);
      setPrints(printsData.prints ?? []);
      setNarrative((narrativeData as any)?.narrative ?? null);
      setTopPositions((topPosData as any)?.positions ?? []);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dark pool data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    if (!autoRefresh) return;
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [symbol, autoRefresh, refreshInterval, fetchData]);

  // WebSocket for push updates
  useEffect(() => {
    if (!autoRefresh) return;
    wsRef.current = createWebSocket(`darkpool/${symbol}`);
    wsRef.current.onopen = () => setWsConnected(true);
    wsRef.current.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'DP_UPDATE') fetchData();
      } catch {}
    };
    wsRef.current.onerror = () => setWsConnected(false);
    wsRef.current.onclose = () => setWsConnected(false);
    return () => wsRef.current?.close();
  }, [symbol, autoRefresh, fetchData]);

  return (
    <div className="bg-[#07070a] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white tracking-tight">Dark Pool Flow</h2>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest flex items-center gap-3">
            <span>{symbol}</span>
            <span className="w-px h-3 bg-zinc-800" />
            <span>Off-exchange volume &amp; institutional prints</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {wsConnected && (
            <span className="flex items-center gap-1.5 text-[9px] font-black font-mono text-emerald-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          )}
          {lastRefresh && (
            <span className="hidden lg:block text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
              {lastRefresh}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-zinc-950 border border-white/5 rounded-xl hover:border-cyan-500/30 hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Body ───────────────────────────────────────────────── */}
      <div className="p-8 space-y-6">
        <AnimatePresence mode="wait">
          {loading && !summary ? (
            <Loader key="loader" />
          ) : error ? (
            <ErrorBlock key="error" message={error} onRetry={fetchData} />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Stat cards (volume, DP%, buying pressure) */}
              {summary && (
                <DPStatCards summary={summary} currentPrice={currentPrice} />
              )}

              {/* Levels volume chart — merges /levels + summary support/resistance */}
              {levels.length > 0 && (
                <DPVolumeChart levels={levels} summary={summary} />
              )}

              {/* Nearest Support / Resistance */}
              {summary && (
                <DPNearestLevels summary={summary} />
              )}

              {/* Recent Prints */}
              <DPPrintsTable prints={prints} />

              {/* DP Narrative (LLM) */}
              {narrative && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-[#0c0c0e] border border-cyan-500/15 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black font-mono text-cyan-500 uppercase tracking-[0.3em]">
                      🏴 Dark Pool Intelligence
                    </span>
                  </div>
                  <p className="text-[12px] text-zinc-400 leading-relaxed italic">{narrative}</p>
                </motion.div>
              )}

              {/* Top Positions table */}
              <DPTopPositions positions={topPositions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] font-mono text-zinc-800 uppercase tracking-widest">
          SRC: Stockgrid / FINRA off-exchange • DP levels are T-1
        </span>
        <button
          onClick={fetchData}
          className="text-[10px] font-black text-cyan-700 hover:text-cyan-400 transition-colors uppercase tracking-widest"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
