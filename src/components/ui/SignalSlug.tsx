import React from 'react';

interface TechnicalContext {
  trigger_source: string;
  time_horizon: string;
  levels: {
    entry: number;
    target: number;
    stop: number;
    target_pct: string;
    stop_pct: string;
  };
  risk_profile: {
    risk_reward: number;
    max_loss_pct: number;
    position_size_pct: number;
  };
  embed_fields: { label: string; value: string }[];
}

export interface SignalData {
  id: string;
  symbol: string;
  type: string;
  action: string;
  confidence: number;
  entry_price: number;
  stop_price: number;
  target_price: number;
  risk_reward: number;
  reasoning: string[];
  warnings: string[];
  timestamp: string;
  source: string;
  is_master: boolean;
  technical_context?: TechnicalContext;
}

interface SignalSlugProps {
  signal: SignalData;
  isExpanded: boolean;
  onToggle: () => void;
  onShowOnChart?: (symbol: string, levels: { entry: number; target: number; stop: number }) => void;
  onTakeTrade?: (signal: SignalData) => void;
}

const TRIGGER_ICONS: Record<string, string> = {
  options_flow: '🔥',
  dark_pool_divergence: '🕳️',
  earnings_intel: '📅',
  overnight_intel: '🌙',
  news_catalyst: '📰',
  kill_chain_triple: '🐺',
  alert_monitor: '📡',
  SignalGenerator: '⚡',
};

const TRIGGER_LABELS: Record<string, string> = {
  options_flow: 'Options Flow',
  dark_pool_divergence: 'Dark Pool',
  earnings_intel: 'Earnings Intel',
  overnight_intel: 'Overnight Intel',
  news_catalyst: 'News Catalyst',
  kill_chain_triple: 'Kill Chain',
  alert_monitor: 'Alert Monitor',
  SignalGenerator: 'Signal Generator',
};

