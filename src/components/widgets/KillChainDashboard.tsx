/**
 * KillChainDashboard — Orchestrator (slim)
 *
 * Data:  killchainApi.monitor() → /kill-chain  (60s polling)
 * UI:    Composed entirely from /src/components/killchain/
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { killchainApi } from '../../lib/api';
import {
  KillChainHeader,
  ConfluenceCard,
  PnlWidget,
  SignalLog,
  CpiBanner,
  AiBriefingPanel,
} from '../killchain';
import type { MonitorResponse, KillChainData, AiBriefingItem } from '../killchain';

// Fallback kill chain shape when the API hasn't responded yet
const EMPTY_KC: KillChainData = {
  score: 0,
  verdict: 'WAITING',
  direction: 'MIXED',
  confluence: 'WAITING',
  triggered_count: 0,
  armed: false,
  bullish_points: 0,
  bearish_points: 0,
  layer_1: { name: 'COT Divergence', triggered: false, value: 0, unit: 'Specs Net', signal: 'NEUTRAL' },
  layer_2: { name: 'GEX Regime', triggered: false, value: 0, unit: 'GEX $M', signal: 'NEUTRAL' },
  layer_3: { name: 'DVR', triggered: false, value: 0, unit: 'Short Vol %', signal: 'WATCHING' },
  position: { entry_price: 0, current_pnl: 0, activated_at: null },
};

const LAYERS = [
  { title: 'Layer 1: COT Divergence', key: 'layer_1' as const },
  { title: 'Layer 2: GEX Regime',     key: 'layer_2' as const },
  { title: 'Layer 3: Sell Volume (DVR)', key: 'layer_3' as const },
];

export function KillChainDashboard() {
  const [data, setData]               = useState<MonitorResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [brief, setBrief]             = useState<AiBriefingItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await (killchainApi.monitor() as Promise<MonitorResponse>);
      setData(res);
      setError(null);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Kill chain fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  // ── States ──────────────────────────────────────────────────────────
  if (loading && !data) return <LoadingScreen />;
  if (error && !data)   return <ErrorScreen message={error} onRetry={fetchData} />;
  if (!data)            return null;

  const kc = data.kill_chain ?? EMPTY_KC;
  const spotPrice = data.current_state?.spy_price ?? 0;

  /** Full snapshot passed to every Oracle call so it can reason with real state */
  const buildContext = (layerBrief: AiBriefingItem): AiBriefingItem => ({
    ...layerBrief,
    killChainContext: {
      score:           kc.score,
      verdict:         kc.verdict,
      direction:       kc.direction,
      confluence:      kc.confluence,
      triggered_count: kc.triggered_count,
      armed:           kc.armed,
      bullish_points:  kc.bullish_points,
      bearish_points:  kc.bearish_points,
      spy_spot:        spotPrice,
      total_checks:    data.total_checks,
      activations:     data.activations,
      layers: [
        { name: kc.layer_1.name, triggered: kc.layer_1.triggered, value: kc.layer_1.value, unit: kc.layer_1.unit, signal: kc.layer_1.signal },
        { name: kc.layer_2.name, triggered: kc.layer_2.triggered, value: kc.layer_2.value, unit: kc.layer_2.unit, signal: kc.layer_2.signal },
        { name: kc.layer_3.name, triggered: kc.layer_3.triggered, value: kc.layer_3.value, unit: kc.layer_3.unit, signal: kc.layer_3.signal },
      ],
    },
  });

  return (
    <div className="space-y-8">
      <KillChainHeader
        kc={kc}
        totalChecks={data.total_checks}
        activations={data.activations}
        lastRefresh={lastRefresh}
        onRefresh={fetchData}
      />

      {/* Confluence layer cards */}
      <div className="flex gap-8">
        {LAYERS.map(({ title, key }) => (
          <ConfluenceCard
            key={key}
            title={title}
            layer={kc[key]}
            onClick={(item) => setBrief(buildContext(item))}
          />
        ))}
      </div>

      <PnlWidget position={kc.position} spotPrice={spotPrice} onDrillDown={(item) => setBrief(buildContext(item))} />

      <SignalLog history={data.history ?? []} totalChecks={data.total_checks} onRowClick={(item) => setBrief(buildContext(item))} />

      <CpiBanner onDrillDown={(item) => setBrief(buildContext(item))} />

      {/* AI Oracle slide-out */}
      <AnimatePresence>
        {brief && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBrief(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250]"
            />
            <AiBriefingPanel item={brief} onClose={() => setBrief(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Local micro-components (loading/error only) ──────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-[300px] bg-[#050506] flex items-center justify-center rounded-2xl border border-white/5">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
          <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.5em]">
          Synchronizing Confluence Grid
        </span>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-500" />
        <span className="text-xs font-bold text-rose-400 font-mono uppercase">Signal Lost: {message}</span>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[10px] font-black text-rose-400 uppercase tracking-widest hover:bg-rose-500/20 transition-all"
      >
        Retry
      </button>
    </div>
  );
}
