/**
 * FocusListPanel — Renders hot_tickers from the API as TickerTag chips.
 * Zero hardcoded tickers.
 */

import { TickerTag } from '../primitives/TickerTag';

interface FocusListPanelProps {
  tickers: string[];
}

export function FocusListPanel({ tickers }: FocusListPanelProps) {
  return (
    <div className="focus-list">
      <div className="focus-list__header">
        <span className="focus-list__label">Focus List</span>
      </div>
      <div className="focus-list__chips">
        {tickers.length > 0 ? (
          tickers.map(t => <TickerTag key={t} symbol={t} />)
        ) : (
          <span className="focus-list__empty">No hot tickers</span>
        )}
      </div>
    </div>
  );
}
