/**
 * TimeframeSwitcher — bar of period buttons
 *
 * Maps human label → { period, interval } params for the /charts/{symbol}/ohlc endpoint.
 * Dumb component. Parent controls `selected`.
 */

export interface TimeframeOption {
    label: string;
    period: string;   // yfinance period param
    interval: string; // yfinance interval param
}

export const TIMEFRAMES: TimeframeOption[] = [
    { label: '1D', period: '1d', interval: '5m' },
    { label: '5D', period: '5d', interval: '15m' },
    { label: '1M', period: '1mo', interval: '1h' },
    { label: '3M', period: '3mo', interval: '1d' },
    { label: '6M', period: '6mo', interval: '1d' },
    { label: '1Y', period: '1y', interval: '1wk' },
];

interface TimeframeSwitcherProps {
    selected: TimeframeOption;
    onChange: (tf: TimeframeOption) => void;
}

export function TimeframeSwitcher({ selected, onChange }: TimeframeSwitcherProps) {
    return (
        <div className="flex items-center gap-0.5 bg-bg-tertiary rounded-lg border border-border-subtle p-0.5">
            {TIMEFRAMES.map((tf) => {
                const isActive = tf.label === selected.label;
                return (
                    <button
                        key={tf.label}
                        onClick={() => onChange(tf)}
                        className={[
                            'px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                            isActive
                                ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                                : 'text-text-muted hover:text-text-secondary',
                        ].join(' ')}
                    >
                        {tf.label}
                    </button>
                );
            })}
        </div>
    );
}
