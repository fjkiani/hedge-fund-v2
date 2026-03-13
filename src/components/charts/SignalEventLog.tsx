import { SignalRow } from '../ui/SignalRow';

export interface SignalEvent {
    id: string;
    symbol: string;
    action: string;        // BUY | SELL
    type: string;          // signal_type (e.g. "dp_bounce", "kill_chain")
    confidence: number;    // 0-100
    entry_price: number;
    stop_price: number;
    target_price: number;
    risk_reward: number;
    reasoning: string[];
    timestamp: string;
    is_master: boolean;
}

interface SignalEventLogProps {
    signals: SignalEvent[];
    symbol: string;
}

export function SignalEventLog({ signals, symbol }: SignalEventLogProps) {
    if (!signals || signals.length === 0) {
        return (
            <div className="px-3 py-4 rounded-xl bg-bg-tertiary/50 border border-border-subtle text-center">
                <span className="text-xs text-text-muted">No active signals for {symbol}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto sidebar-scroll pr-1">
            {signals.map((sig) => (
                <SignalRow
                    key={sig.id}
                    symbol={sig.symbol}
                    action={sig.action}
                    entryPrice={sig.entry_price}
                    targetPrice={sig.target_price}
                    stopPrice={sig.stop_price}
                    riskReward={sig.risk_reward || 0}
                    confidence={sig.confidence}
                    type={sig.type}
                    reasoning={sig.reasoning && sig.reasoning.length > 0 ? sig.reasoning[0] : undefined}
                    isMaster={sig.is_master}
                    timestamp={sig.timestamp}
                    compact={true}
                />
            ))}
        </div>
    );
}
