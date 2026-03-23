/**
 * Kill Chain Table — Weapon 1
 *
 * Calls /earnings-intel with signal tickers and renders:
 * ticker | DP trend direction | short vol % | signal | call wall | put wall
 *
 * One endpoint. One table. Instant per-ticker vet.
 */

import { useEffect, useState } from 'react';
import { axlfiApi } from '../../lib/api';
import { AXLFICard } from './shared';

interface KillChainProps {
  /** Signal tickers from /signals, e.g. [{dir:1, symbol:"AMAT"}, ...] */
  signalSymbols: { dir: number; symbol: string }[] | null;
  /** When false, all green BULL indicators become grey + "(THESIS INVALID)" */
  thesisValid?: boolean;
}

export function KillChainTable({ signalSymbols, thesisValid = true }: KillChainProps) {
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!signalSymbols?.length) return;

    const tickers = signalSymbols.map((s) => s.symbol);
    setLoading(true);
    setErr(null);

    axlfiApi
      .earningsIntel(tickers)
      .then((data: any) => {
        setIntel(data);
      })
      .catch((e: any) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [signalSymbols]);

  if (!signalSymbols?.length) {
    return (
      <AXLFICard title="Kill Chain" icon="🎯">
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          No active signals
        </p>
      </AXLFICard>
    );
  }

  // Build lookup: symbol → dir
  const dirMap: Record<string, number> = {};
  signalSymbols.forEach((s) => {
    dirMap[s.symbol] = s.dir;
  });

  // Extract SPY walls from intel
  const spyWalls = intel?.SPY_walls;
  const qqqWalls = intel?.QQQ_walls;
  const regime = intel?._regime;

  // Get ticker rows (skip _regime, _signals, SPY_walls, QQQ_walls)
  const tickerKeys = intel
    ? Object.keys(intel).filter(
        (k) => !k.startsWith('_') && !k.includes('_walls')
      )
    : [];

  return (
    <AXLFICard title="Kill Chain — Signal Vet" icon="🎯">
      {loading && (
        <p
          style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.8rem',
            textAlign: 'center',
          }}
        >
          Loading intel...
        </p>
      )}
      {err && (
        <p style={{ color: 'var(--accent-orange)', fontSize: '0.75rem' }}>
          ⚠️ {err}
        </p>
      )}

      {intel && (
        <>
          {/* Regime + Walls context strip */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '0.75rem',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
            }}
          >
            {regime && (
              <span>
                VIX: {regime.tier_label || `Tier ${regime.current_regime}`}
              </span>
            )}
            {spyWalls && (
              <span>
                SPY Walls: {spyWalls.put_wall}p / {spyWalls.poc} POC /{' '}
                {spyWalls.call_wall}c
              </span>
            )}
            {qqqWalls && (
              <span>
                QQQ Walls: {qqqWalls.put_wall}p / {qqqWalls.poc} POC /{' '}
                {qqqWalls.call_wall}c
              </span>
            )}
          </div>

          {/* Kill chain table */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.75rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-primary)',
                    color: 'var(--text-tertiary)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '0.4rem 0.5rem' }}>Ticker</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Signal</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>DP Trend (5d)</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>SV%</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>52w Range</th>
                  <th style={{ padding: '0.4rem 0.5rem' }}>Sector</th>
                </tr>
              </thead>
              <tbody>
                {tickerKeys.map((sym) => {
                  const row = intel[sym];
                  if (!row || row.status !== 'live') return null;

                  const dir = dirMap[sym];
                  const trend5d = row.trend_5d || [];
                  const firstShares = trend5d[0]?.shares ?? 0;
                  const lastShares =
                    trend5d[trend5d.length - 1]?.shares ?? 0;
                  const trendDir =
                    lastShares > firstShares
                      ? '📈'
                      : lastShares < firstShares
                      ? '📉'
                      : '➡️';
                  const trendDelta = lastShares - firstShares;

                  // Divergence: signal says BULL but DP trend says SELL
                  const isDiverging = dir === 1 && trendDelta < 0;

                  return (
                    <tr
                      key={sym}
                      style={{
                        borderBottom: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)',
                        background: isDiverging
                          ? 'rgba(239, 68, 68, 0.08)'
                          : 'transparent',
                      }}
                    >
                      {/* Ticker + Price */}
                      <td
                        style={{
                          padding: '0.5rem',
                          fontWeight: 700,
                        }}
                      >
                        {sym}
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            fontWeight: 400,
                            marginLeft: '0.4rem',
                            fontSize: '0.7rem',
                          }}
                        >
                          ${row.close?.toFixed(2)}
                          <span
                            style={{
                              color:
                                (row.change_pct ?? 0) >= 0
                                  ? 'var(--accent-green)'
                                  : 'var(--accent-red)',
                              marginLeft: '0.3rem',
                            }}
                          >
                            {(row.change_pct ?? 0) >= 0 ? '+' : ''}
                            {row.change_pct?.toFixed(2)}%
                          </span>
                        </span>
                      </td>

                      {/* Signal direction + Divergence flag + Thesis check */}
                      <td style={{ padding: '0.5rem' }}>
                        <span
                          style={{
                            color:
                              !thesisValid
                                ? 'var(--text-tertiary)'
                                : dir === 1
                                  ? 'var(--accent-green)'
                                  : 'var(--accent-red)',
                            fontWeight: 600,
                            opacity: thesisValid ? 1 : 0.5,
                          }}
                        >
                          {dir === 1 ? '▲ BULL' : '▼ BEAR'}
                          {!thesisValid && (
                            <span style={{
                              color: 'var(--text-tertiary)',
                              fontWeight: 400,
                              fontSize: '0.6rem',
                              marginLeft: '0.3rem',
                            }}>
                              (THESIS INVALID)
                            </span>
                          )}
                        </span>
                        {isDiverging && (
                          <span
                            style={{
                              color: '#ef4444',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              marginLeft: '0.4rem',
                              padding: '0.1rem 0.3rem',
                              background: 'rgba(239, 68, 68, 0.15)',
                              borderRadius: 3,
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            ⚠️ DP DIVERGING
                          </span>
                        )}
                      </td>

                      {/* DP Trend 5d */}
                      <td style={{ padding: '0.5rem' }}>
                        <span>{trendDir} </span>
                        <span
                          style={{
                            color:
                              trendDelta > 0
                                ? 'var(--accent-green)'
                                : trendDelta < 0
                                ? 'var(--accent-red)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {trendDelta > 0 ? '+' : ''}
                          {(trendDelta / 1e6).toFixed(1)}M
                        </span>
                      </td>

                      {/* Short Volume % */}
                      <td
                        style={{
                          padding: '0.5rem',
                          color:
                            (row.short_volume_pct ?? 0) > 60
                              ? 'var(--accent-orange)'
                              : 'var(--text-secondary)',
                        }}
                      >
                        {row.short_volume_pct?.toFixed(1)}%
                      </td>

                      {/* 52w Range */}
                      <td
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.7rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {row['52w_range'] || '—'}
                      </td>

                      {/* Sector */}
                      <td
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.7rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {row.sector || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AXLFICard>
  );
}
