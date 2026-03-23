/**
 * TickerTag — Styled ticker chip
 * Renders as $SYMBOL with cyan accent.
 */

interface TickerTagProps {
  symbol: string;
}

export function TickerTag({ symbol }: TickerTagProps) {
  return (
    <span className="ticker-tag">${symbol}</span>
  );
}
