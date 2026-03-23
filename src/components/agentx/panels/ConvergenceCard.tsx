/**
 * ConvergenceCard — Convergence/divergence card for Finnhub signals.
 * Data from report.finnhub_signals[].
 * Click → opens AiBriefingPanel.
 */

import type { FinnhubSignal } from '../types';

const SIGNAL_CONFIG: Record<string, { color: string; label: string }> = {
  STRONG_CONVERGENCE: { color: '#10b981', label: 'STRONG' },
  MILD_CONVERGENCE: { color: '#f59e0b', label: 'MILD' },
  DIVERGENCE: { color: '#f43f5e', label: 'DIVERGENCE' },
  NEUTRAL: { color: '#94a3b8', label: 'NEUTRAL' },
};

interface ConvergenceCardProps {
  signal: FinnhubSignal;
  onClick: (signal: FinnhubSignal) => void;
}

export function ConvergenceCard({ signal, onClick }: ConvergenceCardProps) {
  const cfg = SIGNAL_CONFIG[signal.convergence] || SIGNAL_CONFIG.NEUTRAL;
  const boostStr = signal.divergence_boost >= 0 ? `+${signal.divergence_boost}` : `${signal.divergence_boost}`;
  const logic = signal.reasoning?.[0] || signal.convergence;
  const meaning = signal.reasoning?.slice(1).join(' ') || '';

  return (
    <div
      className="convergence-card"
      onClick={() => onClick(signal)}
      style={{ '--conv-color': cfg.color } as React.CSSProperties}
    >
      <div className="convergence-card__header">
        <div className="convergence-card__ticker-row">
          <span className="convergence-card__ticker">${signal.ticker}</span>
          <div className="convergence-card__signal">
            <span
              className="convergence-card__dot"
              style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
            />
            <span className="convergence-card__label" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        </div>
        <span className="convergence-card__score" style={{ color: cfg.color }}>
          {boostStr}
        </span>
      </div>

      <div className="convergence-card__body">
        <div className="convergence-card__logic">
          <span className="convergence-card__logic-label">Logic:</span>
          <span>{logic}</span>
        </div>
        {meaning && (
          <p className="convergence-card__meaning">{meaning}</p>
        )}
      </div>

      {signal.catalysts && signal.catalysts.length > 0 && (
        <div className="convergence-card__tags">
          {signal.catalysts.map(tag => (
            <span key={tag} className="convergence-card__tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
