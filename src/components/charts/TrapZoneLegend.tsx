import { TrapCard } from '../ui/TrapCard';

interface TrapZone {
    type: string;
    price_min: number;
    price_max: number;
    conviction: number;
    narrative: string;
    data_point?: string;
    supporting_sources: string[];
    emoji: string;
}

interface TrapZoneLegendProps {
    traps: TrapZone[];
}

const getAccentForTrap = (type: string): 'green' | 'red' | 'yellow' | 'purple' | 'neutral' => {
    switch (type) {
        case 'BEAR_TRAP_COIL': return 'green';
        case 'BULL_TRAP':
        case 'CEILING_TRAP':
        case 'DEATH_CROSS_TRAP': return 'red';
        case 'LIQUIDITY_TRAP': return 'yellow';
        case 'WAR_HEADLINE': return 'purple';
        default: return 'neutral';
    }
};

export function TrapZoneLegend({ traps }: TrapZoneLegendProps) {
    if (!traps || traps.length === 0) return null;

    return (
        <div className="mt-4">
            <h3 className="text-xs uppercase tracking-widest text-text-muted mb-4 px-1 border-b border-white/5 pb-2">Active Trap Zones</h3>
            <div className="flex flex-col gap-3">
                {traps.map((trap, idx) => (
                    <TrapCard
                        key={idx}
                        type={trap.type}
                        emoji={trap.emoji}
                        priceMin={trap.price_min}
                        priceMax={trap.price_max}
                        conviction={trap.conviction}
                        narrative={trap.narrative}
                        dataPoint={trap.data_point}
                        sources={trap.supporting_sources}
                        accent={getAccentForTrap(trap.type)}
                    />
                ))}
            </div>
        </div>
    );
}
