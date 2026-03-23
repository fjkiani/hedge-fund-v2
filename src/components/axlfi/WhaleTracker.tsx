/**
 * Whale Tracker — Weapon 2 (v2: Dual Y-Axis)
 *
 * Calls /detail/{sym} for SPY, QQQ, IWM in parallel.
 * LEFT Y-AXIS: Cumulative dark pool position (shares)
 * RIGHT Y-AXIS: SPY close price ($)
 *
 * The overlay shows one of three patterns:
 *  1. Price DOWN + DP UP = buying weakness (strongest bullish)
 *  2. Price UP + DP UP = chasing (less conviction)
 *  3. Price UP + DP DOWN = distribution into strength (trap)
 */

import { useEffect, useState } from 'react';
import { axlfiApi } from '../../lib/api';
import { AXLFICard, fmt } from './shared';

const SYMBOLS = ['SPY', 'QQQ', 'IWM'] as const;
const COLORS: Record<string, string> = {
  SPY: '#3b82f6',
  QQQ: '#a855f7',
  IWM: '#f59e0b',
};
const PRICE_COLOR = '#ef4444'; // red for price line

interface DPPoint {
  date: string;
  position: number;
  close?: number;
}

type Pattern = 'BUYING_WEAKNESS' | 'CHASING' | 'DISTRIBUTION_TRAP' | 'UNKNOWN';

function detectPattern(
  priceStart: number,
  priceEnd: number,
  dpStart: number,
  dpEnd: number
): Pattern {
  const priceUp = priceEnd > priceStart;
  const dpUp = dpEnd > dpStart;
  if (!priceUp && dpUp) return 'BUYING_WEAKNESS';
  if (priceUp && dpUp) return 'CHASING';
  if (priceUp && !dpUp) return 'DISTRIBUTION_TRAP';
  return 'UNKNOWN';
}

const PATTERN_META: Record<
  Pattern,
  { label: string; emoji: string; color: string; desc: string }
> = {
  BUYING_WEAKNESS: {
    label: 'BUYING WEAKNESS',
    emoji: '🟢',
    color: '#22c55e',
    desc: 'Price falling while institutions accumulate — strongest bullish signal',
  },
  CHASING: {
    label: 'CHASING',
    emoji: '🟡',
    color: '#f59e0b',
    desc: 'Price and DP both rising — institutions chasing, less conviction',
  },
  DISTRIBUTION_TRAP: {
    label: 'DISTRIBUTION TRAP',
    emoji: '🔴',
    color: '#ef4444',
    desc: 'Price rising while institutions sell — distribution into strength',
  },
  UNKNOWN: {
    label: 'UNCLEAR',
    emoji: '⚪',
    color: '#6b7280',
    desc: 'No clear pattern detected',
  },
};

interface WhaleTrackerProps {
  /** Dashboard blob from /dashboard/all — contains spy_history with price data */
  dashboard?: any;
}

