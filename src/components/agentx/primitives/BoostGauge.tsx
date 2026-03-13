/**
 * 🎯 BoostGauge — Animated SVG divergence ring
 * Reusable anywhere. No Agent X dependency.
 */

import { getBoostColor, getBoostLabel } from '../utils';

interface BoostGaugeProps {
    value: number;
    max?: number;
    label?: string;
}

export function BoostGauge({ value, max = 10, label = 'divergence' }: BoostGaugeProps) {
    const pct = Math.min((Math.abs(value) / max) * 100, 100);
    const color = getBoostColor(value);

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a35" strokeWidth="8" />
                    <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 8px ${color}55)`, transition: 'all 0.8s ease' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-mono font-bold" style={{ color }}>
                        {value > 0 ? '+' : ''}{value}
                    </span>
                    <span className="text-xs text-text-muted">{label}</span>
                </div>
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>
                {getBoostLabel(value)}
            </span>
        </div>
    );
}
