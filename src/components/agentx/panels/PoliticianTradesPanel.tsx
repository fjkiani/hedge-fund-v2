/**
 * PoliticianTradesPanel — CapitolTrades data with buy/sell badges
 */

import { Card } from '../../ui/Card';
import { TradeRow } from '../primitives/TradeRow';
import type { HiddenHands } from '../types';

interface PoliticianTradesPanelProps {
    hands: HiddenHands;
}

export function PoliticianTradesPanel({ hands }: PoliticianTradesPanelProps) {
    return (
        <Card>
            <div className="card-header">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🏛️</span>
                    <h3 className="card-title text-base">Politician Trades</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-accent-green font-mono">{hands.politician_buys} buys</span>
                    <span className="text-xs text-text-muted">/</span>
                    <span className="text-xs text-accent-red font-mono">{hands.politician_sells} sells</span>
                </div>
            </div>
            <div className="space-y-1.5">
                {hands.politician_details.length > 0 ? (
                    hands.politician_details.map((p, i) => (
                        <TradeRow
                            key={i}
                            label={p.name}
                            sublabel={p.date}
                            ticker={p.ticker}
                            badgeText={p.type?.toUpperCase()}
                            badgeVariant={p.type?.toLowerCase().includes('buy') ? 'bullish' : 'bearish'}
                            rightText={p.size}
                        />
                    ))
                ) : (
                    <div className="text-center text-text-muted text-sm py-6 italic">No recent trades</div>
                )}
            </div>
            <div className="card-footer">
                <span>Source: CapitolTrades</span>
                <span className="text-accent-purple font-mono">{hands.politician_cluster} total</span>
            </div>
        </Card>
    );
}
