/**
 * useGammaPivotContext
 *
 * Reads gamma_context + levels_context from the unified Oracle derivatives block.
 * Primary source: useOracle → oracle.derivatives (populated from brief.derivatives + brief.pivots).
 *
 * Exposes:
 *   - All raw fields (max_pain, gamma_flip, distance_from_max_pain, top_walls,
 *     ema_200, confluence_zones, next_above, next_below)
 *   - bandLabel: human-readable string describing current position
 *     e.g. "above EMA-200, below confluence at 662.14"
 */

import { useOracle } from './useOracle';

export interface GammaWallSlim {
  strike: number;
  gex: number;
  signal: 'SUPPORT' | 'RESISTANCE' | string;
}

export interface ConfluenceZoneSlim {
  level: number;
  count: number;
}

export interface GammaPivotContext {
  // gamma_context
  regime: string | null;
  total_gex: number | null;
  max_pain: number | null;
  spot: number | null;
  gamma_flip: number | null;
  distance_from_max_pain: number | null;
  top_walls: GammaWallSlim[];
  // levels_context
  ema_200: number | null;
  confluence_zones: ConfluenceZoneSlim[];
  next_above: number | null;
  next_below: number | null;
  // derived
  bandLabel: string;
  isLoaded: boolean;
}

const EMPTY: GammaPivotContext = {
  regime: null,
  total_gex: null,
  max_pain: null,
  spot: null,
  gamma_flip: null,
  distance_from_max_pain: null,
  top_walls: [],
  ema_200: null,
  confluence_zones: [],
  next_above: null,
  next_below: null,
  bandLabel: '—',
  isLoaded: false,
};

function buildBandLabel(
  spot: number | null,
  ema_200: number | null,
  next_above: number | null,
  next_below: number | null,
  max_pain: number | null,
  regime: string | null,
): string {
  if (!spot) return '—';

  const parts: string[] = [];

  // EMA-200 position
  if (ema_200) {
    parts.push(spot > ema_200 ? `above EMA-200 (${ema_200.toFixed(2)})` : `below EMA-200 (${ema_200.toFixed(2)})`);
  }

  // Next confluence
  if (next_above && next_below) {
    parts.push(`between confluence ${next_below.toFixed(2)} – ${next_above.toFixed(2)}`);
  } else if (next_above) {
    parts.push(`below confluence at ${next_above.toFixed(2)}`);
  } else if (next_below) {
    parts.push(`above confluence at ${next_below.toFixed(2)}`);
  }

  // Max pain gravity
  if (max_pain && regime === 'NEGATIVE' && spot > max_pain) {
    parts.push(`↓ gravity toward max pain ${max_pain.toFixed(0)}`);
  }

  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function useGammaPivotContext(): GammaPivotContext {
  const oracle = useOracle();

  if (!oracle) return EMPTY;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = (oracle as any).derivatives ?? {};

  const regime  = d.gex_regime ?? null;
  const spot    = typeof d.spot === 'number' ? d.spot : null;
  const max_pain = typeof d.max_pain === 'number' ? d.max_pain : null;
  const gamma_flip = typeof d.gamma_flip === 'number' ? d.gamma_flip : null;
  const distance_from_max_pain = typeof d.distance_from_max_pain === 'number' ? d.distance_from_max_pain : null;
  const total_gex = typeof d.total_gex === 'number' ? d.total_gex : null;
  const top_walls: GammaWallSlim[] = Array.isArray(d.top_walls) ? d.top_walls : [];
  const ema_200 = typeof d.ema_200 === 'number' ? d.ema_200 : null;
  const confluence_zones: ConfluenceZoneSlim[] = Array.isArray(d.confluence_zones) ? d.confluence_zones : [];
  const next_above = typeof d.next_above === 'number' ? d.next_above : null;
  const next_below = typeof d.next_below === 'number' ? d.next_below : null;

  const bandLabel = buildBandLabel(spot, ema_200, next_above, next_below, max_pain, regime);

  return {
    regime,
    total_gex,
    max_pain,
    spot,
    gamma_flip,
    distance_from_max_pain,
    top_walls,
    ema_200,
    confluence_zones,
    next_above,
    next_below,
    bandLabel,
    isLoaded: true,
  };
}
