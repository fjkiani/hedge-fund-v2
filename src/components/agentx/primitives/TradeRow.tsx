/**
 * TradeRow — Generic trade row used by both Politician and Insider panels
 */

import { Badge } from '../../ui/Badge';

interface TradeRowProps {
    label: string;
    sublabel?: string;
    ticker: string;
    badgeText?: string;
    badgeVariant?: 'bullish' | 'bearish' | 'neutral';
    rightText?: string;
}

export function TradeRow({ label, sublabel, ticker, badgeText, badgeVariant = 'neutral', rightText }: TradeRowProps) {
    return (
        <div className="flex items-center justify-between p-2.5 bg-bg-tertiary rounded-lg border border-border-subtle">
            <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary font-medium truncate">{label}</div>
                {sublabel && <div className="text-xs text-text-muted">{sublabel}</div>}
            </div>
            <div className="flex items-center gap-2 ml-3">
                <span className="text-xs font-mono text-accent-blue">{ticker}</span>
                {badgeText && <Badge variant={badgeVariant}>{badgeText}</Badge>}
                {rightText && <span className="text-xs text-text-muted">{rightText}</span>}
            </div>
        </div>
    );
}
