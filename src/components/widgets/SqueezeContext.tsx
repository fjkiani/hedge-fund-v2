/**
 * SqueezeContext — compact SPY squeeze risk card.
 * Reads brief.squeeze_context from /brief/master (no LLM call).
 *
 * Color coding:
 *   RED   → score >= 60      (high squeeze risk)
 *   AMBER → 40 <= score < 60 (moderate)
 *   GREY  → has_signal false (no signal / data unavailable)
 */

import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface SqueezeCtx {
  has_signal: boolean;
  score: number | null;
  short_interest_pct: number | null;
  days_to_cover: number | null;
  volume_ratio: number | null;
  price_change_5d: number | null;
  entry_price: number | null;
  stop_price: number | null;
  target_price: number | null;
  risk_reward_ratio: number | null;
}

interface SqueezeCandidateItem {
  symbol: string;
  score: number;
  short_interest_pct: number | null;
  days_to_cover: number | null;
  signal: string;
}

function getColorClass(ctx: SqueezeCtx | null): {
  band: string;
  label: string;
  hex: string;
} {
  if (!ctx || !ctx.has_signal || ctx.score == null) {
    return { band: 'grey', label: 'NO SIGNAL', hex: '#5a5a6a' };
  }
  if (ctx.score >= 60) return { band: 'red', label: 'HIGH RISK', hex: '#ef4444' };
  if (ctx.score >= 40) return { band: 'amber', label: 'MODERATE', hex: '#f59e0b' };
  return { band: 'green', label: 'LOW', hex: '#22c55e' };
}

export const SqueezeContext: React.FC = () => {
  const [ctx, setCtx] = useState<SqueezeCtx | null>(null);
  const [top3, setTop3] = useState<SqueezeCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/brief/master`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (active) {
          setCtx(data?.squeeze_context ?? null);
          setTop3(data?.squeeze_watchlist?.top3 ?? []);
          setErr(null);
        }
      } catch (e: unknown) {
        if (active) setErr(e instanceof Error ? e.message : 'fetch error');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000); // refresh every 60s
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const color = getColorClass(ctx);

  const fmt = (v: number | null, suffix = '', dec = 1) =>
    v != null ? `${v.toFixed(dec)}${suffix}` : '—';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${color.hex}44`,
        borderRadius: 12,
        padding: '16px 20px',
        fontFamily: "'Inter', sans-serif",
        minWidth: 240,
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#a0a0b0', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          SPY Squeeze Risk
        </span>
        <span
          style={{
            background: `${color.hex}22`,
            color: color.hex,
            border: `1px solid ${color.hex}66`,
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {color.label}
        </span>
      </div>

      {loading && (
        <div style={{ color: '#5a5a6a', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
          Loading…
        </div>
      )}

      {!loading && err && (
        <div style={{ color: '#ef4444', fontSize: 11 }}>Error: {err}</div>
      )}

      {!loading && !err && (
        <>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ color: color.hex, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
              {ctx?.score?.toFixed(1) ?? '—'}
            </span>
            <span style={{ color: '#5a5a6a', fontSize: 13 }}>/100</span>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
            {[
              { label: 'Short Int %', value: fmt(ctx?.short_interest_pct ?? null, '%') },
              { label: 'Days to Cover', value: fmt(ctx?.days_to_cover ?? null, 'd') },
              { label: 'Vol Ratio', value: fmt(ctx?.volume_ratio ?? null, 'x') },
              { label: '5D Change', value: fmt(ctx?.price_change_5d ?? null, '%') },
              { label: 'Entry', value: fmt(ctx?.entry_price ?? null, '', 2) },
              { label: 'Stop', value: fmt(ctx?.stop_price ?? null, '', 2) },
              { label: 'Target', value: fmt(ctx?.target_price ?? null, '', 2) },
              { label: 'R/R', value: fmt(ctx?.risk_reward_ratio ?? null, 'x') },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: '#5a5a6a', fontSize: 10, marginBottom: 1 }}>{label}</div>
                <div style={{ color: '#e0e0f0', fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* No signal state */}
          {!ctx?.has_signal && (
            <div style={{ marginTop: 10, color: '#5a5a6a', fontSize: 11, textAlign: 'center' }}>
              No squeeze signal detected
            </div>
          )}

          {/* Watchlist top-3 */}
          <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
            <div style={{ color: '#a0a0b0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              Top Squeeze Candidates
            </div>
            {top3.length === 0 ? (
              <div style={{ color: '#5a5a6a', fontSize: 11, fontStyle: 'italic' }}>
                Scanning watchlist…
              </div>
            ) : (
              top3.map((c) => (
                <div
                  key={c.symbol}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                    padding: '5px 8px',
                    background: 'rgba(34,197,94,0.06)',
                    borderRadius: 6,
                    border: '1px solid rgba(34,197,94,0.15)',
                  }}
                >
                  <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 13, minWidth: 48 }}>{c.symbol}</span>
                  <span style={{
                    background: 'rgba(34,197,94,0.15)',
                    color: '#22c55e',
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}>{c.score.toFixed(0)}</span>
                  <span style={{ color: '#a0a0b0', fontSize: 11 }}>
                    SI {c.short_interest_pct != null ? `${c.short_interest_pct.toFixed(1)}%` : '—'}
                  </span>
                  <span style={{ color: '#a0a0b0', fontSize: 11 }}>
                    DTC {c.days_to_cover != null ? `${c.days_to_cover.toFixed(1)}d` : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SqueezeContext;
