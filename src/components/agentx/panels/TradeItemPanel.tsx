/**
 * TradeItem — Row component for politician/spouse trade.
 * Click → opens AiBriefingPanel.
 * Shared between AgentX and Politicians pages.
 */

import type { PoliticianDetail, SpouseAlert } from '../types';

export interface TradeItemData {
  slug: string;
  name: string;
  type: string;
  ticker: string;
  size: string;
  date: string;
  isSpouse: boolean;
  isRoutine: boolean;
  owner?: string;
}

/** Transform API PoliticianDetail → TradeItemData */
export function fromPoliticianDetail(p: PoliticianDetail, index: number): TradeItemData {
  const firstName = p.name.split(' ')[0].toLowerCase().slice(0, 3);
  return {
    slug: `trd-${firstName}-${p.ticker.toLowerCase()}-${index}`,
    name: p.name,
    type: p.type?.toUpperCase() || 'UNKNOWN',
    ticker: p.ticker,
    size: p.size || '—',
    date: p.date || '—',
    isSpouse: p.owner === 'Spouse',
    isRoutine: !!p.is_routine,
    owner: p.owner,
  };
}

/** Transform API SpouseAlert → TradeItemData */
export function fromSpouseAlert(sa: SpouseAlert, index: number): TradeItemData {
  const firstName = sa.politician.split(' ')[0].toLowerCase().slice(0, 3);
  return {
    slug: `sp-${firstName}-${sa.ticker.toLowerCase()}-${index}`,
    name: sa.politician,
    type: sa.type?.toUpperCase() || 'TRADE',
    ticker: sa.ticker,
    size: sa.size || '—',
    date: sa.date || '—',
    isSpouse: true,
    isRoutine: false,
    owner: sa.owner,
  };
}

interface TradeItemProps {
  trade: TradeItemData;
  onClick: (trade: TradeItemData) => void;
}

export function TradeItem({ trade, onClick }: TradeItemProps) {
  const isBuy = trade.type.includes('BUY') || trade.type.includes('PURCHASE');

  return (
    <div className="trade-item" onClick={() => onClick(trade)}>
      <div className="trade-item__left">
        <div className="trade-item__name-row">
          <span className="trade-item__name">{trade.name}</span>
          {trade.isSpouse && <span className="trade-item__spouse-badge" title="Spouse trade">👥</span>}
          {trade.isRoutine && <span className="trade-item__drip-badge" title="DRIP/Routine">♻️</span>}
        </div>
        <span className="trade-item__date">{trade.date}</span>
      </div>
      <div className="trade-item__right">
        <span className="trade-item__ticker">${trade.ticker}</span>
        <span className={`trade-item__action ${isBuy ? 'trade-item__action--buy' : 'trade-item__action--sell'}`}>
          {trade.type}
        </span>
        <span className="trade-item__size">{trade.size}</span>
      </div>
    </div>
  );
}
