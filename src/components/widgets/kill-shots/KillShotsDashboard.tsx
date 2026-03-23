import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  RefreshCw,
} from 'lucide-react';

import type { KillShotsResponse, KillShotsLayers } from './types';
import { signalsApi } from '../../../lib/api';
import type { SignalData } from '../../ui/SignalSlug';

import { PillarCardGex } from './PillarCardGex';
import { PillarCardCot } from './PillarCardCot';
import { PillarCardBrain } from './PillarCardBrain';
import { PillarCardFedDp } from './PillarCardFedDp';

const MONITOR_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

const VERDICT_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  BOOST:      { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: '#10b981' },
  NEUTRAL:    { color: '#22d3ee', bg: 'rgba(34,211,238,0.05)', border: '#22d3ee' },
  SOFT_VETO:  { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: '#f97316' },
  HARD_VETO:  { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: '#f43f5e' },
};

const LoaderSpinner = () => (
  <motion.div
    key="loader"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-center h-40"
  >
    <div className="flex flex-col items-center gap-8">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-2 border-cyan-500/10 rounded-full" />
        <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-4 border-2 border-white/5 border-b-cyan-500/40 rounded-full" style={{ animation: 'spin 3s linear infinite reverse' }} />
      </div>
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-black font-mono text-cyan-800 uppercase tracking-[0.6em] animate-pulse">
          Decrypting Streams…
        </span>
        <div className="w-32 h-1 bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5 }}
            className="h-full bg-cyan-500"
          />
        </div>
      </div>
    </div>
  </motion.div>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="border border-red-500/30 bg-red-500/10 rounded-xl px-8 py-6 text-center">
      <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest mb-2">UPLINK_FAILURE</p>
      <p className="text-xs text-zinc-500">{message}</p>
    </div>
  </div>
);

export default function KillShotsDashboard() {
  const [data, setData] = useState<KillShotsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch: kill chain + signals API (piggybacked, 0ms on cache hit)
      const [kcRes, sigRes] = await Promise.allSettled([
        fetch(`${MONITOR_URL}/kill-shots-live`).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<KillShotsResponse>;
        }),
        signalsApi.getAll() as Promise<{ signals: SignalData[] }>,
      ]);

      if (kcRes.status === 'rejected') throw new Error(kcRes.reason?.message || 'Kill chain fetch failed');
      const json = kcRes.value;
      if (json.error) throw new Error(json.error);

      // Merge DarkPoolTrend velocity into layers
      const enrichedLayers: KillShotsLayers = { ...json.layers };
      if (sigRes.status === 'fulfilled') {
        const dpSig = sigRes.value.signals?.find(s => s.source === 'DarkPoolTrend');
        if (dpSig) {
          enrichedLayers.dp_trend_velocity = dpSig.dp_trend_velocity ?? null;
          // Derive direction from action
          enrichedLayers.dp_trend_direction = dpSig.action === 'LONG' ? 'ACCUMULATION'
            : dpSig.action === 'SHORT' ? 'DISTRIBUTION'
            : null;
        }
      }
      json.layers = enrichedLayers;

      setData(json);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  React.useEffect(() => { fetchData(); }, [fetchData]);

  const verdict = data?.verdict ?? 'NEUTRAL';
  const verdictStyle = VERDICT_STYLES[verdict] ?? VERDICT_STYLES.NEUTRAL;
  const layers = data?.layers ?? {};

  return (
    <div className="bg-[#050507] text-white pt-5 px-5 pb-3 font-sans selection:bg-cyan-500/30 overflow-x-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(circle_at_50%_50%,#22d3ee_0%,transparent_50%)]" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-8 relative z-20">
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="w-16 h-16 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.1)]">
              <Activity className="w-8 h-8 text-cyan-400" />
            </div>
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full blur-[2px]"
            />
          </div>
          <div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.8em] text-zinc-600 mb-2 font-mono">Kill_Shots // System_Alpha</h1>
            <div className="flex items-center gap-6">
              <span className="text-3xl font-black text-white tracking-tighter leading-none">SIGNAL_TERMINAL</span>
              <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 px-3 py-1 rounded-full text-[10px] font-black text-emerald-500 tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                D-STREAM_NOMINAL
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {lastRefresh && (
            <span className="hidden lg:block text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
              Last sync: {lastRefresh}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 transition-all hover:border-cyan-500/30 group active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Verdict Banner */}
      {data && (
        <div className="max-w-7xl mx-auto mb-8 relative z-20">
          <div
            className="flex items-center justify-between px-6 py-4 rounded-xl border"
            style={{ backgroundColor: verdictStyle.bg, borderColor: verdictStyle.border }}
          >
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: verdictStyle.color }} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: verdictStyle.color }}>
                VERDICT: {verdict}
              </span>
              <span className="text-xs text-zinc-500">—</span>
              <span className="text-xs text-zinc-400">{data.action}</span>
            </div>
            {data.action_plan?.position && data.action_plan.position !== 'NEUTRAL' && (
              <div className="hidden md:flex items-center gap-6 text-[10px] font-mono text-zinc-600">
                <span>POS: <span className="text-zinc-300">{data.action_plan.position}</span></span>
                <span>ENTRY: <span className="text-zinc-300">{data.action_plan.entry_trigger}</span></span>
                <span>INVAL: <span className="text-zinc-300">{data.action_plan.invalidation}</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto relative z-20">
        <AnimatePresence mode="wait">
          {loading && !data ? (
            <LoaderSpinner key="loader" />
          ) : error ? (
            <ErrorBanner key="error" message={error} />
          ) : (
            <motion.div
              key="pillars"
              className="grid grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PillarCardBrain  data={layers} />
              <PillarCardCot    data={layers} />
              <PillarCardGex    data={layers} />
              <PillarCardFedDp  data={layers} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-6 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-700">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] block">Data Sources</span>
            <p className="text-[11px] leading-relaxed font-medium">
              GEX: CBOE options chain (delayed). COT: CFTC weekly report via Barchart. Dark Pool: Stockgrid daily feed. BRAIN: Cohere command-a-reasoning LLM multi-source scan.
            </p>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-[9px] font-mono leading-relaxed uppercase tracking-tighter">
              &copy; 2026 KILL_SHOTS_INTERNAL // SLUG-TRACED // CLICK ⓘ ON ANY DATA POINT TO AUDIT IT.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}