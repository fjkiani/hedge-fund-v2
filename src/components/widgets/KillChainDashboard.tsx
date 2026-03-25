/**
 * KillChainDashboard — Orchestrator (slim)
 *
 * Data:  killchainApi.monitor() → /kill-chain  (60s polling)
 * UI:    Composed entirely from /src/components/killchain/
 */

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bot } from 'lucide-react';
import { killchainApi } from '../../lib/api';
import { useOracle } from '../../hooks/useOracle';
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

const KC_API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';
const KC_ANALYZE_URL = `${KC_API_BASE}/oracle/analyze`;
const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL     = 'llama-3.3-70b-versatile';

const DEV_SYSTEM_PROMPT =
  'You are the Zeta Kill Chain Oracle — a lead quant analyst for a high-frequency institutional trading desk. ' +
  'You receive LIVE Kill Chain confluence data in structured format. ' +
  'Cross-reference all layers and explain WHY the current state creates or denies a high-conviction trade setup. ' +
  'GUARDRAIL: Do NOT override discrete signals — if a layer shows triggered=false, do not say it is firing. ' +
  'Only summarize confluence, highlight contradictions, and map to trade implications. ' +
  'Reference actual numbers. Use ≤5 sharp bullet points.';

function buildDevQuery(ctx: any): string {
  const layerCount = ctx.layers?.length || 3;
  const layerLines = ctx.layers?.map((l: any, i: number) => {
    const status = l.triggered ? '✅ PASS' : '❌ FAIL';
    const val = typeof l.value === 'number' ? l.value.toFixed(3) : l.value;
    return `  Layer ${i + 1} — ${l.name}: ${status}  |  ${val} ${l.unit}  |  Signal: ${l.signal}`;
  }) || [];
  return [
    '══ KILL CHAIN STATE SNAPSHOT ══',
    `Score: ${ctx.score}  |  Verdict: ${ctx.verdict}  |  Direction: ${ctx.direction}`,
    `Confluence: ${ctx.confluence}  |  Armed: ${ctx.armed ? 'YES 🔴' : 'NO ⚫'}`,
    `Triggered: ${ctx.triggered_count}/${layerCount} layers`,
    ctx.spy_spot ? `SPY Spot: $${ctx.spy_spot.toFixed(2)}` : '',
    '',
    '══ CONFLUENCE LAYERS ══',
    ...layerLines,
    '',
    `Analyze in context of ${layerCount} layers. Summarize confluence. Highlight contradictions. Map to trade action.`,
  ].join('\n');
}

export function KillChainDashboard() {
  const [data, setData]               = useState<MonitorResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [brief, setBrief]             = useState<AiBriefingItem | null>(null);

  const oracle = useOracle();

  const [staticAnalysis, setStaticAnalysis] = useState<string | null>(null);
  const [staticLoading, setStaticLoading]   = useState(true);

  // Fallback oracle fetch logic for side-panel
  useEffect(() => {
    if (!data) return;
    if (oracle.loading) return;

    setStaticLoading(true);

    const run = async () => {
      // PATH 1: Unified oracle sections
      if (oracle.risk_level !== 'UNKNOWN' && oracle.sections.kill_chain?.summary) {
        setStaticAnalysis(oracle.sections.kill_chain.summary);
        setStaticLoading(false);
        return;
      }

      const _kc = data.kill_chain ?? EMPTY_KC;
      const _spot = data.current_state?.spy_price ?? 0;
      const snapshotContext = {
        score:           _kc.score,
        verdict:         _kc.verdict,
        direction:       _kc.direction,
        confluence:      _kc.confluence,
        triggered_count: _kc.triggered_count,
        armed:           _kc.armed,
        bullish_points:  _kc.bullish_points,
        bearish_points:  _kc.bearish_points,
        spy_spot:        _spot,
        total_checks:    data.total_checks,
        activations:     data.activations,
        layers:          [
          { name: _kc.layer_1.name, triggered: _kc.layer_1.triggered, value: _kc.layer_1.value, unit: _kc.layer_1.unit, signal: _kc.layer_1.signal },
          { name: _kc.layer_2.name, triggered: _kc.layer_2.triggered, value: _kc.layer_2.value, unit: _kc.layer_2.unit, signal: _kc.layer_2.signal },
          { name: _kc.layer_3.name, triggered: _kc.layer_3.triggered, value: _kc.layer_3.value, unit: _kc.layer_3.unit, signal: _kc.layer_3.signal },
        ],
      };

      // PATH 2: Backend analyze endpoint
      try {
        const body = {
          title: "Kill Chain Macro Setup",
          action: "Analyze Confluence",
          kill_chain_snapshot: snapshotContext
        };
        const res = await fetch(KC_ANALYZE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.analysis) {
            setStaticAnalysis(json.analysis);
            setStaticLoading(false);
            return;
          }
        }
        throw new Error(`oracle/analyze returned ${res.status}`);
      } catch {
        // PATH 3: Dev Groq fallback
        const devKey = (import.meta as any).env?.VITE_GROQ_API_KEY ?? '';
        if (!devKey) {
          setStaticAnalysis('ORACLE_UPLINK_FAILURE: Backend oracle unreachable. No dev key configured.');
          setStaticLoading(false);
          return;
        }
        try {
          const res = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${devKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: 'system', content: DEV_SYSTEM_PROMPT },
                { role: 'user',   content: buildDevQuery(snapshotContext) },
              ],
              temperature: 0.35,
              max_tokens: 700,
            }),
          });
          const json = await res.json();
          const text = json?.choices?.[0]?.message?.content ?? '';
          setStaticAnalysis(text || `ORACLE_UPLINK_FAILURE: ${json?.error?.message ?? 'No content.'}`);
        } catch (e: any) {
          setStaticAnalysis(`ORACLE_UPLINK_FAILURE: ${e?.message ?? 'All oracle paths failed.'}`);
        }
        setStaticLoading(false);
      }
    };
    run();
  }, [data, oracle.loading, oracle.risk_level, oracle.sections.kill_chain?.summary]);

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

      {/* Grid Layout for Side-by-Side Oracle */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: 3 Confluence Cards + Pnl + Log */}
        <div className="col-span-8 space-y-8">
          {/* Confluence layer cards */}
          <div className="grid grid-cols-3 gap-6">
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
        </div>

        {/* RIGHT COLUMN: Permanent Oracle Panel */}
        <div className="col-span-4 flex flex-col h-full bg-[#111113] rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black text-white uppercase tracking-widest">
                NYX ORACLE · KILL CHAIN
              </span>
            </div>
            {staticLoading && (
              <div className="w-3 h-3 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            )}
          </div>
          <div className="p-6 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {staticLoading && !staticAnalysis ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-500">
                <span className="text-[10px] uppercase tracking-widest font-black">Synthesizing Macro Setup...</span>
              </div>
            ) : staticAnalysis ? (
              <div className="text-[13px] text-zinc-300 leading-[1.7] font-medium whitespace-pre-wrap font-sans">
                {staticAnalysis}
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center text-center gap-2 text-zinc-500">
                <span className="text-[10px] uppercase font-black tracking-widest">Oracle Offline</span>
                <span className="text-xs">No analysis available for current sequence.</span>
              </div>
            )}
          </div>
        </div>

      </div>

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