export function WhaleTracker({ dashboard }: WhaleTrackerProps) {
  const [data, setData] = useState<Record<string, DPPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const results = await Promise.allSettled(
          SYMBOLS.map((sym) => axlfiApi.detail(sym, 30))
        );

        if (!mounted) return;

        const parsed: Record<string, DPPoint[]> = {};
        SYMBOLS.forEach((sym, i) => {
          const r = results[i];
          if (r.status !== 'fulfilled' || !r.value) return;
          const resp = r.value as any;
          const dp = resp.individual_dark_pool_position_data;
          if (!dp?.dates || !dp?.dp_position) return;

          // ── Build date→price map from ALL available sources ──
          const priceMap: Record<string, number> = {};

          // Source 1: response.prices (top-level from /detail endpoint)
          // Actual format: {dates: [...], prices: [694.04, 691.97, ...]}
          const topPrices = resp.prices;
          if (Array.isArray(topPrices)) {
            topPrices.forEach((p: any) => {
              if (p?.date && p?.close != null) priceMap[p.date] = Number(p.close);
              else if (p?.Date && p?.Close != null) priceMap[p.Date] = Number(p.Close);
            });
          } else if (topPrices && typeof topPrices === 'object') {
            // Parallel arrays: {dates: [...], prices: [...]} or {dates: [...], close: [...]}
            const vals = topPrices.prices || topPrices.close || topPrices.Close || [];
            const dates = topPrices.dates || topPrices.Dates || [];
            if (Array.isArray(dates) && Array.isArray(vals)) {
              dates.forEach((d: string, j: number) => {
                if (vals[j] != null) priceMap[d] = Number(vals[j]);
              });
            }
          }

          // Source 2: dashboard.spy_history (365KB blob, SPY only)
          if (sym === 'SPY' && Object.keys(priceMap).length === 0 && dashboard?.spy_history) {
            const hist = dashboard.spy_history;
            if (Array.isArray(hist)) {
              hist.forEach((h: any) => {
                const d = h.date || h.Date;
                const c = h.close ?? h.Close;
                if (d && c != null) priceMap[d] = Number(c);
              });
            } else if (hist?.dates && hist?.close) {
              hist.dates.forEach((d: string, j: number) => {
                if (hist.close[j] != null) priceMap[d] = Number(hist.close[j]);
              });
            } else if (typeof hist === 'object') {
              // Could be date-keyed: {"2026-03-10": {close: 570}, ...}
              Object.entries(hist).forEach(([d, v]: [string, any]) => {
                const c = typeof v === 'number' ? v : v?.close ?? v?.Close;
                if (c != null) priceMap[d] = Number(c);
              });
            }
          }

          // Source 3: inside DP sub-object (least likely but try)
          if (Object.keys(priceMap).length === 0) {
            const dpCloses = dp.close || dp.close_price || dp.price || [];
            if (Array.isArray(dpCloses) && dpCloses.length > 0) {
              dp.dates.forEach((d: string, j: number) => {
                if (dpCloses[j] != null) priceMap[d] = Number(dpCloses[j]);
              });
            }
          }

          parsed[sym] = dp.dates.map((d: string, j: number) => ({
            date: d,
            position: dp.dp_position[j] || 0,
            close: priceMap[d] ?? undefined,
          }));
        });

        setData(parsed);
      } catch (e: any) {
        if (mounted) setErr(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <AXLFICard title="Whale Tracker" icon="🐋">
        <p
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.8rem',
            textAlign: 'center',
          }}
        >
          Loading dark pool positions...
        </p>
      </AXLFICard>
    );
  }

  if (err || Object.keys(data).length === 0) {
    return (
      <AXLFICard title="Whale Tracker" icon="🐋">
        <p style={{ color: 'var(--accent-orange)', fontSize: '0.75rem' }}>
          ⚠️ {err || 'No data available'}
        </p>
      </AXLFICard>
    );
  }

  // ── DP position axis (left) ──
  let dpMin = Infinity;
  let dpMax = -Infinity;
  const allDates = new Set<string>();

  Object.values(data).forEach((points) => {
    points.forEach((p) => {
      if (p.position < dpMin) dpMin = p.position;
      if (p.position > dpMax) dpMax = p.position;
      allDates.add(p.date);
    });
  });

  const sortedDates = Array.from(allDates).sort();
  const dpRange = dpMax - dpMin || 1;

  // ── Price axis (right) — SPY only ──
  const spyPoints = data.SPY || [];
  const pricePoints = spyPoints.filter((p) => p.close != null);
  let priceMin = Infinity;
  let priceMax = -Infinity;
  pricePoints.forEach((p) => {
    if (p.close! < priceMin) priceMin = p.close!;
    if (p.close! > priceMax) priceMax = p.close!;
  });
  const priceRange = priceMax - priceMin || 1;
  const hasPrice = pricePoints.length > 2;

  // ── Pattern detection (last 5 days) ──
  let pattern: Pattern = 'UNKNOWN';
  if (hasPrice && spyPoints.length >= 5) {
    const recent = spyPoints.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    if (first.close != null && last.close != null) {
      pattern = detectPattern(first.close, last.close, first.position, last.position);
    }
  }
  const pmeta = PATTERN_META[pattern];

  // ── Chart dimensions ──
  const W = 800;
  const H = 220;
  const PAD_L = 10;
  const PAD_R = hasPrice ? 50 : 10;
  const PAD_T = 10;
  const PAD_B = 30;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  function xPos(idx: number) {
    return PAD_L + (idx / (sortedDates.length - 1 || 1)) * chartW;
  }
  function yDP(val: number) {
    return PAD_T + chartH - ((val - dpMin) / dpRange) * chartH;
  }
  function yPrice(val: number) {
    return PAD_T + chartH - ((val - priceMin) / priceRange) * chartH;
  }

  // ── Build DP paths ──
  const dpPaths: { sym: string; d: string; lastY: number }[] = [];
  SYMBOLS.forEach((sym) => {
    const pts = data[sym];
    if (!pts?.length) return;
    const dateMap = new Map(pts.map((p) => [p.date, p.position]));
    let pathD = '';
    let lastY = 0;
    sortedDates.forEach((date, i) => {
      const val = dateMap.get(date);
      if (val === undefined) return;
      const px = xPos(i);
      const py = yDP(val);
      pathD += pathD ? ` L${px},${py}` : `M${px},${py}`;
      lastY = py;
    });
    dpPaths.push({ sym, d: pathD, lastY });
  });

  // ── Build price path (SPY only) ──
  let pricePath = '';
  if (hasPrice) {
    const dateMap = new Map(
      pricePoints.map((p) => [p.date, p.close!])
    );
    sortedDates.forEach((date, i) => {
      const val = dateMap.get(date);
      if (val === undefined) return;
      const px = xPos(i);
      const py = yPrice(val);
      pricePath += pricePath ? ` L${px},${py}` : `M${px},${py}`;
    });
  }

  // Date labels
  const labelIndices = [
    0,
    Math.floor(sortedDates.length * 0.25),
    Math.floor(sortedDates.length * 0.5),
    Math.floor(sortedDates.length * 0.75),
    sortedDates.length - 1,
  ];

  // Latest values
  const latestValues: { sym: string; val: number; trend: string }[] = [];
  SYMBOLS.forEach((sym) => {
    const pts = data[sym];
    if (!pts?.length) return;
    const last = pts[pts.length - 1].position;
    const prev = pts.length > 5 ? pts[pts.length - 6].position : pts[0].position;
    latestValues.push({
      sym,
      val: last,
      trend: last > prev ? '📈' : last < prev ? '📉' : '➡️',
    });
  });

  const latestPrice = pricePoints.length
    ? pricePoints[pricePoints.length - 1].close
    : null;

  return (
    <AXLFICard title="Whale Tracker — Institutional DP vs SPY Price" icon="🐋">
      {/* Pattern detection banner */}
      <div
        style={{
          background: `${pmeta.color}15`,
          border: `1px solid ${pmeta.color}40`,
          borderRadius: 6,
          padding: '0.5rem 0.75rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>{pmeta.emoji}</span>
        <div>
          <span
            style={{
              fontWeight: 700,
              color: pmeta.color,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
            }}
          >
            {pmeta.label}
          </span>
          <span
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.7rem',
              marginLeft: '0.5rem',
            }}
          >
            {pmeta.desc}
          </span>
        </div>
      </div>

      {/* Summary strip */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {latestValues.map((lv) => (
          <div
            key={lv.sym}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: COLORS[lv.sym],
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {lv.sym}
            </span>
            <span
              style={{
                color:
                  lv.val > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
              }}
            >
              {lv.trend} {fmt(lv.val)} shares
            </span>
          </div>
        ))}
        {latestPrice != null && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: PRICE_COLOR,
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              SPY $
            </span>
            <span style={{ color: PRICE_COLOR }}>
              ${latestPrice.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Dual Y-Axis SVG Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', maxHeight: 260 }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => {
          const val = dpMin + frac * dpRange;
          return (
            <line
              key={frac}
              x1={PAD_L}
              y1={yDP(val)}
              x2={W - PAD_R}
              y2={yDP(val)}
              stroke="var(--border-primary)"
              strokeWidth={0.3}
            />
          );
        })}

        {/* Zero line */}
        {dpMin < 0 && dpMax > 0 && (
          <line
            x1={PAD_L}
            y1={yDP(0)}
            x2={W - PAD_R}
            y2={yDP(0)}
            stroke="var(--text-tertiary)"
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        )}

        {/* SPY Price line (rendered FIRST so DP lines sit on top) */}
        {hasPrice && pricePath && (
          <path
            d={pricePath}
            fill="none"
            stroke={PRICE_COLOR}
            strokeWidth={1.5}
            strokeDasharray="6,3"
            strokeLinecap="round"
            opacity={0.8}
          />
        )}

        {/* DP Position lines */}
        {dpPaths.map(({ sym, d }) => (
          <path
            key={sym}
            d={d}
            fill="none"
            stroke={COLORS[sym]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* End labels — DP */}
        {dpPaths.map(({ sym, lastY }) => (
          <text
            key={`lbl-${sym}`}
            x={PAD_L + chartW + 4}
            y={lastY + 4}
            fontSize={9}
            fill={COLORS[sym]}
            fontWeight={700}
          >
            {sym}
          </text>
        ))}

        {/* Right Y-axis — Price labels */}
        {hasPrice && (
          <>
            <text
              x={W - 4}
              y={yPrice(priceMax) + 3}
              fontSize={7}
              fill={PRICE_COLOR}
              textAnchor="end"
              opacity={0.7}
            >
              ${priceMax.toFixed(0)}
            </text>
            <text
              x={W - 4}
              y={yPrice(priceMin) + 3}
              fontSize={7}
              fill={PRICE_COLOR}
              textAnchor="end"
              opacity={0.7}
            >
              ${priceMin.toFixed(0)}
            </text>
            <text
              x={W - 4}
              y={yPrice((priceMax + priceMin) / 2) + 3}
              fontSize={7}
              fill={PRICE_COLOR}
              textAnchor="end"
              opacity={0.7}
            >
              ${((priceMax + priceMin) / 2).toFixed(0)}
            </text>
            {/* Right axis line */}
            <line
              x1={PAD_L + chartW}
              y1={PAD_T}
              x2={PAD_L + chartW}
              y2={PAD_T + chartH}
              stroke={PRICE_COLOR}
              strokeWidth={0.5}
              opacity={0.3}
            />
          </>
        )}

        {/* Date labels */}
        {labelIndices.map((idx) => {
          if (idx >= sortedDates.length) return null;
          const label = sortedDates[idx]?.slice(5);
          return (
            <text
              key={idx}
              x={xPos(idx)}
              y={H - 5}
              fontSize={8}
              fill="var(--text-tertiary)"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6rem',
          color: 'var(--text-tertiary)',
          marginTop: '0.3rem',
        }}
      >
        <span>← DP position (shares) — solid lines</span>
        <span>SPY price ($) — dashed red line →</span>
      </div>
    </AXLFICard>
  );
}
