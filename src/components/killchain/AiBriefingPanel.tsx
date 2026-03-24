import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Crosshair, ShieldAlert, MessageSquareCode, Zap } from 'lucide-react';
import type { AiBriefingItem } from './types';
import { useOracle } from '../../hooks/useOracle';

interface Props {
  item: AiBriefingItem;
  onClose: () => void;
}

// ── Route constants — production: backend only, dev: Groq fallback allowed ─────
const KC_ANALYZE_URL = `${(import.meta as any).env?.VITE_API_URL ?? '/api/v1'}/oracle/analyze`;
const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL     = 'llama-3.3-70b-versatile';

const DEV_SYSTEM_PROMPT =
  'You are the Zeta Kill Chain Oracle — a lead quant analyst for a high-frequency institutional trading desk. ' +
  'You receive LIVE Kill Chain confluence data in structured format. ' +
  'Cross-reference all layers and explain WHY the current state creates or denies a high-conviction trade setup. ' +
  'GUARDRAIL: Do NOT override discrete signals — if a layer shows triggered=false, do not say it is firing. ' +
  'Only summarize confluence, highlight contradictions, and map to trade implications. ' +
  'Reference actual numbers. Use ≤5 sharp bullet points.';

function buildDevQuery(item: AiBriefingItem): string {
  const ctx = item.killChainContext;
  if (!ctx) {
    return [
      'Analyze Execution Signal:',
      `Title: ${item.title ?? item.action ?? 'N/A'}`,
      `Value: ${item.value ?? item.price ?? 'N/A'}`,
      `Meaning: ${item.meaning ?? 'N/A'}`,
      'Explain significance, logic state, and tactical directives.',
    ].join('\n');
  }
  const layerCount = ctx.layers.length;
  const layerLines = ctx.layers.map((l, i) => {
    const status = l.triggered ? '✅ PASS' : '❌ FAIL';
    const val = typeof l.value === 'number' ? l.value.toFixed(3) : l.value;
    return `  Layer ${i + 1} — ${l.name}: ${status}  |  ${val} ${l.unit}  |  Signal: ${l.signal}`;
  });
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
    '══ CLICKED SIGNAL ══',
    `Title: ${item.title ?? item.action ?? 'N/A'}`,
    `Value: ${item.value ?? item.price ?? 'N/A'}`,
    `Status: ${item.status ?? 'N/A'}`,
    '',
    `Analyze in context of ${layerCount} layers. Summarize confluence. Highlight contradictions. Map to trade action.`,
  ].join('\n');
}

type OracleMode = 'unified' | 'kc-snapshot' | 'dev-fallback' | 'error';

export const AiBriefingPanel: React.FC<Props> = ({ item, onClose }) => {
  const [analysis, setAnalysis]     = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [oracleMode, setOracleMode] = useState<OracleMode>('unified');

  // v3 spec: unified oracle is the primary read source
  const oracle = useOracle();

  useEffect(() => {
    if (oracle.loading) return; // wait for unified oracle probe to settle

    setLoading(true);
    setAnalysis(null);

    const run = async () => {
      // ── PATH 1: Unified oracle sections (v3 primary) ───────────────────────
      // When /api/v1/oracle/brief is live and healthy, use KC slice directly.
      if (oracle.risk_level !== 'UNKNOWN' && oracle.sections.kill_chain?.summary) {
        setAnalysis(oracle.sections.kill_chain.summary);
        setOracleMode('unified');
        setLoading(false);
        return;
      }

      // ── PATH 2: KC snapshot → backend oracle/analyze ───────────────────────
      try {
        const body: Record<string, any> = {
          title:   item.title,
          action:  item.action,
          value:   String(item.value ?? item.price ?? ''),
          unit:    item.unit,
          result:  item.result,
          goal:    item.goal,
          meaning: item.meaning,
          status:  item.status,
          slug:    item.slug,
        };
        if (item.killChainContext) body.kill_chain_snapshot = item.killChainContext;

        const res = await fetch(KC_ANALYZE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.analysis && !json.error) {
            setAnalysis(json.analysis);
            setOracleMode('kc-snapshot');
            setLoading(false);
            return;
          }
        }
        throw new Error(`oracle/analyze returned ${res.status}`);

      } catch {
        // ── PATH 3: Dev Groq fallback (NEVER in production) ───────────────────
        const devKey = (import.meta as any).env?.VITE_GROQ_API_KEY ?? '';
        if (!devKey) {
          setAnalysis('ORACLE_UPLINK_FAILURE: Backend oracle unreachable. No dev key configured.');
          setOracleMode('error');
          setLoading(false);
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
                { role: 'user',   content: buildDevQuery(item) },
              ],
              temperature: 0.35,
              max_tokens: 700,
            }),
          });
          const json = await res.json();
          const text = json?.choices?.[0]?.message?.content ?? '';
          setAnalysis(text || `ORACLE_UPLINK_FAILURE: ${json?.error?.message ?? 'No content.'}`);
          setOracleMode(text ? 'dev-fallback' : 'error');
        } catch (e: any) {
          setAnalysis(`ORACLE_UPLINK_FAILURE: ${e?.message ?? 'All oracle paths failed.'}`);
          setOracleMode('error');
        }
        setLoading(false);
      }
    };

    run();
  }, [item, oracle.loading, oracle.risk_level, oracle.sections.kill_chain?.summary]);

  const modeBadge: Record<OracleMode, { label: string; color: string }> = {
    unified:       { label: 'UNIFIED · NYX', color: 'text-cyan-400' },
    'kc-snapshot': { label: 'KC · GROQ',     color: 'text-orange-400' },
    'dev-fallback':{ label: 'DEV · GROQ',    color: 'text-yellow-500' },
    error:         { label: 'OFFLINE',        color: 'text-rose-500' },
  };
  const badge = modeBadge[oracleMode];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 h-full w-[480px] bg-[#0c0c0e] border-l border-white/10 z-[300] shadow-[-20px_0_60px_rgba(0,0,0,0.6)] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Crosshair className="w-5 h-5 text-emerald-500" />
          <div>
            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Execution Oracle
            </span>
            <span className="block text-sm font-black text-white uppercase tracking-tighter">
              ZETA_STRATEGY_NODE · <span className={`text-xs ${badge.color}`}>{badge.label}</span>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8" style={{ scrollbarWidth: 'none' }}>
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-emerald-500/10 rounded-full" />
              <div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <span className="block text-[10px] font-black font-mono text-emerald-400 uppercase tracking-[0.6em] animate-pulse">
                Running Confluence Scan
              </span>
              <span className="block text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                Groq · Llama 3.3 70B
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Signal card */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Strategy Logic</span>
              </div>
              <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                      Signal Node
                    </span>
                    <span className="block text-sm font-black text-white">{item.title ?? item.action}</span>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                      item.status === 'pass'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {item.status ?? 'Active'}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black text-white font-mono tracking-tighter">
                    {item.value ?? item.price}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    SLUG: {item.slug ?? 'n/a'}
                  </span>
                </div>
              </div>
            </section>

            {/* Oracle text */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <MessageSquareCode className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Oracle Analysis</span>
                <span className={`ml-auto flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${badge.color}`}>
                  <Zap className="w-3 h-3" /> {badge.label}
                </span>
              </div>
              <div className="text-sm text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap font-sans bg-zinc-950/30 p-5 rounded-xl border border-white/[0.02]">
                {analysis}
              </div>
            </section>
          </>
        )}
      </div>
    </motion.div>
  );
};
