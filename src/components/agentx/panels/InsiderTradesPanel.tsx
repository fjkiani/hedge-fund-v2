/**
 * InsiderTradesPanel — OpenInsider data with net USD badge
 */

import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { TradeRow } from '../primitives/TradeRow';
import { formatUsd } from '../utils';
import type { HiddenHands } from '../types';

interface InsiderTradesPanelProps {
    hands: HiddenHands;
}

export function InsiderTradesPanel({ hands }: InsiderTradesPanelProps) {
    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🕵️</span>
                    <h3 className="card-title text-base">Insider Trades</h3>
                </div>
                <Badge variant={hands.insider_net_usd > 0 ? 'bullish' : hands.insider_net_usd < 0 ? 'bearish' : 'neutral'}>
                    Net: {formatUsd(hands.insider_net_usd)}
                </Badge>
            </div>
            <div className="space-y-1.5">
                {hands.insider_details.length > 0 ? (
                    hands.insider_details.map((ins, i) => (
                        <TradeRow
                            key={i}
                            label={ins.company !== 'Unknown' ? ins.company : ins.ticker}
                            sublabel={ins.date}
                            ticker={ins.ticker}
                            rightText={ins.value > 0 ? formatUsd(ins.value) : '—'}
                        />
                    ))
                ) : (
                    <div className="text-center text-text-muted text-sm py-6 italic">No recent trades</div>
                )}
            </div>
            <div className="card-footer">
                <span>Source: OpenInsider</span>
                <span className="text-accent-purple font-mono">{hands.insider_count} total</span>
            </div>
        </Card>
    );
}
