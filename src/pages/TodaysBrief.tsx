/**
 * 📋 Today's Brief — Zero-click landing page.
 * 
 * Trader opens the app and sees:
 *   1. Verdict banner (BUY/SELL/CAUTION)
 *   2. SPY wall status + close defense 
 *   3. Index summary (SPY/QQQ/IWM)
 *   4. Approved tickers (green cards)
 *   5. Blocked tickers (red cards)
 *   6. Summary sentence
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const MONITOR_URL = import.meta.env.VITE_MONITOR_URL || 
  (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
  qqq: {
    call_wall: number;
    put_wall: number;
    sv_direction: string;
    sv_read: string;
  };
  iwm: {
    call_wall: number;
    put_wall: number;
  };
  volume_profile: {
    pattern: string;
    first_hour_pct: number;
    front_back_ratio: number;
  };
  approved_tickers: {
    ticker: string;
    sv_pct: number;
    bias: string;
    dp_position_dollars: number;
    reason: string;
    flag: string;
  }[];
  blocked_tickers: {
    ticker: string;
    sv_pct: number;
    bias: string;
    dp_position_dollars: number;
    reason: string;
    flag: string;
  }[];
  summary: string;
  wall_breached?: boolean;
  wall_breach_details?: {
    spy_price: number;
    call_wall: number;
    delta: number;
    breach_time: string;
  } | null;
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

const VERDICT_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  STRONG_BUY: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#10b981', glow: '0 0 40px rgba(16, 185, 129, 0.3)' },
  BUY: { bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)', text: '#34d399', glow: '0 0 30px rgba(52, 211, 153, 0.2)' },
  NEUTRAL: { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8', glow: 'none' },
  CAUTION: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)', text: '#fbbf24', glow: '0 0 30px rgba(251, 191, 36, 0.2)' },
  SELL: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444', glow: '0 0 40px rgba(239, 68, 68, 0.3)' },
};

function formatDollars(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

export function TodaysBrief() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateHealth, setGateHealth] = useState<GateHealth | null>(null);
  const [gateHealthError, setGateHealthError] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const navigate = useNavigate();

  // ── Fetch brief ─────────────────────────────────────────────
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

  // Initial fetch
  useEffect(() => { fetchBrief(); }, [fetchBrief]);

  // ── Gap 2: Auto-poll every 60s during market hours ──────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const utcH = now.getUTCHours();
      const etH = utcH - 4; // rough ET conversion (EDT)
      if (etH >= 9 && etH <= 16) {
        fetchBrief();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchBrief]);

  // ── Gap 4: Gate Health badge ────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/gate/health?n=20`)
      .then(r => {
        if (!r.ok) throw new Error('Gate health unavailable');
        return r.json();
      })
      .then(data => setGateHealth(data))
      .catch(() => setGateHealthError(true));
  }, []);

  // ── Task 4.1: Check if market is open, show redirect banner ─
  useEffect(() => {
    fetch(`${API_URL}/intraday/snapshot`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.market_open) {
          setMarketOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#94a3b8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>📋</div>
        <div>Loading today's brief...</div>
      </div>
    </div>
  );

  if (error || !brief) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
      <div style={{ fontSize: '1.1rem' }}>No brief generated yet</div>
      <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#64748b' }}>
        {error || 'The pre-market scheduler runs at 07:45 ET. Check back then.'}
      </div>
    </div>
  );

  // ── Gap 5: Override verdict style if wall breached ──────────
  const wallBreached = brief.wall_breached === true;
  const vs = wallBreached
    ? VERDICT_STYLES.SELL  // Force RED styling when wall breached
    : (VERDICT_STYLES[brief.verdict] || VERDICT_STYLES.NEUTRAL);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

      {/* ── Task 4.1: Market Open → Go to Live Session banner ── */}
      {marketOpen && (
        <div
          onClick={() => navigate('/live')}
          style={{
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <span style={{ color: '#60a5fa', fontWeight: 600, fontSize: '0.9rem' }}>
            🛡️ Market is open — View Live Session for real-time thesis status
          </span>
          <span style={{ color: '#3b82f6', fontSize: '1.2rem' }}>→</span>
        </div>
      )}

      {/* ── Gap 5: Wall Breach Alert Banner ─────────────────── */}
      {wallBreached && brief.wall_breach_details && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.25rem' }}>
            ⚠️ SPY WALL BREACH
          </div>
          <div style={{ fontSize: '0.85rem', color: '#fca5a5' }}>
            SPY at ${brief.wall_breach_details.spy_price} — ${Math.abs(brief.wall_breach_details.delta).toFixed(2)} below call wall ${brief.wall_breach_details.call_wall} — detected {brief.wall_breach_details.breach_time}
          </div>
        </div>
      )}

      {/* ── Verdict Banner ────────────────────────────────────── */}
      <div style={{
        background: vs.bg,
        border: `1px solid ${vs.border}`,
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        boxShadow: vs.glow,
      }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '0.5rem' }}>
          {brief.date} · {brief.generated_at}
        </div>
        <div style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: vs.text,
          letterSpacing: '0.08em',
          marginBottom: '0.5rem',
        }}>
          {wallBreached ? '⚠️ BREACH' : brief.verdict}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          {brief.summary}
        </div>
      </div>

      {/* ── Signal Breakdown ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', justifyContent: 'center' }}>
        {brief.signals.map((s, i) => (
          <div key={i} style={{
            padding: '0.4rem 0.75rem',
            borderRadius: '2rem',
            fontSize: '0.8rem',
            background: s.bias === 'BULLISH' ? 'rgba(52, 211, 153, 0.1)' : s.bias === 'BEARISH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(251, 191, 36, 0.1)',
            border: `1px solid ${s.bias === 'BULLISH' ? 'rgba(52, 211, 153, 0.25)' : s.bias === 'BEARISH' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(251, 191, 36, 0.25)'}`,
            color: s.bias === 'BULLISH' ? '#34d399' : s.bias === 'BEARISH' ? '#ef4444' : '#fbbf24',
          }}>
            {s.bias === 'BULLISH' ? '▲' : s.bias === 'BEARISH' ? '▼' : '◆'} {s.reason}
          </div>
        ))}
      </div>

      {/* ── Index Cards ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* SPY */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>SPY</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '1rem',
              background: brief.spy.close_defense === 'DEFENDED' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: brief.spy.close_defense === 'DEFENDED' ? '#34d399' : '#ef4444',
            }}>
              {brief.spy.close_defense}
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0' }}>${brief.spy.price}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Wall: ${brief.spy.call_wall} · +${brief.spy.delta_from_wall} above
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
            Close vol: {brief.spy.close_vol_ratio}x avg
          </div>
        </div>

        {/* QQQ */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>QQQ</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '1rem',
              background: brief.qqq.sv_direction === 'RISING' ? 'rgba(52, 211, 153, 0.15)' : brief.qqq.sv_direction === 'FALLING' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(148, 163, 184, 0.1)',
              color: brief.qqq.sv_direction === 'RISING' ? '#34d399' : brief.qqq.sv_direction === 'FALLING' ? '#fbbf24' : '#94a3b8',
            }}>
              SV {brief.qqq.sv_direction}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            Call: ${brief.qqq.call_wall} · Put: ${brief.qqq.put_wall}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            {brief.qqq.sv_read}
          </div>
        </div>

        {/* IWM */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
        }}>
          <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '0.75rem' }}>IWM</div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
            Call: ${brief.iwm.call_wall} · Put: ${brief.iwm.put_wall}
          </div>
        </div>
      </div>

      {/* ── Volume Context ────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Volume Profile</span>
        <span style={{
          fontSize: '0.8rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '1rem',
          background: brief.volume_profile.pattern === 'ACCUMULATION' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: brief.volume_profile.pattern === 'ACCUMULATION' ? '#34d399' : '#ef4444',
        }}>
          {brief.volume_profile.pattern}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          First hour: {brief.volume_profile.first_hour_pct}% · Ratio: {brief.volume_profile.front_back_ratio}x
        </span>
      </div>

      {/* ── Gap 4: Gate Health Badge ──────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Gate Health</span>
        {gateHealthError ? (
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Unavailable</span>
        ) : gateHealth ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.8rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '1rem',
              background: gateHealth.win_rate_last_n >= 50 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: gateHealth.win_rate_last_n >= 50 ? '#34d399' : '#ef4444',
            }}>
              WR: {gateHealth.win_rate_last_n.toFixed(0)}%
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {gateHealth.blocked_vs_allowed}
            </span>
            <span style={{
              fontSize: '0.8rem',
              color: gateHealth.avg_r_last_n >= 0 ? '#34d399' : '#ef4444',
            }}>
              Avg: {gateHealth.avg_r_last_n.toFixed(2)}R
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading...</span>
        )}
      </div>

      {/* ── Approved Tickers ──────────────────────────────────── */}
      {brief.approved_tickers.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#34d399', marginBottom: '0.75rem', fontWeight: 600 }}>
            ✅ APPROVED — GATED SIGNALS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
            {brief.approved_tickers.map(t => (
              <div key={t.ticker} style={{
                background: 'rgba(52, 211, 153, 0.05)',
                border: '1px solid rgba(52, 211, 153, 0.15)',
                borderRadius: '0.75rem',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>{t.ticker}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '1rem',
                    background: t.flag === 'CLEAN' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                    color: t.flag === 'CLEAN' ? '#34d399' : '#94a3b8',
                  }}>{t.flag}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SV: {t.sv_pct}% · DP: {formatDollars(t.dp_position_dollars)}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{t.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Blocked Tickers ───────────────────────────────────── */}
      {brief.blocked_tickers.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: '#ef4444', marginBottom: '0.75rem', fontWeight: 600 }}>
            🚫 BLOCKED — DP DIVERGING
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
            {brief.blocked_tickers.map(t => (
              <div key={t.ticker} style={{
                background: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                borderRadius: '0.75rem',
                padding: '1rem',
                opacity: 0.8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fca5a5' }}>{t.ticker}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                  }}>{t.flag}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SV: {t.sv_pct}% · DP: {formatDollars(t.dp_position_dollars)}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{t.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
