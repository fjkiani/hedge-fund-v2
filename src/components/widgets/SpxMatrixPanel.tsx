/**
 * SpxMatrixPanel — Ported from Data-Linker SpxMatrix.tsx
 *
 * SPX Trap Matrix panel with:
 * - Decision banner (zone + action signal)
 * - Zone bar with price needle
 * - Quick stat cards
 * - Level rows for MAs, pivots, key zones
 *
 * Backend: chartApi.getMatrix('SPY') → TrapMatrix state
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { chartApi } from '../../lib/api';

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function sign(n: number) { return n >= 0 ? '+' : ''; }

const ZONE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ABOVE_GAMMA:   { label: 'ABOVE GAMMA WALL',  color: 'text-accent-red',   bg: 'bg-accent-red/10',   border: 'border-accent-red/30' },
  IN_GAMMA_WALL: { label: 'IN GAMMA WALL',     color: 'neon-text-red',     bg: 'bg-accent-red/5',    border: 'border-accent-red/20' },
  ABOVE_VETO:    { label: 'ABOVE VETO LINE',    color: 'text-accent-gold',  bg: 'bg-accent-gold/5',   border: 'border-accent-gold/20' },
  IN_COIL:       { label: 'INSIDE BEAR COIL',   color: 'neon-text-green',   bg: 'bg-accent-green/5',  border: 'border-accent-green/20' },
  BELOW_COIL:    { label: 'BELOW COIL FLOOR',   color: 'text-accent-gold',  bg: 'bg-accent-gold/5',   border: 'border-accent-gold/20' },
  MID_RANGE:     { label: 'MID-RANGE',          color: 'text-text-muted',   bg: 'bg-bg-tertiary/30',  border: 'border-border-subtle' },
};

const ACTION_LABEL: Record<string, string> = {
  STRONG_SELL:   'STRONG SELL',
  SHORT_FADE:    'SHORT / FADE',
  SELL_TRIM:     'SELL / TRIM',
  BUY_THE_DIP:   'BUY THE DIP',
  HOLD_CAUTION:  'HOLD / CAUTION',
  WAIT_MID_RANGE:'WAIT — NO EDGE',
  WAIT_ZONE_TOP: 'WAIT — NEAR ZONE TOP',
};

/* Zone bar visual */
function ZoneBar({ currentPrice, zones }: { currentPrice: number; zones: any }) {
  if (!zones) return null;
  const lo = zones.death_cross || zones.deathCross || currentPrice * 0.92;
  const hi = (zones.gamma_wall_top || zones.gammaWallTop || currentPrice * 1.05) * 1.003;
  const range = hi - lo;
  const pct = (val: number) => `${Math.max(0, Math.min(100, ((val - lo) / range) * 100)).toFixed(2)}%`;

  const coilBot = zones.bear_coil_bottom || zones.bearCoilBottom || currentPrice * 0.96;
  const coilTop = zones.bear_coil_top || zones.bearCoilTop || currentPrice * 0.98;
  const veto = zones.veto_level || zones.vetoLevel || currentPrice * 1.01;
  const gammaBot = zones.gamma_wall_bot || zones.gammaWallBot || currentPrice * 1.03;
  const gammaTop = zones.gamma_wall_top || zones.gammaWallTop || currentPrice * 1.05;
  const liqTrap = zones.liq_trap || zones.liqTrap || currentPrice * 0.94;

  const segments = [
    { bot: lo, top: liqTrap, color: 'bg-accent-red/40' },
    { bot: liqTrap, top: coilBot, color: 'bg-accent-gold/20' },
    { bot: coilBot, top: coilTop, color: 'bg-accent-green/30' },
    { bot: coilTop, top: veto, color: 'bg-bg-tertiary/40' },
    { bot: veto, top: gammaBot, color: 'bg-accent-gold/25' },
    { bot: gammaBot, top: gammaTop, color: 'bg-accent-red/30' },
    { bot: gammaTop, top: hi, color: 'bg-accent-red/50' },
  ];

  return (
    <div className="relative w-full h-10 rounded-lg overflow-hidden border border-border-subtle/40 flex mt-1">
      {segments.map((seg, i) => (
        <div key={i} className={`${seg.color} h-full`} style={{ width: `${Math.max(0, ((seg.top - seg.bot) / range) * 100)}%` }} />
      ))}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.8)]"
        style={{ left: pct(currentPrice) }}
      />
    </div>
  );
}