export function SignalSlug({ signal, isExpanded, onToggle, onShowOnChart, onTakeTrade }: SignalSlugProps) {
  const isBuy = signal.action === 'BUY' || signal.action === 'LONG';
  const isHold = signal.action === 'WATCH' || signal.action === 'HOLD';
  const direction = isHold ? 'watch' : isBuy ? 'long' : 'short';
  const ctx = signal.technical_context;
  const triggerSource = ctx?.trigger_source || signal.source?.split(':')?.[0] || 'alert_monitor';
  const triggerIcon = TRIGGER_ICONS[triggerSource] || TRIGGER_ICONS[signal.type] || '📡';
  const triggerLabel = TRIGGER_LABELS[triggerSource] || signal.type.replace(/_/g, ' ');

  const confClass = signal.confidence >= 75 ? 'high' : signal.confidence >= 60 ? 'mid' : 'low';

  const fmtPrice = (v: number) => v > 0 ? `$${v.toFixed(2)}` : '—';
  const fmtTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  return (
    <div
      className={`ui-slug ui-slug--${direction} ${isExpanded ? 'ui-slug--expanded' : ''}`}
      onClick={!isExpanded ? onToggle : undefined}
    >
      {/* ── HEADER (always visible) ── */}
      <div className="ui-slug__header" onClick={isExpanded ? onToggle : undefined}>
        <div className="ui-slug__left">
          <div className={`ui-slug__action ui-slug__action--${direction}`}>
            {isHold ? '👀' : isBuy ? '▲' : '▼'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`ui-slug__action-label ui-slug__action-label--${direction}`}>
                {signal.action}
              </span>
              <span className="ui-slug__symbol">{signal.symbol}</span>
              {signal.is_master && (
                <span style={{
                  fontSize: '9px', padding: '2px 6px',
                  background: 'rgba(255, 215, 0, 0.15)', color: 'var(--accent-gold)',
                  borderRadius: '4px', border: '1px solid rgba(255, 215, 0, 0.3)',
                  fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' as const
                }}>MASTER</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span className="ui-slug__time">{fmtTime(signal.timestamp)}</span>
              <span className="ui-slug__type-tag">{triggerIcon} {triggerLabel}</span>
            </div>
          </div>
        </div>

        <div className="ui-slug__conf">
          <div className="ui-slug__conf-bar">
            <div
              className={`ui-slug__conf-fill ui-slug__conf-fill--${confClass}`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
          <span className="ui-slug__conf-text">{signal.confidence}%</span>
        </div>
      </div>

      {/* ── PRICES ROW ── */}
      <div className="ui-slug__prices">
        <div className="ui-slug__price-item">
          <span className="ui-slug__price-label">{isHold ? 'Reference' : 'Entry'}</span>
          <span className="ui-slug__price-val">{fmtPrice(signal.entry_price)}</span>
        </div>
        <div className="ui-slug__price-item">
          <span className="ui-slug__price-label">{isHold ? 'Resistance' : 'Target'}</span>
          <span className="ui-slug__price-val ui-slug__price-val--green">{fmtPrice(signal.target_price)}</span>
          {ctx?.levels?.target_pct && (
            <span className="ui-slug__price-pct">{ctx.levels.target_pct}</span>
          )}
        </div>
        <div className="ui-slug__price-item">
          <span className="ui-slug__price-label">{isHold ? 'Support' : 'Stop'}</span>
          <span className="ui-slug__price-val ui-slug__price-val--red">{fmtPrice(signal.stop_price)}</span>
          {ctx?.levels?.stop_pct && (
            <span className="ui-slug__price-pct">{ctx.levels.stop_pct}</span>
          )}
        </div>
        <div className="ui-slug__price-item">
          <span className="ui-slug__price-label">R/R</span>
          <span className="ui-slug__price-val">
            {signal.risk_reward > 0 ? `${signal.risk_reward.toFixed(1)}:1` : '—'}
          </span>
        </div>
      </div>

      {/* ── EXPANDED PANEL ── */}
      {isExpanded && (
        <div className="ui-slug__expand">
          {/* WHY THIS SIGNAL */}
          {signal.reasoning && signal.reasoning.length > 0 && (
            <>
              <div className="ui-slug__section-title">Why This Signal</div>
              <div className="ui-slug__reasoning">
                {signal.reasoning.map((reason, i) => (
                  <div key={i} className="ui-slug__reason">
                    <div className="ui-slug__reason-dot" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TRADE PLAN */}
          <div className="ui-slug__section-title">Trade Plan</div>
          <div className="ui-slug__plan">
            <div className="ui-slug__plan-row">
              <span className="ui-slug__plan-label">Entry Zone</span>
              <span className="ui-slug__plan-value">{fmtPrice(signal.entry_price)}</span>
            </div>
            <div className="ui-slug__plan-row">
              <span className="ui-slug__plan-label">Target</span>
              <span className="ui-slug__plan-value ui-slug__plan-value--green">
                {fmtPrice(signal.target_price)} {ctx?.levels?.target_pct && <small>({ctx.levels.target_pct})</small>}
              </span>
            </div>
            <div className="ui-slug__plan-row">
              <span className="ui-slug__plan-label">Stop Loss</span>
              <span className="ui-slug__plan-value ui-slug__plan-value--red">
                {fmtPrice(signal.stop_price)} {ctx?.levels?.stop_pct && <small>({ctx.levels.stop_pct})</small>}
              </span>
            </div>
            <div className="ui-slug__plan-row">
              <span className="ui-slug__plan-label">R/R Ratio</span>
              <span className="ui-slug__plan-value">
                {signal.risk_reward > 0 ? `${signal.risk_reward.toFixed(1)}:1` : '—'}
              </span>
            </div>
            {ctx?.risk_profile && (
              <>
                <div className="ui-slug__plan-row">
                  <span className="ui-slug__plan-label">Position Size</span>
                  <span className="ui-slug__plan-value ui-slug__plan-value--blue">
                    {ctx.risk_profile.position_size_pct}%
                  </span>
                </div>
                <div className="ui-slug__plan-row">
                  <span className="ui-slug__plan-label">Max Loss</span>
                  <span className="ui-slug__plan-value ui-slug__plan-value--red">
                    {ctx.risk_profile.max_loss_pct}%
                  </span>
                </div>
              </>
            )}
            {ctx?.time_horizon && (
              <div className="ui-slug__plan-row">
                <span className="ui-slug__plan-label">Time Frame</span>
                <span className="ui-slug__plan-value">{ctx.time_horizon}</span>
              </div>
            )}
          </div>

          {/* EMBED FIELDS (extra data from Discord embed) */}
          {ctx?.embed_fields && ctx.embed_fields.length > 0 && (
            <>
              <div className="ui-slug__section-title">Intelligence Data</div>
              <div className="ui-slug__fields">
                {ctx.embed_fields.map((field, i) => (
                  <div key={i} className="ui-slug__field">
                    <div className="ui-slug__field-label">{field.label}</div>
                    <div className="ui-slug__field-value">{field.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* WARNINGS */}
          {signal.warnings && signal.warnings.length > 0 && (
            <>
              <div className="ui-slug__section-title" style={{ color: 'var(--accent-orange)' }}>⚠️ Warnings</div>
              <div className="ui-slug__reasoning">
                {signal.warnings.map((w, i) => (
                  <div key={i} className="ui-slug__reason">
                    <div className="ui-slug__reason-dot" style={{ background: 'var(--accent-orange)' }} />
                    <span style={{ color: 'var(--accent-orange)' }}>{w}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
          <div className="ui-slug__actions">
            <button
              className="ui-slug__btn ui-slug__btn--primary"
              onClick={(e) => {
                e.stopPropagation();
                onShowOnChart?.(signal.symbol, {
                  entry: signal.entry_price,
                  target: signal.target_price,
                  stop: signal.stop_price,
                });
              }}
            >
              📊 Show on Chart
            </button>
            {!isHold && (
              <button
                className="ui-slug__btn ui-slug__btn--accent"
                onClick={(e) => {
                  e.stopPropagation();
                  onTakeTrade?.(signal);
                }}
              >
                🎯 Take Trade
              </button>
            )}
            <button
              className="ui-slug__btn"
              onClick={(e) => {
                e.stopPropagation();
                const text = [
                  `${signal.action} ${signal.symbol} @ $${signal.entry_price.toFixed(2)}`,
                  `Target: $${signal.target_price.toFixed(2)} | Stop: $${signal.stop_price.toFixed(2)}`,
                  `R/R: ${signal.risk_reward.toFixed(1)}:1 | Confidence: ${signal.confidence}%`,
                  '',
                  ...signal.reasoning,
                ].join('\n');
                navigator.clipboard.writeText(text);
              }}
            >
              📋 Copy Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
