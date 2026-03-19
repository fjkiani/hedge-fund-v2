/**
 * VolRegime — Ported from Data-Linker VolRegime.tsx
 *
 * Volatility regime panel with:
 * - VIX gauge (CSS semicircle — avoids RadialBarChart crash)
 * - Regime banner (CALM/ELEVATED/FEAR/EXTREME_FEAR)
 * - Exploit Score gauge
 * - Key metrics
 *
 * Backend: axlfiApi.regime() → regime data
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { axlfiApi, chartApi } from '../../lib/api';

/* ── Regime color map (unchanged) ── */
function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

const REGIME_COLORS: Record<string, { text: string; bg: string; border: string; hex: string }> = {
  CALM:          { text: 'text-accent-green', bg: 'bg-accent-green/5', border: 'border-accent-green/20', hex: '#00ff88' },
  LOW_VOL:       { text: 'text-accent-green', bg: 'bg-accent-green/5', border: 'border-accent-green/20', hex: '#00ff88' },
  ELEVATED:      { text: 'text-accent-gold',  bg: 'bg-accent-gold/5',  border: 'border-accent-gold/20',  hex: '#ffd700' },
  NORMAL:        { text: 'text-accent-gold',  bg: 'bg-accent-gold/5',  border: 'border-accent-gold/20',  hex: '#ffd700' },
  FEAR:          { text: 'text-accent-red',   bg: 'bg-accent-red/5',   border: 'border-accent-red/20',   hex: '#ff3366' },
  HIGH_VOL:      { text: 'text-accent-red',   bg: 'bg-accent-red/5',   border: 'border-accent-red/20',   hex: '#ff3366' },
  EXTREME_FEAR:  { text: 'text-accent-red',   bg: 'bg-accent-red/10',  border: 'border-accent-red/30',   hex: '#ff0033' },
  CRISIS:        { text: 'text-accent-red',   bg: 'bg-accent-red/10',  border: 'border-accent-red/30',   hex: '#ff0033' },
};

function getRegimeColor(regime: string | undefined) {
  if (!regime) return REGIME_COLORS.CALM;
  const key = regime.toUpperCase().replace(/[\s-]/g, '_');
  return REGIME_COLORS[key] || REGIME_COLORS.CALM;
}