/* Level row */
function LevelRow({ label, value, diff, colorClass = 'text-text-muted', highlight = false }: {
  label: string; value: number; diff?: number; colorClass?: string; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 px-3 rounded-md text-sm font-mono ${highlight ? 'bg-bg-tertiary/30 border border-border-subtle/40' : ''}`}>
      <span className="text-text-muted text-xs uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-3">
        {diff !== undefined && (
          <span className={`text-xs ${diff > 0 ? 'text-accent-green' : diff < 0 ? 'text-accent-red' : 'text-text-muted'}`}>
            {sign(diff)}{fmt(diff)} pts
          </span>
        )}
        <span className={`font-semibold ${colorClass}`}>{fmt(value)}</span>
      </div>
    </div>
  );
}

export function SpxMatrixPanel({ symbol = 'SPY' }: { symbol?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchData = async () => {
    try {
      setFetching(true);
      setError(null);
      const res = await chartApi.getMatrix(symbol) as any;
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matrix data');
    } finally {
      setLoading(false);
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [symbol]);

  // ── Derive display values from actual API shape ──
  // API: {current_price, levels: {dp_levels[], gex_walls[], pivots[], moving_averages[], vwap}, traps[], context, staleness, ...}
  const currentPrice = data?.current_price || 0;
  const traps = data?.traps || [];
  const maxConviction = traps.length > 0 ? Math.max(...traps.map((t: any) => t.conviction || 0)) : null;


  // Derive zone from context or traps
  const contextZone = data?.context?.zone || data?.context?.current_zone;
  const zone = contextZone || (traps.length > 0 ? 'IN_COIL' : 'MID_RANGE');
  const zoneMeta = ZONE_META[zone] || ZONE_META.MID_RANGE;

  // Derive action from traps and context
  const contextSignal = data?.context?.signal || data?.context?.action;
  let action = contextSignal || (traps.length > 0 && maxConviction && maxConviction >= 4 ? 'BUY_THE_DIP' : 'WAIT_MID_RANGE');

  // ── Price-location override ──
  // The backend may say BUY_THE_DIP when inside a bear coil, but if price is
  // at the TOP of any individual trap (within 0.5% of ceiling), that's the wrong signal.
  // BUY THE DIP is only correct near the BOTTOM of the coil.
  const coilLow = traps.length > 0 ? Math.min(...traps.map((t: any) => t.price_min || Infinity)) : null;
  const coilHigh = traps.length > 0 ? Math.max(...traps.map((t: any) => t.price_max || 0)) : null;
  if (coilLow && coilHigh && currentPrice > 0) {
    // Check if near the top of ANY individual trap
    const nearAnyTrapTop = traps.some((t: any) => {
      const trapTop = t.price_max || 0;
      return trapTop > 0 && (trapTop - currentPrice) / trapTop < 0.005 && currentPrice <= trapTop;
    });
    // Check if near the bottom of ANY individual trap
    const nearAnyTrapBottom = traps.some((t: any) => {
      const trapBot = t.price_min || 0;
      return trapBot > 0 && (currentPrice - trapBot) / trapBot < 0.005 && currentPrice >= trapBot;
    });
    if (nearAnyTrapTop && (action === 'BUY_THE_DIP' || action === 'HOLD_CAUTION')) {
      action = 'WAIT_ZONE_TOP';
    } else if (nearAnyTrapBottom && action === 'WAIT_MID_RANGE') {
      action = 'BUY_THE_DIP';
    }
  }

  const actionLabel = ACTION_LABEL[action] || action?.replace(/_/g, ' ') || 'WAIT — NO EDGE';

  // Flatten levels object into array for rendering
  // API shapes: dp_levels/gex_walls = array, moving_averages = {MA200_SMA: {value, signal}}, pivots = {classic: {P, R1, S1...}}, max_pain = number, vwap = number|null
  const levelsObj = data?.levels || {};
  const flatLevels: any[] = [];
  for (const [source, items] of Object.entries(levelsObj)) {
    if (Array.isArray(items)) {
      // dp_levels, gex_walls
      (items as any[]).slice(0, 3).forEach((lvl: any) => {
        flatLevels.push({ ...lvl, price: lvl.price || lvl.strike, source: source.replace(/_/g, ' ').toUpperCase(), label: lvl.type || lvl.signal || source });
      });
    } else if (typeof items === 'number') {
      // max_pain, gamma_flip, vwap
      flatLevels.push({ price: items, source: source.replace(/_/g, ' ').toUpperCase(), label: source.replace(/_/g, ' '), type: 'LEVEL' });
    } else if (typeof items === 'object' && items !== null) {
      // moving_averages: {MA200_SMA: {value, signal}} or pivots: {symbol, prior_date, prior_hlc, classic: {P, R1, S1...}}
      // Skip non-level keys in pivots object
      const SKIP_KEYS = new Set(['symbol', 'prior_date', 'prior_hlc']);
      for (const [subKey, subVal] of Object.entries(items as Record<string, any>)) {
        if (SKIP_KEYS.has(subKey)) continue;
        if (typeof subVal === 'object' && subVal !== null && 'value' in subVal && typeof subVal.value === 'number') {
          // MA format: {value: 657.27, signal: 'BUY'}
          flatLevels.push({ price: subVal.value, signal: subVal.signal, source: source.replace(/_/g, ' ').toUpperCase(), label: subKey });
        } else if (typeof subVal === 'object' && subVal !== null) {
          // nested pivot group: classic: {P: 669, R1: 671, ...}
          for (const [pivotKey, pivotVal] of Object.entries(subVal as Record<string, any>)) {
            if (typeof pivotVal === 'number') {
              flatLevels.push({ price: pivotVal, source: `PIVOT ${subKey}`.toUpperCase(), label: pivotKey, type: pivotKey.startsWith('R') ? 'RESISTANCE' : pivotKey.startsWith('S') ? 'SUPPORT' : 'LEVEL' });
            }
          }
        }
      }
    }
  }
  flatLevels.sort((a, b) => Math.abs(currentPrice - (a.price || 0)) - Math.abs(currentPrice - (b.price || 0)));

  // Build zone-like structure for ZoneBar from levels
  const gexWalls = levelsObj.gex_walls || [];
  const masDict = (typeof levelsObj.moving_averages === 'object' && !Array.isArray(levelsObj.moving_averages)) ? levelsObj.moving_averages : {};
  const ma200Value = masDict?.MA200_SMA?.value || masDict?.MA200_EMA?.value || currentPrice * 0.92;
  const topGex = gexWalls[0]?.strike || currentPrice * 1.05;
  const maxPain = levelsObj.max_pain || currentPrice;
  const vwapLevel = levelsObj.vwap || currentPrice;
  const zones = {
    death_cross: ma200Value,
    bear_coil_bottom: maxPain * 0.98,
    bear_coil_top: maxPain,
    veto_level: vwapLevel,
    gamma_wall_bot: topGex * 0.995,
    gamma_wall_top: topGex * 1.005,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel rounded-xl overflow-hidden w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle/50">
        <div>
          <h2 className="text-lg font-display font-semibold text-text-primary flex items-center gap-2">
            ⚡ SPX Trap Matrix
          </h2>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            Dynamic zones from live MA100 EMA · auto-refreshes 60s
          </p>
          <p className="text-[11px] text-text-muted/70 mt-0.5 italic">The trap matrix shows where institutional money has set boundaries. Price respects these levels because billions of dollars in hedging create mechanical buying and selling at specific prices.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={fetching}
          className="p-2 rounded-lg border border-border-subtle/40 hover:bg-bg-hover/20 transition-colors text-text-muted"
        >
          <span className={`inline-block text-sm ${fetching ? 'animate-spin' : ''}`}>↻</span>
        </button>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted">
            <div className="w-10 h-10 border-4 border-bg-tertiary rounded-full relative">
              <div className="absolute inset-0 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-mono text-sm animate-pulse">Computing live matrix…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="text-3xl">⚠️</span>
            <p className="text-text-muted text-sm">{error}</p>
            <button onClick={fetchData} className="text-xs text-accent-blue underline">Retry</button>
          </div>
        ) : data ? (
          <div className="space-y-5">
            {/* Decision banner */}
            <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-start gap-4 ${zoneMeta.bg} ${zoneMeta.border}`}>
              <div className="flex items-center gap-3 flex-1">
                <div>
                  <div className={`text-xs font-mono uppercase tracking-widest ${zoneMeta.color} opacity-80`}>Current Zone</div>
                  <div className={`text-xl font-display font-bold ${zoneMeta.color}`}>{zoneMeta.label}</div>
                  {data.reason && <div className="text-sm text-text-muted mt-0.5">{data.reason}</div>}
                  <p className="text-[10px] text-text-muted/70 mt-1 italic">
                    {zone === 'IN_COIL' && 'Price is inside the bear coil — a compressed energy zone. When it breaks, the move is violent.'}
                    {zone === 'ABOVE_GAMMA' && 'Price is above the gamma wall — dealers are short gamma and amplifying the move. Danger zone.'}
                    {zone === 'BELOW_COIL' && 'Price is below the coil floor. If it bounces, trapped shorts get squeezed hard.'}
                    {zone === 'MID_RANGE' && 'No clear edge from current level. Wait for price to reach a zone boundary.'}
                    {zone === 'ABOVE_VETO' && 'Price is above the veto line but below the gamma wall. Caution — limited upside before resistance.'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider">Signal</div>
                <div className={`text-2xl font-black font-display ${zoneMeta.color}`}>{actionLabel}</div>
              </div>
            </div>

            {/* Quick stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Price', value: `$${fmt(currentPrice)}`, sub: symbol },
                { label: 'Max Pain', value: `$${fmt(levelsObj.max_pain || 0)}`, sub: 'Options gravity pulls price here by expiry', highlight: Math.abs(currentPrice - (levelsObj.max_pain || 0)) < 10 },
                { label: 'Conviction', value: maxConviction != null ? `${maxConviction}/5` : '—', sub: `${traps.length} trap${traps.length !== 1 ? 's' : ''} active — higher = more data sources agree` },
                { label: 'Staleness', value: (() => {
                  const s = data?.staleness;
                  if (!s) return 'Fresh';
                  if (typeof s === 'string') return s;
                  if (typeof s === 'object') {
                    // staleness is {pivots: {age: '10.7h'}, technicals: {age: '3min'}, ...}
                    const ages = Object.values(s as Record<string, any>).map((v: any) => v?.age || '').filter(Boolean);
                    return ages.length > 0 ? ages.join(' · ') : 'Fresh';
                  }
                  return 'Fresh';
                })(), sub: 'Data age' },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-lg border p-3 ${s.highlight ? 'border-accent-blue/30 bg-accent-blue/5' : 'border-border-subtle/40 bg-bg-tertiary/20'}`}
                >
                  <div className="text-xs text-text-muted font-mono uppercase tracking-wide">{s.label}</div>
                  <div className="text-lg font-bold font-mono text-text-primary data-number mt-0.5">{s.value}</div>
                  <div className="text-xs text-text-muted/60">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Zone bar */}
            {zones && (
              <div>
                <div className="text-xs text-text-muted font-mono uppercase tracking-wider mb-2 flex justify-between">
                  <span>Zone Map</span>
                  <span className="neon-text-blue">▶ {fmt(currentPrice)}</span>
                </div>
                <ZoneBar currentPrice={currentPrice} zones={zones} />
                <div className="flex justify-between text-xs font-mono text-text-muted/50 mt-1">
                  <span>DEATH</span><span>COIL</span><span>VETO</span><span>GAMMA</span>
                </div>
              </div>
            )}

            {/* Key levels */}
            {flatLevels.length > 0 && (
              <div className="rounded-lg border border-border-subtle/40 overflow-hidden">
                <div className="px-3 py-2 bg-bg-tertiary/20 border-b border-border-subtle/30">
                  <span className="text-xs font-mono uppercase tracking-widest text-text-muted">
                    Key Levels ({flatLevels.length})
                  </span>
                </div>
                <div className="px-2 py-1 space-y-0.5">
                  {flatLevels.slice(0, 12).map((lvl: any, i: number) => (
                    <LevelRow
                      key={i}
                      label={`${lvl.source} · ${lvl.label || lvl.type || ''}`}
                      value={lvl.price || lvl.strike || lvl.value || 0}
                      diff={currentPrice && (lvl.price || lvl.strike) ? currentPrice - (lvl.price || lvl.strike) : undefined}
                      colorClass={
                        (lvl.type === 'RESISTANCE' || lvl.signal === 'RESISTANCE') ? 'text-accent-red' :
                        (lvl.type === 'SUPPORT' || lvl.signal === 'SUPPORT') ? 'text-accent-green' : 'text-text-primary'
                      }
                      highlight={lvl.source?.includes('GEX') || lvl.source?.includes('GAMMA')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Traps */}
            {traps.length > 0 && (
              <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 overflow-hidden">
                <div className="px-3 py-2 border-b border-accent-gold/10">
                  <span className="text-xs font-mono text-accent-gold uppercase tracking-widest">
                    🪤 Active Traps ({traps.length})
                  </span>
                </div>
                <div className="divide-y divide-border-subtle/20">
                  {traps.slice(0, 5).map((trap: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1 px-3 py-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">{trap.emoji || '🪤'} {trap.type}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (trap.conviction || 0) >= 4 ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' :
                          (trap.conviction || 0) >= 3 ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' :
                          'bg-bg-tertiary/30 text-text-muted'
                        }`}>
                          {trap.conviction || '?'}/5
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-text-muted">
                        <span>${fmt(trap.price_min || 0, 0)} – ${fmt(trap.price_max || 0, 0)}</span>
                        {trap.narrative && <span className="text-text-muted/80 truncate ml-2 max-w-[200px]">{trap.narrative}</span>}
                      </div>
                      {trap.data_point && <div className="text-text-muted/60 text-[10px]">{trap.data_point}</div>}
                      {trap.supporting_sources && (
                        <div className="flex gap-1 mt-0.5">
                          {trap.supporting_sources.map((s: string, j: number) => (
                            <span key={j} className="px-1.5 py-0.5 rounded bg-bg-tertiary/40 text-[9px] text-text-muted">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-text-muted/40 font-mono text-right">
              {data.timestamp ? `As of ${new Date(data.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
