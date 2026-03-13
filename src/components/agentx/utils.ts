/**
 * 🧠 Agent X — Utility Functions
 * Shared formatting + color logic for all Agent X components.
 */

/** Format USD values with appropriate suffix (K/M). */
export function formatUsd(n: number): string {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
}

/** Get accent color for a divergence boost value. */
export function getBoostColor(boost: number): string {
    if (boost >= 4) return '#00ff88';    // accent-green
    if (boost >= 2) return '#00d4ff';    // accent-blue
    if (boost > 0) return '#a855f7';     // accent-purple
    if (boost < 0) return '#ff3366';     // accent-red
    return '#606070';                    // text-muted
}

/** Get conviction label for a divergence boost value. */
export function getBoostLabel(boost: number): string {
    if (boost >= 4) return 'MAX CONVICTION';
    if (boost >= 2) return 'HIGH';
    if (boost > 0) return 'MODERATE';
    if (boost < 0) return 'CAUTION';
    return 'NEUTRAL';
}

/** Map Fed tone string to Badge variant. */
export function toneToVariant(tone: string): 'bullish' | 'bearish' | 'neutral' {
    if (tone === 'HAWKISH') return 'bearish';
    if (tone === 'DOVISH') return 'bullish';
    return 'neutral';
}
