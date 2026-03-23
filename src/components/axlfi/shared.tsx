/**
 * AXLFI shared helpers + constants
 *
 * Used by all AXLFI widgets. Extracted from the monolith.
 */

import type { ReactNode } from 'react';

/* ── Formatting ─────────────────────────────────────────────────────── */

export function fmt(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export function pct(n: number): string {
  return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2)}%`;
}

/* ── Tier Constants ─────────────────────────────────────────────────── */

export const TIER_COLORS: Record<number, string> = {
  1: '#00d4ff',
  2: '#ffd700',
  3: '#ff9500',
  4: '#ff3366',
};

export const TIER_LABELS: Record<number, string> = {
  1: 'CALM',
  2: 'WARNING',
  3: 'HIGH',
  4: 'EXTREME',
};

/* ── Card Container ─────────────────────────────────────────────────── */

export function AXLFICard({ title, icon, children, className = '' }: {
  title: string; icon: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={`bg-bg-secondary rounded-xl border border-border-subtle p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
