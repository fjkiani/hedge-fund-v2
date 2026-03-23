/**
 * PoliticianFeedPanel — Full trade list panel with header, buy/sell counts, TradeItem rows.
 * Data from report.hidden_hands.politician_details.
 */

import type { HiddenHands } from '../types';
import { TradeItem, fromPoliticianDetail } from './TradeItemPanel';
import type { TradeItemData } from './TradeItemPanel';

interface PoliticianFeedPanelProps {
  hands: HiddenHands;
  onTradeClick: (trade: TradeItemData) => void;
}

export function PoliticianFeedPanel({ hands, onTradeClick }: PoliticianFeedPanelProps) {
  const trades = hands.politician_details.map((p, i) => fromPoliticianDetail(p, i));

  return (
    <div className="politician-feed">
      <div className="politician-feed__header">
        <span className="politician-feed__title">Politician Activity Stream</span>
        <div className="politician-feed__counts">
          <span className="politician-feed__buy-count">{hands.politician_buys} BUY</span>
          <span className="politician-feed__sell-count">{hands.politician_sells} SELL</span>
        </div>
      </div>

      <div className="politician-feed__table">
        <div className="politician-feed__table-header">
          <span className="politician-feed__col-actor">Principal Actor</span>
          <span className="politician-feed__col-target">Target</span>
          <span className="politician-feed__col-vol">Volume</span>
        </div>

        <div className="politician-feed__rows">
          {trades.length > 0 ? (
            trades.map(t => (
              <TradeItem key={t.slug} trade={t} onClick={onTradeClick} />
            ))
          ) : (
            <div className="politician-feed__empty">No recent trades detected</div>
          )}
        </div>

        <div className="politician-feed__footer">
          <span className="politician-feed__source">
            Source: CapitolTrades · {hands.politician_cluster} total
          </span>
        </div>
      </div>
    </div>
  );
}
