/**
 * Dark Pool Intelligence — Full Data-Linker Dashboard Layout
 *
 * Multi-panel dashboard with ALL ported Data-Linker components:
 * - DPEdgeDashboard (edge stats + patterns + directional bias)
 * - DarkPoolFlow (levels, prints, positions)
 * - GexPanel (gamma exposure + call/put walls)
 * - VolRegimePanel (VIX gauge + exploit score)
 * - SpxMatrixPanel (trap matrix + zone bar)
 *
 * Each panel is wrapped in an error boundary so one crash doesn't nuke the page.
 */

import { Component, type ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { DPEdgeDashboard } from '../components/widgets/DPEdgeDashboard';
import { DarkPoolFlow } from '../components/widgets/DarkPoolFlow';
import { GexPanel } from '../components/widgets/GexPanel';
import { VolRegimePanel } from '../components/widgets/VolRegimePanel';
import { SpxMatrixPanel } from '../components/widgets/SpxMatrixPanel';
import { TrapCompressionSignal } from '../components/widgets/TrapCompressionSignal';
import KillShotsDashboard from '../components/widgets/kill-shots/KillShotsDashboard';
import { signalsApi } from '../lib/api';
import type { SignalData } from '../components/ui/SignalSlug';

/* ── Error Boundary (isolates panel crashes) ── */
class PanelErrorBoundary extends Component<{ name: string; children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm text-text-muted font-mono">{this.props.name} failed to render</p>
          <p className="text-xs text-text-muted/60 font-mono max-w-sm text-center">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs text-accent-blue underline mt-1"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

/* ── DP Signal Consensus Panel ── */
function DPSignalConsensus() {
  const [dpSignal, setDpSignal] = useState<SignalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await signalsApi.getAll() as { signals: SignalData[] };
        const dp = res.signals?.find(s => s.source === 'DarkPoolTrend') || null;
        setDpSignal(dp);
        setError(null);
      } catch (e: any) {
        setError(e.message || 'Failed to load signals');
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-5" style={{ minHeight: '200px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
          DP SIGNAL CONSENSUS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-5" style={{ minHeight: '120px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
          DP SIGNAL CONSENSUS
        </div>
        <div style={{ color: 'rgba(255,100,100,0.7)', fontSize: '12px', fontFamily: 'var(--font-mono, monospace)' }}>
          ⚠️ Signal fetch failed — {error}
        </div>
      </div>
    );
  }

  if (!dpSignal) {
    return (
      <div className="glass-panel rounded-xl p-5" style={{ minHeight: '120px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
          DP SIGNAL CONSENSUS
        </div>
        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontFamily: 'var(--font-mono, monospace)' }}>
          Market closed — AXLFI updates Mon-Fri. Signal refreshes at next market open.
        </div>
      </div>
    );
  }

  const chain = dpSignal.reasoning_chain || dpSignal.reasoning || [];
  const isEnriched = Array.isArray(dpSignal.reasoning_chain) && dpSignal.reasoning_chain.length >= 5;
  const isBull = dpSignal.action === 'LONG';
  const isWatch = dpSignal.action === 'WATCH' || dpSignal.action === 'HOLD';
  const accentColor = isWatch ? '#ffa726' : isBull ? '#00c853' : '#ff5252';
  const gex = dpSignal.gex;
  const kl = dpSignal.key_levels;
  const inv = dpSignal.invalidation_conditions || [];
  const tier = dpSignal.regime_tier;

  const tierLabel = tier === 1 ? 'TIER 1 — HIGH CONVICTION' : tier === 2 ? 'TIER 2 — MODERATE' : tier === 3 ? 'TIER 3 — LOW' : null;
  const tierColor = tier === 1 ? '#00c853' : tier === 2 ? '#ffa726' : '#ff5252';

  return (
    <div className="glass-panel rounded-xl p-5">
      {/* ── Header row: title + regime tier badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)' }}>
          DP SIGNAL CONSENSUS
        </div>
        {tierLabel && (
          <span style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '1px',
            padding: '2px 8px', borderRadius: '4px',
            color: tierColor,
            background: `${tierColor}15`,
            border: `1px solid ${tierColor}40`,
          }}>
            {tierLabel}
          </span>
        )}
      </div>

      {/* ── 1. Action badge + confidence + velocity ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{
          fontSize: '13px', fontWeight: 800, color: accentColor,
          padding: '3px 10px', borderRadius: '5px',
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}40`,
        }}>
          {isWatch ? '👀' : isBull ? '▲' : '▼'} {dpSignal.action}
        </span>
        <span style={{
          fontSize: '14px', fontWeight: 700, color: '#00d4ff',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          {dpSignal.confidence}%
        </span>
        {dpSignal.dp_trend_velocity != null && (
          <span style={{
            fontSize: '11px', fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            color: dpSignal.dp_trend_velocity > 0 ? '#00c853' : '#ff5252',
            padding: '2px 6px', borderRadius: '4px',
            background: dpSignal.dp_trend_velocity > 0 ? 'rgba(0,200,83,0.1)' : 'rgba(255,82,82,0.1)',
          }}>
            VEL {dpSignal.dp_trend_velocity > 0 ? '+' : ''}{dpSignal.dp_trend_velocity.toFixed(1)}%
          </span>
        )}
      </div>

      {/* ── 1b. Entry context — range note + data staleness ── */}
      {dpSignal.entry_note && (
        <div style={{
          marginBottom: '10px', padding: '6px 10px', borderRadius: '6px',
          background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.15)',
          fontSize: '11px', color: 'rgba(0, 212, 255, 0.85)',
          fontFamily: 'var(--font-mono, monospace)', lineHeight: '1.5',
        }}>
          📍 {dpSignal.entry_note}
        </div>
      )}
      {dpSignal.signal_generated_at && (
        <div style={{
          marginBottom: '14px', fontSize: '10px',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          ⏱ Signal generated: {dpSignal.signal_generated_at}
        </div>
      )}

      {/* ── 2. Reasoning chain — numbered steps (enriched vs legacy) ── */}
      {chain.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
            {isEnriched ? '🔗 REASONING CHAIN' : 'WHY THIS SIGNAL'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {chain.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{
                  minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', fontSize: '9px', fontWeight: 800, flexShrink: 0,
                  background: i === chain.length - 1 ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.06)',
                  color: i === chain.length - 1 ? '#00d4ff' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${i === chain.length - 1 ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>{step}</span>
                  {isEnriched && i < chain.length - 1 && (
                    <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '9px', marginLeft: '2px', lineHeight: '1' }}>↓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Invalidation conditions — orange warning chips ── */}
      {inv.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: '#ffa726', marginBottom: '6px' }}>
            ⛔ INVALIDATION
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {inv.map((cond, i) => (
              <span key={i} style={{
                fontSize: '10px', color: 'rgba(255, 167, 38, 0.9)',
                padding: '3px 8px', borderRadius: '4px',
                background: 'rgba(255, 167, 38, 0.08)',
                border: '1px solid rgba(255, 167, 38, 0.2)',
                fontFamily: 'var(--font-mono, monospace)',
              }}>
                {cond}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Key levels strip: Put Wall | Call Wall | Max Pain ── */}
      {(gex || kl) && (
        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap',
          padding: '8px 10px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          fontSize: '10px', fontFamily: 'var(--font-mono, monospace)',
        }}>
          {gex?.gamma_regime && (
            <span style={{ color: gex.gamma_regime === 'POSITIVE' ? '#00c853' : '#ff5252' }}>
              GEX: {gex.gamma_regime}
            </span>
          )}
          {kl?.put_wall != null && <span style={{ color: '#ff5252' }}>PUT: ${kl.put_wall.toFixed(0)}</span>}
          {kl?.call_wall != null && <span style={{ color: '#00c853' }}>CALL: ${kl.call_wall.toFixed(0)}</span>}
          {kl?.max_pain != null && <span style={{ color: 'rgba(255,255,255,0.5)' }}>MP: ${kl.max_pain.toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
}

export function DarkPool() {
  const [searchParams] = useSearchParams();
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'SPY';

  return (
    <motion.div
      className="min-h-screen p-4 space-y-4"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Compact page header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-display font-bold"
            style={{
              background: 'linear-gradient(135deg, #e2e8f0 0%, #00d4ff 40%, #00ff88 70%, #ffd700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🏴 Dark Pool Intelligence
          </h1>
          <p className="text-text-muted font-mono text-xs mt-0.5 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            FINRA Off-Exchange · GEX · Vol Regime · Trap Matrix — {symbol}
          </p>
        </div>
      </motion.div>

      {/* ── Row 1: Kill Shots (tall, left) + Trap Compression + DP Edge (right col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Kill Shots — spans 2 columns on the left */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <PanelErrorBoundary name="Kill Shots">
            <KillShotsDashboard />
          </PanelErrorBoundary>
        </motion.div>

        {/* Right column: Trap Compression stacked over DP Edge */}
        <div className="flex flex-col gap-4">
          <motion.div variants={fadeUp}>
            <PanelErrorBoundary name="Trap Compression Signal">
              <TrapCompressionSignal symbol={symbol} />
            </PanelErrorBoundary>
          </motion.div>
          <motion.div variants={fadeUp}>
            <PanelErrorBoundary name="DP Edge Dashboard">
              <DPEdgeDashboard />
            </PanelErrorBoundary>
          </motion.div>
          <motion.div variants={fadeUp}>
            <PanelErrorBoundary name="DP Signal Consensus">
              <DPSignalConsensus />
            </PanelErrorBoundary>
          </motion.div>
        </div>
      </div>

      {/* ── Row 2: Dark Pool Flow (wider) + GEX Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <PanelErrorBoundary name="Dark Pool Flow">
            <DarkPoolFlow symbol={symbol} />
          </PanelErrorBoundary>
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <PanelErrorBoundary name="GEX Panel">
            <GexPanel symbol={symbol} />
          </PanelErrorBoundary>
        </motion.div>
      </div>

      {/* ── Row 3: SPX Trap Matrix + Vol Regime ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp}>
          <PanelErrorBoundary name="SPX Trap Matrix">
            <SpxMatrixPanel symbol="SPY" />
          </PanelErrorBoundary>
        </motion.div>
        <motion.div variants={fadeUp}>
          <PanelErrorBoundary name="Vol Regime">
            <VolRegimePanel />
          </PanelErrorBoundary>
        </motion.div>
      </div>
    </motion.div>
  );
}
