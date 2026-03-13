/**
 * HotTickersStrip — Unified unique tickers across politician + insider flow
 */

import { Card } from '../../ui/Card';

interface HotTickersStripProps {
    tickers: string[];
    timestamp?: string;
}

export function HotTickersStrip({ tickers, timestamp }: HotTickersStripProps) {
    if (tickers.length === 0) return null;

    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <h3 className="card-title text-base">Hot Tickers</h3>
                </div>
                <span className="text-xs text-text-muted">{tickers.length} unique</span>
            </div>
            <div className="flex flex-wrap gap-2 px-1">
                {tickers.map((t, i) => (
                    <span
                        key={i}
                        className="px-3 py-1.5 bg-bg-tertiary border border-border-subtle rounded-lg text-sm font-mono text-accent-blue hover:border-accent-purple/50 hover:bg-bg-hover transition cursor-default"
                    >
                        {t}
                    </span>
                ))}
            </div>
            <div className="card-footer">
                <span>Across politician + insider flow</span>
                {timestamp && <span className="text-text-muted">{timestamp}</span>}
            </div>
        </Card>
    );
}
