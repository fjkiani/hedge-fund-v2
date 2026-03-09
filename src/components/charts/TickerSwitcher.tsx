/**
 * TickerSwitcher — pill-row ticker selector
 * 
 * Dumb component. Owns no state. Parent controls `symbol`.
 * Add tickers by editing TICKERS — nothing else changes.
 */

interface Ticker {
    symbol: string;
    label: string;
    type: 'equity' | 'crypto' | 'index';
}

const TICKERS: Ticker[] = [
    { symbol: 'SPY', label: 'SPY', type: 'equity' },
    { symbol: 'QQQ', label: 'QQQ', type: 'equity' },
    { symbol: 'IWM', label: 'IWM', type: 'equity' },
    { symbol: 'NVDA', label: 'NVDA', type: 'equity' },
    { symbol: 'AAPL', label: 'AAPL', type: 'equity' },
    { symbol: 'TSLA', label: 'TSLA', type: 'equity' },
    { symbol: 'BTC-USD', label: 'BTC', type: 'crypto' },
];

interface TickerSwitcherProps {
    selected: string;
    onChange: (symbol: string) => void;
}

export function TickerSwitcher({ selected, onChange }: TickerSwitcherProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-bg-tertiary rounded-xl border border-border-subtle">
            {TICKERS.map((t) => {
                const isActive = t.symbol === selected;
                return (
                    <button
                        key={t.symbol}
                        onClick={() => onChange(t.symbol)}
                        className={[
                            'px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-all duration-150',
                            isActive
                                ? 'bg-accent-primary text-bg-primary shadow-lg shadow-accent-primary/20'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary',
                        ].join(' ')}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}
