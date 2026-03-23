/**
 * AXLFI Intelligence — Page Shell
 *
 * Thin orchestrator that fetches all AXLFI data in parallel
 * and delegates rendering to individual widget components.
 *
 * Components live in: components/axlfi/
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { axlfiApi } from '../lib/api';
import { useIntradaySnapshot } from '../hooks/useIntradaySnapshot';

import {
  MarketRegime,
  IndexSnapshot,
  TacticalPositions,
  OptionWallsPanel,
  InstitutionalSignals,
  MarketMovers,
  ShortVolumeProfile,
  ForwardReturns,
  KillChainTable,
  WhaleTracker,
  OIDistribution,
} from '../components/axlfi';

export function AXLFIIntel() {
  const [searchParams] = useSearchParams();
  const focusedSymbol = searchParams.get('symbol')?.toUpperCase() || null;
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

  // Thesis awareness — poll intraday snapshot
  const { snapshot: intradaySnap } = useIntradaySnapshot();
  const thesisValid = intradaySnap ? (intradaySnap.thesis_valid || !intradaySnap.market_open) : true;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
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
        {/* Focused Symbol Banner (from Brief cross-link) */}
        {focusedSymbol && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.9rem' }}>
              🔍 Viewing intelligence for {focusedSymbol} — linked from Today's Brief
            </span>
          </div>
        )}
        {/* Thesis Invalid Banner */}
        {!thesisValid && (
          <div style={{
            width: '100%',
            padding: '1rem 1.5rem',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            border: '2px solid #ef4444',
            borderRadius: '0.75rem',
            color: '#ffffff',
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.25)',
          }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              ⛔ THESIS INVALIDATED — signals below may be stale
            </div>
            {intradaySnap?.thesis_invalidation_reason && (
              <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                {intradaySnap.thesis_invalidation_reason}
              </div>
            )}
          </div>
        )}

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

        {/* Row 1: Regime + Snapshot + Tactical */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <MarketRegime regime={regime} />
          <IndexSnapshot snapshot={snapshot} />
          <TacticalPositions dashboard={dashboard} />
        </div>

        {/* Row 2: Option Walls Today */}
        <OptionWallsPanel spyWalls={spyWalls} qqqWalls={qqqWalls} iwmWalls={iwmWalls} />

        {/* Row 2.5: Whale Tracker — Institutional DP Position */}
        <div className="mb-6">
          <WhaleTracker dashboard={dashboard} />
        </div>

        {/* Row 2.7: Option Wall OI Distribution */}
        <div className="mb-6">
          <OIDistribution />
        </div>

        {/* Row 3: Signals + Movers + Short Vol */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <InstitutionalSignals data={signals} />
          <MarketMovers movers={movers} />
          <ShortVolumeProfile detail={spyDetail} />
        </div>

        {/* Row 4: Kill Chain — Signal Vet Table */}
        <div className="mb-6">
          <KillChainTable signalSymbols={signals?.signals ?? signals} thesisValid={thesisValid} />
        </div>

        {/* Row 5: Forward Returns Heatmap */}
        <div className="mb-6">
          <ForwardReturns clusters={clusters} />
        </div>
      </div>
    </main>
  );
}
