/**
 * 📋 Today's Brief — Zero-click landing page (Orchestrator).
 * 
 * Manager-approved hierarchy:
 *   1. VERDICT (giant, color-coded) — first 3 words answer "trade or not?"
 *   2. One-sentence summary (the most valuable line)
 *   3. Thesis status (SPY position vs wall, plain English)
 *   4. Approved names (green cards with confidence + TA, expandable slugs)
 *   5. Blocked names (red cards with explanations)
 *   6. Data warnings (yellow banner — volume anomalies, DP sign issues)
 *   7. Index strip (SPY/QQQ/IWM with DP sparklines)
 *   8. Gate Health (bottom)
 * 
 * All rendering delegated to brief/ components.
 * All styles in brief.css.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/brief.css';

import { VerdictBanner } from '../components/brief/VerdictBanner';
import { ThesisBar } from '../components/brief/ThesisBar';
import { SignalPills } from '../components/brief/SignalPills';
import { TickerCard, type TickerData } from '../components/brief/TickerCard';
import { DataWarnings } from '../components/brief/DataWarnings';
import { IndexStrip } from '../components/brief/IndexStrip';
import { GateHealthBar } from '../components/brief/GateHealthBar';
import { MasterBriefPanels } from '../components/brief/MasterBriefPanels';

const MONITOR_URL = import.meta.env.VITE_MONITOR_URL || 
  (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ── Interfaces ────────────────────────────────────────────

interface Brief {
  date: string;
  generated_at: string;
  verdict: string;
  signals: { bias: string; reason: string }[];
  spy: {
    price: number;
    call_wall: number;
    put_wall: number;
    delta_from_wall: number;
    trend: string;
    close_defense: string;
    close_vol_ratio: number;
  };
  qqq: { call_wall: number; put_wall: number; sv_direction: string; sv_read: string };
  iwm: { call_wall: number; put_wall: number };
  volume_profile: {
    pattern: string;
    first_hour_pct: number;
    front_back_ratio: number;
    data_error?: boolean;
  };
  approved_tickers: TickerData[];
  blocked_tickers: TickerData[];
  summary: string;
  data_warnings?: string[];
  wall_breached?: boolean;
  wall_breach_details?: { spy_price: number; call_wall: number; delta: number; breach_time: string } | null;
}

interface GateHealth {
  win_rate_last_n: number;
  blocked_vs_allowed: string;
  avg_r_last_n: number;
  total_signals: number;
  blocked_count: number;
  allowed_count: number;
  wins: number;
  losses: number;
  n: number;
}

interface GateSignal {
  ticker: string;
  direction: string;
  confidence: number;
  status: string;
}

interface TAConsensus {
  consensus: string;
}

interface ClusterEntry {
  ticker: string;
  '5d_forward_return': number;
}

// ── Component ─────────────────────────────────────────────

export function TodaysBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateHealth, setGateHealth] = useState<GateHealth | null>(null);
  const [gateHealthError, setGateHealthError] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);

  // Enrichment: confidence scores, TA consensus, forward returns
  const [gateSignals, setGateSignals] = useState<GateSignal[]>([]);
  const [taData, setTaData] = useState<Record<string, string>>({});
  const [clusterData, setClusterData] = useState<Record<string, number>>({});

  const navigate = useNavigate();

  // ── Fetch brief ────────────────────────────────────────
  const fetchBrief = useCallback(() => {
    fetch(`${MONITOR_URL}/morning-brief`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setBrief(data);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { fetchBrief(); }, [fetchBrief]);

  // Auto-poll every 60s during market hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const etH = now.getUTCHours() - 4;
      if (etH >= 9 && etH <= 16) fetchBrief();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchBrief]);

  // ── Gate health ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/gate/health?n=20`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setGateHealth)
      .catch(() => setGateHealthError(true));
  }, []);

  // ── Market open check ─────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/intraday/snapshot`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.market_open) setMarketOpen(true); })
      .catch(() => {});
  }, []);

  // ── Enrichment: gate signals, TA, clusters ─────────────
  useEffect(() => {
    if (!brief) return;
    const allTickers = [
      ...brief.approved_tickers.map(t => t.ticker),
      ...brief.blocked_tickers.map(t => t.ticker),
    ];
    if (allTickers.length === 0) return;

    // Gate signals (confidence scores)
    fetch(`${MONITOR_URL}/data/gate_signals_today.json`)
      .then(r => r.ok ? r.json() : [])
      .then(signals => { if (Array.isArray(signals)) setGateSignals(signals); })
      .catch(() => {});

    // TA consensus for each ticker (parallel)
    const taPromises = allTickers.map(sym =>
      fetch(`${API_URL}/ta/${sym}/consensus`)
        .then(r => r.ok ? r.json() : null)
        .then((d: TAConsensus | null) => [sym, d?.consensus || ''] as const)
        .catch(() => [sym, ''] as const)
    );
    Promise.all(taPromises).then(entries => {
      const map: Record<string, string> = {};
      entries.forEach(([sym, consensus]) => { if (consensus) map[sym] = consensus; });
      setTaData(map);
    });

    // Cluster forward returns
    fetch(`${API_URL}/axlfi/clusters?universe=sp500`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(d => {
        const map: Record<string, number> = {};
        (d.data || []).forEach((entry: ClusterEntry) => {
          if (allTickers.includes(entry.ticker)) {
            map[entry.ticker] = entry['5d_forward_return'];
          }
        });
        setClusterData(map);
      })
      .catch(() => {});
  }, [brief]);

  // ── Loading / Error states ─────────────────────────────
  if (loading) return (
    <div className="brief-loading">
      <div>
        <div className="brief-loading__icon">📋</div>
        <div>Loading today's brief...</div>
      </div>
    </div>
  );

  if (error || !brief) return (
    <div className="brief-empty">
      <div className="brief-empty__icon">⏳</div>
      <div className="brief-empty__title">No brief generated yet</div>
      <div className="brief-empty__sub">
        {error || 'The pre-market scheduler runs at 07:45 ET. Check back then.'}
      </div>
    </div>
  );

  // ── Derive display values ─────────────────────────────
  const dataWarnings: string[] = [...(brief.data_warnings || [])];
  if (brief.volume_profile.data_error) {
    dataWarnings.push(`Volume ratio anomaly (${brief.volume_profile.front_back_ratio}x) — distribution tag unreliable today`);
  }
  brief.approved_tickers.forEach(t => {
    if (t.flag === 'DP_WARNING') {
      dataWarnings.push(`${t.ticker} DP sign unverified — ${t.dp_label || 'confirm before entry'}`);
    }
  });

  // Lookup helpers
  function getConfidence(sym: string): number | undefined {
    const sig = gateSignals.find(s => s.ticker === sym);
    return sig?.confidence;
  }

  return (
    <div className="brief-container">
      {/* Market open redirect */}
      {marketOpen && (
        <div className="market-open-banner" onClick={() => navigate('/live')}>
          <span className="market-open-banner__text">🛡️ Market is open — View Live Session for real-time thesis status</span>
          <span className="market-open-banner__arrow">→</span>
        </div>
      )}

      {/* 1. VERDICT */}
      <VerdictBanner
        verdict={brief.verdict}
        summary={brief.summary}
        wallBreached={brief.wall_breached === true}
        wallBreachDetails={brief.wall_breach_details}
      />

      {/* 1.5 UNIFIED INTELLIGENCE — Master Brief Panels */}
      <MasterBriefPanels />

      {/* 2. THESIS STATUS */}
      <ThesisBar spy={brief.spy} />

      {/* 3. SIGNAL PILLS */}
      <SignalPills signals={brief.signals} />

      {/* 4. APPROVED NAMES */}
      {brief.approved_tickers.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="ticker-section__title ticker-section__title--approved">
            ✅ APPROVED — GATED SIGNALS
          </div>
          <div className="ticker-grid">
            {brief.approved_tickers.map(t => (
              <TickerCard
                key={t.ticker}
                ticker={t}
                type="approved"
                confidence={getConfidence(t.ticker)}
                taConsensus={taData[t.ticker]}
                forwardReturn5d={clusterData[t.ticker]}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. BLOCKED NAMES */}
      {brief.blocked_tickers.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="ticker-section__title ticker-section__title--blocked">
            🚫 BLOCKED — DP DIVERGING
          </div>
          <div className="ticker-grid">
            {brief.blocked_tickers.map(t => (
              <TickerCard
                key={t.ticker}
                ticker={t}
                type="blocked"
                confidence={getConfidence(t.ticker)}
                taConsensus={taData[t.ticker]}
                forwardReturn5d={clusterData[t.ticker]}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. DATA WARNINGS */}
      <DataWarnings warnings={dataWarnings} />

      {/* 7. VOLUME CONTEXT (suppressed if DATA_ERROR) */}
      {!brief.volume_profile.data_error && (
        <div className="volume-row">
          <span className="volume-row__label">Volume Profile</span>
          <span className={`volume-row__pattern ${brief.volume_profile.pattern === 'ACCUMULATION' ? 'volume-row__pattern--acc' : 'volume-row__pattern--dist'}`}>
            {brief.volume_profile.pattern}
          </span>
          <span className="volume-row__detail">
            First hour: {brief.volume_profile.first_hour_pct}% · Ratio: {brief.volume_profile.front_back_ratio}x
          </span>
        </div>
      )}

      {/* 8. INDEX STRIP */}
      <IndexStrip brief={brief} />

      {/* 9. GATE HEALTH */}
      <GateHealthBar gateHealth={gateHealth} gateHealthError={gateHealthError} />

      {/* Footer */}
      <div className="brief-footer">
        {brief.date} · Generated {brief.generated_at}
      </div>
    </div>
  );
}
