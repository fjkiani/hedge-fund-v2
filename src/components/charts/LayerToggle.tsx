/**
 * LayerToggle — toggleable overlay layer pills
 *
 * Lets the user show/hide specific overlay groups on the chart:
 *   MAs, Pivots, GEX Walls, DP Levels, Traps
 *
 * Dumb component — parent owns the visibility state.
 */

export interface LayerVisibility {
    ma: boolean;
    pivots: boolean;
    gex: boolean;
    dp: boolean;
    traps: boolean;
}

export const DEFAULT_LAYERS: LayerVisibility = {
    ma: true,
    pivots: true,
    gex: true,
    dp: true,
    traps: true,
};

interface LayerDef {
    key: keyof LayerVisibility;
    label: string;
    icon: string;
    colorOn: string;
    colorOff: string;
}

const LAYERS: LayerDef[] = [
    { key: 'ma', label: 'MAs', icon: '📈', colorOn: 'bg-blue-500/20 border-blue-500/40 text-blue-300', colorOff: 'bg-bg-tertiary border-border-subtle text-text-muted' },
    { key: 'pivots', label: 'Pivots', icon: '🎯', colorOn: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300', colorOff: 'bg-bg-tertiary border-border-subtle text-text-muted' },
    { key: 'gex', label: 'GEX', icon: '⚡', colorOn: 'bg-orange-500/20 border-orange-500/40 text-orange-300', colorOff: 'bg-bg-tertiary border-border-subtle text-text-muted' },
    { key: 'dp', label: 'Dark Pool', icon: '🏦', colorOn: 'bg-green-500/20 border-green-500/40 text-green-300', colorOff: 'bg-bg-tertiary border-border-subtle text-text-muted' },
    { key: 'traps', label: 'Traps', icon: '🪤', colorOn: 'bg-red-500/20 border-red-500/40 text-red-300', colorOff: 'bg-bg-tertiary border-border-subtle text-text-muted' },
];

interface LayerToggleProps {
    layers: LayerVisibility;
    onChange: (layers: LayerVisibility) => void;
}

export function LayerToggle({ layers, onChange }: LayerToggleProps) {
    const toggle = (key: keyof LayerVisibility) => {
        onChange({ ...layers, [key]: !layers[key] });
    };

    return (
        <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mr-1">Layers</span>
            {LAYERS.map(({ key, label, icon, colorOn, colorOff }) => (
                <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={[
                        'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150',
                        layers[key] ? colorOn : colorOff,
                        !layers[key] && 'opacity-50',
                    ].join(' ')}
                    title={`${layers[key] ? 'Hide' : 'Show'} ${label}`}
                >
                    <span>{icon}</span>
                    <span>{label}</span>
                </button>
            ))}
        </div>
    );
}
