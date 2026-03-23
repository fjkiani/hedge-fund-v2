/**
 * SpouseAlertBanner — Upgraded tactical aesthetic for spouse trade alerts.
 * Data from report.spouse_alerts[].
 * Click any trade → opens AiBriefingPanel.
 */

import type { SpouseAlert } from '../types';
import { fromSpouseAlert, type TradeItemData } from './TradeItemPanel';

interface SpouseAlertBannerProps {
  alerts: SpouseAlert[];
  onTradeClick: (trade: TradeItemData) => void;
}

export function SpouseAlertBanner({ alerts, onTradeClick }: SpouseAlertBannerProps) {
  if (alerts.length === 0) return null;

  const trades = alerts.map((sa, i) => fromSpouseAlert(sa, i));

  return (
    <div className="spouse-banner">
      <div className="spouse-banner__stripe" />

      <div className="spouse-banner__header">
        <div className="spouse-banner__title-group">
          <span className="spouse-banner__icon">⚠️</span>
          <div>
            <h3 className="spouse-banner__title">SPOUSE TRADE ALERT</h3>
            <p className="spouse-banner__subtitle">
              Household activity detected · Cross-reference required
            </p>
          </div>
        </div>
        <span className="spouse-banner__count">{alerts.length} NODE{alerts.length !== 1 ? 'S' : ''}</span>
      </div>

      <div className="spouse-banner__grid">
        {trades.map(trade => (
          <div
            key={trade.slug}
            className="spouse-banner__item"
            onClick={() => onTradeClick(trade)}
          >
            <span className="spouse-banner__name">{trade.name}</span>
            <div className="spouse-banner__meta">
              <span className={trade.type.includes('BUY') ? 'spouse-banner__buy' : 'spouse-banner__sell'}>
                {trade.type}
              </span>
              <span className="spouse-banner__ticker">${trade.ticker}</span>
              <span className="spouse-banner__size">{trade.size}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