/* ── CSS VIX Gauge (semicircle — no Recharts, no crash) ── */
function VixGauge({ value, max = 45 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value < 15 ? '#00ff88' : value < 20 ? '#ffd700' : value < 30 ? '#fb923c' : '#ff3366';

  return (
    <div className="relative w-32 h-[68px] mx-auto overflow-hidden">
      {/* Background arc */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-14 rounded-t-full border-4 border-bg-tertiary/40" />
      {/* Filled arc using conic-gradient */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-14 rounded-t-full overflow-hidden"
        style={{
          background: `conic-gradient(from -90deg at 50% 100%, ${color} ${pct * 1.8}deg, transparent ${pct * 1.8}deg)`,
          opacity: 0.9,
        }}
      />
      {/* Value */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <span className="text-2xl font-black font-mono data-number" style={{ color }}>{fmt(value, 1)}</span>
      </div>
    </div>
  );
}

/* ── CSS Exploit Score Meter ── */
export function ScoreMeter({ score }: { score: number }) {
  const color = score >= 70 ? '#00ff88' : score >= 50 ? '#ffd700' : score >= 30 ? '#fb923c' : '#606070';
  const pct = Math.min(100, score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-[52px] overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 rounded-t-full border-[3px] border-bg-tertiary/40" />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 rounded-t-full overflow-hidden"
          style={{ background: `conic-gradient(from -90deg at 50% 100%, ${color} ${pct * 1.8}deg, transparent ${pct * 1.8}deg)`, opacity: 0.85 }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <span className="text-lg font-black font-mono data-number" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Exploit Score</span>
    </div>
  );
}

export function VolRegimePanel() {
  const [data, setData] = useState<any>(null);
  const [matrixCtx, setMatrixCtx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchData = async () => {
    try {
      setFetching(true);
      setError(null);
      // Dual fetch: regime tier from AXLFI + VIX/gamma/COT from matrix context
      const [regimeRes, matrixRes] = await Promise.all([
        axlfiApi.regime().catch(() => null) as Promise<any>,
        chartApi.getMatrix('SPY').catch(() => null) as Promise<any>,
      ]);
      setData(regimeRes);
      setMatrixCtx(matrixRes?.context || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vol regime');
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120_000);
    return () => clearInterval(interval);
  }, []);

  // ── Regime tier from /axlfi/regime ──
  const TIER_MAP: Record<number, string> = { 1: 'LOW_VOL', 2: 'NORMAL', 3: 'ELEVATED', 4: 'CRISIS' };
  const regimeObj = data?.regime;
  const tierNum = typeof regimeObj === 'object' && regimeObj !== null ? regimeObj?.current_regime : null;
  const regimeKey = tierNum != null ? (TIER_MAP[tierNum] || 'NORMAL') : (typeof regimeObj === 'string' ? regimeObj : 'UNKNOWN');
  const regimeColor = getRegimeColor(regimeKey);
  const regimeLabel = (typeof regimeObj === 'object' && regimeObj !== null && regimeObj.tier_label)
    ? regimeObj.tier_label
    : regimeKey.replace(/_/g, ' ');

  // ── VIX + gamma + COT from /charts/SPY/matrix context ──
  const vixValue = matrixCtx?.vix ?? null;  // 22.93 (real), null if unavailable — NEVER show 0
  const vixRegime = matrixCtx?.vix_regime || null;  // "ELEVATED"
  const gammaRegime = matrixCtx?.gamma_regime || null;  // "NEGATIVE"
  const cotSignal = matrixCtx?.cot_signal || null;  // "SPEC_TRAP_LOADED"
  const cotNetSpec = matrixCtx?.cot_net_spec ?? null;  // -134505
  const alertLevel = matrixCtx?.alert_level || null;  // "RED"

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-panel rounded-xl overflow-hidden w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle/50">
        <div>
          <h2 className="text-base font-display font-semibold text-text-primary flex items-center gap-2">
            🌡️ Vol Regime
          </h2>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            VIX level · vol-of-vol · exploitation score
          </p>
          <p className="text-[11px] text-text-muted/70 mt-0.5 italic">Fear gauge + dealer positioning = tells you how much risk is priced in and whether to size up or down.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={fetching}
          className="p-2 rounded-lg border border-border-subtle/40 hover:bg-bg-hover/20 transition-colors text-text-muted"
        >
          <span className={`inline-block text-sm ${fetching ? 'animate-spin' : ''}`}>↻</span>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-text-muted">
            <div className="w-8 h-8 border-4 border-bg-tertiary rounded-full relative">
              <div className="absolute inset-0 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-mono text-sm animate-pulse">Loading vol regime…</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-6 justify-center text-accent-red/80 text-sm">
            ⚠ {error}
            <button onClick={fetchData} className="text-xs text-accent-blue underline ml-2">Retry</button>
          </div>
        ) : data ? (
          <>
            {/* Regime summary row */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${regimeColor.bg} ${regimeColor.border}`}>
              <div>
                <div className={`text-xs font-mono uppercase tracking-widest ${regimeColor.text} opacity-70`}>Vol Regime</div>
                <div className={`text-xl font-display font-black ${regimeColor.text}`}>
                  {regimeLabel}
                </div>
                <p className="text-[10px] text-text-muted/70 mt-1 italic">
                  {regimeKey === 'LOW_VOL' || regimeKey === 'CALM' ? 'Markets are calm. Premium is cheap. This is when you buy protection and sell credit spreads.' : ''}
                  {regimeKey === 'NORMAL' || regimeKey === 'ELEVATED' ? 'Volatility is elevated but not panicking. Position size matters more than direction right now.' : ''}
                  {regimeKey === 'HIGH_VOL' || regimeKey === 'FEAR' ? 'Fear is high. Premiums are expensive. This is where short vol sellers make money — but timing matters.' : ''}
                  {regimeKey === 'CRISIS' || regimeKey === 'EXTREME_FEAR' ? 'Panic regime. Everything is correlated. Only trade if you have a thesis. Cash is a position.' : ''}
                </p>
              </div>
              {alertLevel && (
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  alertLevel === 'RED' ? 'bg-accent-red/15 text-accent-red border border-accent-red/20' :
                  alertLevel === 'YELLOW' ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/20' :
                  'bg-accent-green/15 text-accent-green border border-accent-green/20'
                }`}>
                  {alertLevel}
                </span>
              )}
            </div>

            {/* VIX + Gamma + COT — real data from matrix context */}
            <div className="grid grid-cols-3 gap-3">
              {/* VIX */}
              <div className="rounded-lg border border-border-subtle/40 bg-bg-tertiary/30 p-3 text-center">
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">VIX</div>
                {vixValue != null ? (
                  <>
                    <div className={`text-2xl font-bold font-mono data-number ${
                      vixValue >= 30 ? 'text-accent-red' : vixValue >= 20 ? 'text-accent-gold' : 'text-accent-green'
                    }`}>
                      {vixValue.toFixed(1)}
                    </div>
                    {vixRegime && (
                      <div className={`text-[10px] font-mono mt-0.5 ${
                        vixRegime === 'ELEVATED' ? 'text-accent-gold' : vixRegime === 'HIGH' ? 'text-accent-red' : 'text-accent-green'
                      }`}>
                        {vixRegime}
                      </div>
                    )}
                    <p className="text-[9px] text-text-muted/60 mt-1 italic">{vixValue < 15 ? 'Complacency. Cheap hedges available.' : vixValue < 20 ? 'Normal. Markets pricing typical risk.' : vixValue < 30 ? 'Elevated fear. Options are expensive.' : 'Panic. Everything moves together.'}</p>
                  </>
                ) : (
                  <div className="text-xs text-accent-red/70 font-mono py-2">⚠ Feed unavailable</div>
                )}
              </div>

              {/* Gamma Regime */}
              <div className="rounded-lg border border-border-subtle/40 bg-bg-tertiary/30 p-3 text-center">
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">Gamma</div>
                {gammaRegime ? (
                  <>
                    <div className={`text-lg font-bold font-mono ${
                      gammaRegime === 'NEGATIVE' ? 'text-accent-red' : 'text-accent-green'
                    }`}>
                      {gammaRegime === 'NEGATIVE' ? 'SHORT' : 'LONG'}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted/60 mt-0.5">
                      {gammaRegime === 'NEGATIVE' ? 'Dealers amplify moves' : 'Dealers dampen moves'}
                    </div>
                    <p className="text-[9px] text-text-muted/60 mt-1 italic">{gammaRegime === 'NEGATIVE' ? 'Short gamma = moves accelerate. Do not fade.' : 'Long gamma = moves get absorbed. Mean reversion works.'}</p>
                  </>
                ) : (
                  <div className="text-xs text-text-muted/60 font-mono py-2">—</div>
                )}
              </div>

              {/* COT */}
              <div className="rounded-lg border border-border-subtle/40 bg-bg-tertiary/30 p-3 text-center">
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-1">COT</div>
                {cotSignal ? (
                  <>
                    <div className={`text-xs font-bold font-mono leading-tight ${
                      cotSignal.includes('TRAP') ? 'text-accent-gold' : 'text-text-primary'
                    }`}>
                      {cotSignal.replace(/_/g, ' ')}
                    </div>
                    {cotNetSpec != null && (
                      <div className="text-[10px] font-mono text-text-muted/60 mt-1">
                        Net: {cotNetSpec.toLocaleString()}
                      </div>
                    )}
                    <p className="text-[9px] text-text-muted/60 mt-1 italic">{cotNetSpec != null && cotNetSpec < 0 ? 'Specs are net short. Squeeze fuel if market rallies.' : 'Specs are net long. Crowded trade — watch for unwind.'}</p>
                  </>
                ) : (
                  <div className="text-xs text-text-muted/60 font-mono py-2">—</div>
                )}
              </div>
            </div>

            {/* VIX gauge (only if we have a value) */}
            {vixValue != null && <VixGauge value={vixValue} />}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
