/**
 * AXLFI Intelligence — Full Page View
 *
 * The master AXLFI intelligence dashboard combining:
 *   - Market Regime (Tier 1-4)
 *   - Institutional Signals (Bullish/Bearish)
 *   - Market Movers (Volume Spikes, Sector Leaders)
 *   - Index Snapshot (SPY/QQQ/IWM/DIA)
 *   - Option Wall Matrix (Strike-Level OI)
 *   - Forward Returns Heatmap (SP500/NASDAQ100)
 *   - Tactical Positions (AXLFI Model)
 *   - Short Volume Profile (30-Day)
 */

import { useEffect, useState } from 'react';
import { axlfiApi } from '../lib/api';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function fmt(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(decimals);
}

function pct(n: number): string {
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2)}%`;
}

const TIER_COLORS: Record<number, string> = {
  1: '#00d4ff', // Calm - Cyan 
  2: '#ffd700', // Warning - Gold
  3: '#ff9500', // High - Orange
  4: '#ff3366', // Extreme - Red
};

const TIER_LABELS: Record<number, string> = {
  1: 'CALM',
  2: 'WARNING',
  3: 'HIGH',
  4: 'EXTREME',
};

/* ── Card Container ───────────────────────────────────────────────────── */

function Card({ title, icon, children, className = '' }: {
  title: string; icon: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-bg-secondary rounded-xl border border-border-subtle p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── Market Regime Widget ─────────────────────────────────────────────── */

function MarketRegime({ regime }: { regime: any }) {
  if (!regime) {
    return (
      <Card title="Market Regime" icon="🌡️">
        <div className="text-center py-4">
          <span className="text-text-muted text-sm">No Active Regime Alert</span>
        </div>
      </Card>
    );
  }

  const tier = regime.current_regime || 1;
  const color = TIER_COLORS[tier] || '#00d4ff';
  const label = regime.tier_label || TIER_LABELS[tier] || 'UNKNOWN';

  return (
    <Card title="Market Regime" icon="🌡️">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold" style={{ color }}>{label}</div>
          <div className="text-text-muted text-xs mt-1">
            Regime {tier} • {regime.date ? new Date(regime.date).toLocaleDateString() : '—'}
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(t => (
            <div
              key={t}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
              style={{
                background: t === tier ? TIER_COLORS[t] : 'rgba(255,255,255,0.05)',
                color: t === tier ? '#0a0a0f' : 'rgba(255,255,255,0.3)',
                boxShadow: t === tier ? `0 0 12px ${TIER_COLORS[t]}40` : 'none',
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ── Index Snapshot Widget ─────────────────────────────────────────────── */

function IndexSnapshot({ snapshot }: { snapshot: any }) {
  if (!snapshot?.market_snapshot) return null;
  const indices = Object.values(snapshot.market_snapshot) as any[];

  return (
    <Card title="Market Snapshot" icon="📈">
      <div className="grid grid-cols-3 gap-3">
        {indices.map((idx: any) => (
          <div key={idx.symbol} className="bg-bg-tertiary rounded-lg p-3 text-center">
            <div className="text-xs text-text-muted font-medium">{idx.symbol}</div>
            <div className="text-lg font-bold text-text-primary mt-1">${idx.close?.toFixed(2)}</div>
            <div
              className="text-xs font-semibold mt-1"
              style={{ color: idx.change_pct < 0 ? '#ff3366' : '#00ff88' }}
            >
              {idx.change_pct >= 0 ? '+' : ''}{idx.change_pct?.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Institutional Signals Widget ──────────────────────────────────────── */

function InstitutionalSignals({ data }: { data: any }) {
  const signals = data?.signals || [];
  if (!signals.length) return null;

  return (
    <Card title="Institutional Signals" icon="⚡">
      <div className="space-y-2">
        {signals.map((sig: any, i: number) => {
          const isBullish = sig.dir === 1;
          return (
            <div key={i} className="flex items-center justify-between bg-bg-tertiary rounded-lg px-3 py-2">
              <span className="text-sm font-bold text-text-primary">{sig.symbol}</span>
              <div className="flex items-center gap-2">
                <span style={{ color: isBullish ? '#00ff88' : '#ff3366' }}>
                  {isBullish ? '▲' : '▼'}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: isBullish ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)',
                    color: isBullish ? '#00ff88' : '#ff3366',
                  }}
                >
                  {isBullish ? 'BULLISH' : 'BEARISH'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-text-muted mt-3 text-right">
        {signals.length} active signals • {data?.as_of ? new Date(data.as_of).toLocaleTimeString() : ''}
      </div>
    </Card>
  );
}

/* ── Tactical Positions Widget ─────────────────────────────────────────── */

function TacticalPositions({ dashboard }: { dashboard: any }) {
  const positions = dashboard?.tactical_allocation?.positions || [];
  if (!positions.length) return null;

  return (
    <Card title="AXLFI Tactical Positions" icon="🎯">
      <div className="space-y-2">
        {positions.map((pos: any, i: number) => (
          <div key={i} className="flex items-center justify-between bg-bg-tertiary rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-xs"
                style={{
                  background: pos.dir === 1 ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)',
                  color: pos.dir === 1 ? '#00ff88' : '#ff3366',
                }}
              >
                {pos.dir === 1 ? '↑' : '↓'}
              </span>
              <span className="text-sm font-bold text-text-primary">{pos.ticker}</span>
            </div>
            <span
              className="text-xs font-semibold uppercase"
              style={{ color: pos.position === 'long' ? '#00ff88' : '#ff3366' }}
            >
              {pos.position}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Today's Option Walls Widget ───────────────────────────────────────── */

function TodayWalls({ symbol, walls }: { symbol: string; walls: any }) {
  if (!walls) return null;

  return (
    <div className="bg-bg-tertiary rounded-lg p-4">
      <div className="text-xs text-text-muted font-medium mb-2">{symbol}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-text-muted">Call Wall</div>
          <div className="text-lg font-bold" style={{ color: '#ff3366' }}>${walls.call_wall}</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">POC</div>
          <div className="text-lg font-bold" style={{ color: '#ffd700' }}>${walls.poc}</div>
        </div>
        <div>
          <div className="text-xs text-text-muted">Put Wall</div>
          <div className="text-lg font-bold" style={{ color: '#00ff88' }}>${walls.put_wall}</div>
        </div>
      </div>
      {walls.call_wall_2 && (
        <div className="grid grid-cols-3 gap-2 text-center mt-2 pt-2 border-t border-border-subtle">
          <div className="text-xs text-text-muted">CW2: ${walls.call_wall_2}</div>
          <div className="text-xs text-text-muted">CW3: ${walls.call_wall_3}</div>
          <div className="text-xs text-text-muted">PW2: ${walls.put_wall_2}</div>
        </div>
      )}
    </div>
  );
}

/* ── Market Movers Widget ──────────────────────────────────────────────── */

function MarketMovers({ movers }: { movers: any }) {
  if (!movers) return null;

  const sectors = movers.sector_leaders_1d || [];
  const volumeGainers = movers.top_volume_gainers || [];
  const priceGainers = movers.top_price_gainers || [];
  const priceLosers = movers.top_price_losers || [];

  return (
    <Card title="Market Movers" icon="🔥">
      {/* Volume Spikes */}
      {volumeGainers.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Top Volume</div>
          <div className="space-y-1">
            {volumeGainers.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-primary font-medium">{item.ticker || item.symbol}</span>
                <span className="text-accent-blue text-xs">{fmt(item.volume || 0, 0)} vol</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Gainers */}
      {priceGainers.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Top Gainers</div>
          <div className="space-y-1">
            {priceGainers.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-primary font-medium">{item.ticker || item.symbol}</span>
                <span style={{ color: '#00ff88' }} className="text-xs font-semibold">
                  +{(item.change_pct || item.pct_change || 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Losers */}
      {priceLosers.length > 0 && (
        <div>
          <div className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wider">Top Losers</div>
          <div className="space-y-1">
            {priceLosers.slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-text-primary font-medium">{item.ticker || item.symbol}</span>
                <span style={{ color: '#ff3366' }} className="text-xs font-semibold">
                  {(item.change_pct || item.pct_change || 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── Forward Returns Heatmap Widget ────────────────────────────────────── */

function ForwardReturns({ clusters }: { clusters: any }) {
  const data = clusters?.data || [];
  if (!data.length) return null;

  // Sort by 20d return desc
  const sorted = [...data].sort((a: any, b: any) => (b['20d_forward_return'] || 0) - (a['20d_forward_return'] || 0));
  const top20 = sorted.slice(0, 20);

  function retColor(val: number): string {
    if (val > 0.05) return '#00ff88';
    if (val > 0.02) return 'rgba(0,255,136,0.7)';
    if (val > 0) return 'rgba(0,255,136,0.4)';
    if (val > -0.02) return 'rgba(255,51,102,0.4)';
    if (val > -0.05) return 'rgba(255,51,102,0.7)';
    return '#ff3366';
  }

  return (
    <Card title="Forward Returns Heatmap (SP500)" icon="📊" className="col-span-full">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left py-1 px-2">Ticker</th>
              <th className="text-right py-1 px-2">Price</th>
              <th className="text-right py-1 px-2">1D</th>
              <th className="text-right py-1 px-2">2D</th>
              <th className="text-right py-1 px-2">5D</th>
              <th className="text-right py-1 px-2">10D</th>
              <th className="text-right py-1 px-2">20D</th>
            </tr>
          </thead>
          <tbody>
            {top20.map((item: any, i: number) => (
              <tr key={i} className="border-t border-border-subtle hover:bg-bg-hover transition-colors">
                <td className="py-1.5 px-2 font-bold text-text-primary">{item.ticker}</td>
                <td className="py-1.5 px-2 text-right text-text-secondary">${item.close?.toFixed(2)}</td>
                {['1d', '2d', '5d', '10d', '20d'].map(tf => {
                  const val = item[`${tf}_forward_return`] || 0;
                  return (
                    <td key={tf} className="py-1.5 px-2 text-right font-mono font-semibold" style={{ color: retColor(val) }}>
                      {pct(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-text-muted mt-2 text-right">
        Showing top 20 of {data.length} tickers by 20D forward return
      </div>
    </Card>
  );
}

/* ── Short Volume Profile Widget ───────────────────────────────────────── */

function ShortVolumeProfile({ detail }: { detail: any }) {
  if (!detail?.individual_short_volume) return null;

  const sv = detail.individual_short_volume;
  const dates = detail.individual_dark_pool_position_data?.dates || [];
  const shortVol = sv.short_volume || [];
  const totalVol = sv.total_volume || [];
  const svPct = sv.short_volume_pct || [];
  const maxVol = Math.max(...totalVol, 1);

  return (
    <Card title={`${detail.symbol || 'SPY'} Short Volume (30D)`} icon="📉">
      <div className="space-y-1">
        {shortVol.slice(-15).map((_: any, i: number) => {
          const idx = shortVol.length - 15 + i;
          const svRatio = (shortVol[idx] || 0) / maxVol;
          const tvRatio = (totalVol[idx] || 0) / maxVol;
          const pctVal = svPct[idx] || 0;

          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-text-muted w-14 text-right shrink-0">
                {dates[idx] ? dates[idx].slice(5) : `D${idx}`}
              </span>
              <div className="flex-1 h-4 bg-bg-tertiary rounded overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 rounded opacity-30"
                  style={{ width: `${tvRatio * 100}%`, background: '#4a5568' }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded"
                  style={{ width: `${svRatio * 100}%`, background: '#ff3366' }}
                />
              </div>
              <span className="text-text-secondary w-10 text-right font-mono shrink-0">
                {pctVal.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-text-muted mt-3">
        <span>■ Short Volume  ■ Total Volume</span>
        <span>Latest: {svPct[svPct.length - 1]?.toFixed(1)}% SV</span>
      </div>
    </Card>
  );
}


/* ══════════════════════════════════════════════════════════════════════ */
/* ══  MAIN PAGE COMPONENT  ═════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════ */

export function AXLFIIntel() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [signals, setSignals] = useState<any>(null);
  const [regime, setRegime] = useState<any>(null);
  const [movers, setMovers] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [clusters, setClusters] = useState<any>(null);
  const [spyWalls, setSpyWalls] = useState<any>(null);
  const [qqqWalls, setQqqWalls] = useState<any>(null);
  const [iwmWalls, setIwmWalls] = useState<any>(null);
  const [spyDetail, setSpyDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Fire all requests in parallel
        const [
          dashRes, sigRes, regRes, movRes, snapRes, clusterRes,
          spyW, qqqW, iwmW, spyD
        ] = await Promise.allSettled([
          axlfiApi.dashboard(),
          axlfiApi.signals(),
          axlfiApi.regime(),
          axlfiApi.movers(),
          axlfiApi.snapshot(),
          axlfiApi.clusters('sp500'),
          axlfiApi.wallsToday('SPY'),
          axlfiApi.wallsToday('QQQ'),
          axlfiApi.wallsToday('IWM'),
          axlfiApi.detail('SPY', 30),
        ]);

        if (!mounted) return;

        if (dashRes.status === 'fulfilled') setDashboard(dashRes.value);
        if (sigRes.status === 'fulfilled') setSignals(sigRes.value);
        if (regRes.status === 'fulfilled') setRegime((regRes.value as any)?.regime);
        if (movRes.status === 'fulfilled') setMovers(movRes.value);
        if (snapRes.status === 'fulfilled') setSnapshot(snapRes.value);
        if (clusterRes.status === 'fulfilled') setClusters(clusterRes.value);
        if (spyW.status === 'fulfilled') setSpyWalls(spyW.value);
        if (qqqW.status === 'fulfilled') setQqqWalls(qqqW.value);
        if (iwmW.status === 'fulfilled') setIwmWalls(iwmW.value);
        if (spyD.status === 'fulfilled') setSpyDetail(spyD.value);

      } catch (e: any) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    // Auto-refresh every 5 min
    const interval = setInterval(load, 300_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-primary p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🛰️</div>
          <div className="text-text-secondary text-sm">Loading AXLFI Intelligence...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <span>🛰️</span> AXLFI Intelligence
          </h1>
          <p className="text-text-secondary mt-2">
            Dark Pool Regime • Option Walls • Institutional Signals • Forward Returns
          </p>
          {error && (
            <div className="mt-2 text-xs text-accent-orange">⚠️ Partial load: {error}</div>
          )}
        </div>

        {/* Row 1: Regime + Snapshot + Tactical Positions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <MarketRegime regime={regime} />
          <IndexSnapshot snapshot={snapshot} />
          <TacticalPositions dashboard={dashboard} />
        </div>

        {/* Row 2: Option Walls Today */}
        <Card title="Option Walls — Today" icon="🧱" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TodayWalls symbol="SPY" walls={spyWalls} />
            <TodayWalls symbol="QQQ" walls={qqqWalls} />
            <TodayWalls symbol="IWM" walls={iwmWalls} />
          </div>
        </Card>

        {/* Row 3: Signals + Movers + Short Vol */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <InstitutionalSignals data={signals} />
          <MarketMovers movers={movers} />
          <ShortVolumeProfile detail={spyDetail} />
        </div>

        {/* Row 4: Forward Returns Heatmap (Full Width) */}
        <div className="mb-6">
          <ForwardReturns clusters={clusters} />
        </div>
      </div>
    </main>
  );
}
