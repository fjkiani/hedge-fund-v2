/**
 * TickerCard — Approved/blocked ticker card with confidence score + TA badge.
 * Click expands the TickerSlug inline.
 */

import { useState } from 'react';
import { TickerSlug } from './TickerSlug';

export interface TickerData {
  ticker: string;
  sv_pct: number;
  bias: string;
  dp_position_dollars: number;
  dp_label?: string;
  dp_distributing?: boolean;
  reason: string;
  flag: string;
}

interface TickerCardProps {
  ticker: TickerData;
  type: 'approved' | 'blocked';
  confidence?: number;     // 0-1 from gate_signals_today.json
  taConsensus?: string;    // OVERBOUGHT | OVERSOLD | NEUTRAL from /ta/consensus
  forwardReturn5d?: number; // from clusters
}

function getCardClass(type: string, flag: string): string {
  if (type === 'blocked') return 'ticker-card ticker-card--blocked';
  if (flag === 'DP_WARNING') return 'ticker-card ticker-card--warning';
  return 'ticker-card ticker-card--approved';
}

function getFlagClass(flag: string): string {
  if (flag === 'CLEAN') return 'ticker-card__flag ticker-card__flag--clean';
  if (flag === 'DP_WARNING') return 'ticker-card__flag ticker-card__flag--warning';
  if (flag === 'DP_DIVERGING') return 'ticker-card__flag ticker-card__flag--blocked';
  return 'ticker-card__flag ticker-card__flag--neutral';
}

function getConfidenceClass(c: number): string {
  if (c >= 0.8) return 'ticker-card__confidence-fill ticker-card__confidence-fill--high';
  if (c >= 0.6) return 'ticker-card__confidence-fill ticker-card__confidence-fill--moderate';
  return 'ticker-card__confidence-fill ticker-card__confidence-fill--low';
}

function getConfidenceLabel(c: number): { text: string; color: string } {
  if (c >= 0.8) return { text: `${(c * 100).toFixed(0)}%`, color: '#34d399' };
  if (c >= 0.6) return { text: `${(c * 100).toFixed(0)}% MODERATE`, color: '#fbbf24' };
  return { text: `${(c * 100).toFixed(0)}% ⚠️ LOW`, color: '#94a3b8' };
}

function getTaBadgeClass(ta: string): string {
  const lower = ta.toLowerCase();
  if (lower.includes('overbought')) return 'ticker-card__ta-badge ticker-card__ta-badge--overbought';
  if (lower.includes('oversold')) return 'ticker-card__ta-badge ticker-card__ta-badge--oversold';
  return 'ticker-card__ta-badge ticker-card__ta-badge--neutral';
}

export function TickerCard({ ticker, type, confidence, taConsensus, forwardReturn5d }: TickerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const confLabel = confidence != null ? getConfidenceLabel(confidence) : null;

  return (
    <div className={getCardClass(type, ticker.flag)} onClick={() => setExpanded(!expanded)}>
      {/* Header: Symbol + Flag + TA badge */}
      <div className="ticker-card__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className={`ticker-card__symbol ${type === 'blocked' ? 'ticker-card__symbol--blocked' : ''}`}>
            {ticker.ticker}
          </span>
          {taConsensus && (
            <span className={getTaBadgeClass(taConsensus)}>{taConsensus}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {forwardReturn5d != null && (
            <span style={{
              fontSize: '0.65rem',
              color: forwardReturn5d >= 0 ? '#34d399' : '#ef4444',
              fontWeight: 600,
            }}>
              5d: {forwardReturn5d >= 0 ? '+' : ''}{(forwardReturn5d * 100).toFixed(1)}%
            </span>
          )}
          <span className={getFlagClass(ticker.flag)}>{ticker.flag}</span>
        </div>
      </div>

      {/* Confidence bar */}
      {confLabel && confidence != null && (
        <div className="ticker-card__confidence">
          <div className="ticker-card__confidence-bar">
            <div
              className={getConfidenceClass(confidence)}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
          <span className="ticker-card__confidence-label" style={{ color: confLabel.color }}>
            {confLabel.text}
          </span>
        </div>
      )}

      {/* Data row */}
      <div className="ticker-card__data">
        SV: {ticker.sv_pct}% · {ticker.dp_label || `DP: ${ticker.dp_distributing ? 'DISTRIBUTION' : 'ACCUMULATION'}`}
      </div>
      <div className="ticker-card__reason">{ticker.reason}</div>

      {/* Expand toggle */}
      <div className="ticker-card__expand">
        {expanded ? '▲ Collapse' : '▼ Details & Chart'}
      </div>

      {/* Slug (expanded) */}
      {expanded && (
        <TickerSlug
          ticker={ticker}
          type={type}
        />
      )}
    </div>
  );
}
