/**
 * SignalFeedGrid — Transforms live BrainReport data into signal cards.
 *
 * Data sources:
 *   - politician_details → CLUSTER_BUY cards (grouped by ticker)
 *   - finnhub_signals    → CONVERGENCE / DIVERGENCE cards
 *   - spouse_alerts      → SPOUSE_ALERT cards
 *
 * Zero hardcoded data. Every card is derived from the API.
 */

import type { BrainReport, FinnhubSignal, PoliticianDetail, SpouseAlert } from '../types';
import { TickerTag } from '../primitives/TickerTag';
import { IntensityBar } from '../primitives/IntensityBar';

/** Unified signal shape for the feed grid */
export interface UnifiedSignal {
  id: string;
  source: 'Politician' | 'FinnHub' | 'Spouse';
  action: string;
  tickers: string[];
  detail: string;
  intensity: number;
  impact: string;
  color: string;
  raw: PoliticianDetail | FinnhubSignal | SpouseAlert;
}

/** Map live API data → UnifiedSignal[] */
export function buildSignals(report: BrainReport): UnifiedSignal[] {
  const signals: UnifiedSignal[] = [];

  // 1. Politician cluster buys — group by ticker
  const tickerGroups: Record<string, PoliticianDetail[]> = {};
  for (const p of report.hidden_hands.politician_details) {
    if (p.is_routine) continue; // exclude DRIP trades
    if (!tickerGroups[p.ticker]) tickerGroups[p.ticker] = [];
    tickerGroups[p.ticker].push(p);
  }

  for (const [ticker, trades] of Object.entries(tickerGroups)) {
    const buys = trades.filter(t => t.type?.toLowerCase().includes('buy'));
    const sells = trades.filter(t => t.type?.toLowerCase().includes('sell'));
    const action = buys.length >= sells.length ? 'CLUSTER_BUY' : 'CLUSTER_SELL';
    const intensity = Math.min(100, trades.length * 25);

    signals.push({
      id: `pol-${ticker}-${trades.length}`,
      source: 'Politician',
      action,
      tickers: [ticker],
      detail: `${trades.length} trade(s): ${trades.map(t => t.name).join(', ')}`,
      intensity,
      impact: trades.length >= 3 ? 'HIGH' : trades.length >= 2 ? 'MEDIUM' : 'LOW',
      color: action === 'CLUSTER_BUY' ? '#a855f7' : '#f43f5e',
      raw: trades[0],
    });
  }

  // 2. Finnhub convergence/divergence
  for (const sig of (report.finnhub_signals || [])) {
    const isConvergence = sig.convergence?.includes('CONVERGENCE');
    const boost = sig.divergence_boost || 0;
    const intensity = Math.min(100, Math.abs(boost) * 20);

    signals.push({
      id: `fh-${sig.ticker}-${sig.convergence}`,
      source: 'FinnHub',
      action: isConvergence ? 'CONVERGENCE' : 'INSIDER_FADE',
      tickers: [sig.ticker],
      detail: sig.reasoning?.join(' · ') || sig.convergence,
      intensity,
      impact: boost >= 3 ? 'HIGH' : boost >= 1 ? 'MEDIUM' : 'LOW',
      color: isConvergence ? '#22d3ee' : '#f43f5e',
      raw: sig,
    });
  }

  // 3. Spouse alerts
  for (const sa of (report.spouse_alerts || [])) {
    signals.push({
      id: `sp-${sa.ticker}-${sa.politician}`,
      source: 'Spouse',
      action: 'SPOUSE_ALERT',
      tickers: [sa.ticker],
      detail: `${sa.politician} — ${sa.alert || `Spouse ${sa.type} ${sa.ticker}`}`,
      intensity: 70,
      impact: 'MEDIUM',
      color: '#f59e0b',
      raw: sa,
    });
  }

  // Sort by intensity descending
  signals.sort((a, b) => b.intensity - a.intensity);
  return signals;
}

/* ── Signal Card ────────────────────────────────────── */

interface SignalCardProps {
  signal: UnifiedSignal;
  onClick: (signal: UnifiedSignal) => void;
}

function SignalCard({ signal, onClick }: SignalCardProps) {
  return (
    <div
      className="signal-card"
      onClick={() => onClick(signal)}
      style={{ '--signal-color': signal.color } as React.CSSProperties}
    >
      <div className="signal-card__stripe" style={{ backgroundColor: signal.color }} />

      <div className="signal-card__header">
        <div className="signal-card__meta">
          <span className="signal-card__action">{signal.action}</span>
          <span className="signal-card__source">{signal.source}</span>
        </div>
        <span className={`signal-card__impact signal-card__impact--${signal.impact.toLowerCase()}`}>
          {signal.impact}
        </span>
      </div>

      <div className="signal-card__tickers">
        {signal.tickers.map(t => <TickerTag key={t} symbol={t} />)}
      </div>

      <p className="signal-card__detail">{signal.detail}</p>

      <div className="signal-card__bar">
        <IntensityBar value={signal.intensity} color={signal.color} />
      </div>
    </div>
  );
}

/* ── Feed Grid ──────────────────────────────────────── */

interface SignalFeedGridProps {
  report: BrainReport;
  onSignalClick: (signal: UnifiedSignal) => void;
}

export function SignalFeedGrid({ report, onSignalClick }: SignalFeedGridProps) {
  const signals = buildSignals(report);

  return (
    <div className="signal-feed">
      <div className="signal-feed__header">
        <div className="signal-feed__title-row">
          <span className="signal-feed__title">Signal Command Feed</span>
        </div>
        <div className="signal-feed__status">
          <span className="signal-feed__dot" />
          <span>Uplink Active</span>
        </div>
      </div>

      <div className="signal-feed__grid">
        {signals.length > 0 ? (
          signals.map(s => (
            <SignalCard key={s.id} signal={s} onClick={onSignalClick} />
          ))
        ) : (
          <div className="signal-feed__empty">
            No signals detected — waiting for data
          </div>
        )}
      </div>
    </div>
  );
}
