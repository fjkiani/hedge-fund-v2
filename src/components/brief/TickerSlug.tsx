/**
 * TickerSlug — Expandable explanation panel.
 * 3-sentence narrative: What, Why, Watch.
 * Lazy-loads MiniChart + pivot/gamma/DP data on expand.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MiniChart } from './MiniChart';
import type { TickerData } from './TickerCard';

interface PivotConfluence {
  avg_price: number;
  level_count: number;
  sets: string[];
}

interface GammaData {
  max_pain: number | null;
  gamma_walls: { strike: number; gex: number; signal: string }[];
  current_price: number | null;
}

interface DPLevel {
  price: number;
  level_type: string;
  strength: number;
}

interface SlugEnrichment {
  confluenceZones: PivotConfluence[];
  gamma: GammaData | null;
  dpLevels: DPLevel[];
  ohlcCandles: any[];
  loading: boolean;
}

interface TickerSlugProps {
  ticker: TickerData;
  type: 'approved' | 'blocked';
}

function computeMA(candles: any[], period: number): number | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  const sum = slice.reduce((acc: number, c: any) => acc + c.close, 0);
  return sum / period;
}

function buildNarrative(
  ticker: TickerData,
  type: string,
  watchLevel: { price: number; label: string } | null,
): string[] {
  const sym = ticker.ticker;
  const isDist = ticker.dp_distributing;
  const dpLabel = ticker.dp_label || (isDist ? 'distribution' : 'accumulation');
  const svPct = ticker.sv_pct;

  // Sentence 1: What is happening (plain English, no $ or % leading)
  let what: string;
  if (type === 'blocked') {
    if (isDist) {
      what = `Institutions are actively distributing ${sym} in dark pools while the stock appears technically stable on the surface.`;
    } else {
      what = `${sym} is flagged for short volume divergence — selling pressure is elevated above the safety threshold.`;
    }
  } else if (ticker.flag === 'DP_WARNING') {
    what = `${sym} shows moderate institutional distribution in dark pools — not enough to block, but enough to warrant caution.`;
  } else if (ticker.flag === 'CLEAN') {
    what = `${sym} is passing all gates cleanly — short volume is low and dark pool positioning supports the bullish thesis.`;
  } else {
    what = `${sym}'s dark pool positioning is neutral — institutions are neither aggressively buying nor selling at these levels.`;
  }

  // Sentence 2: Why it matters — connect to price behavior
  let why: string;
  if (isDist && svPct < 40) {
    why = `Low short volume (${svPct.toFixed(0)}%) masking heavy ${dpLabel} often precedes a slow grind down rather than a sharp drop — the selling is hidden from surface-level indicators.`;
  } else if (isDist) {
    why = `Elevated short volume combined with ${dpLabel} creates compounding downward pressure — both visible and hidden selling channels are active.`;
  } else if (ticker.flag === 'CLEAN' && svPct < 35) {
    why = `Clean short volume at ${svPct.toFixed(0)}% with supportive dark pool flows typically provides a stable base for continuation — institutional backing reduces downside risk.`;
  } else {
    why = `At ${svPct.toFixed(0)}% short volume, the balance between buyers and sellers is undecided — wait for a directional catalyst before committing capital.`;
  }

  // Sentence 3: What to watch — specific level from real data
  let watch: string;
  if (watchLevel) {
    if (type === 'blocked' || isDist) {
      watch = `Watch whether price holds above ${watchLevel.label} at $${watchLevel.price.toFixed(0)}; a break below on any volume confirms the distribution thesis.`;
    } else {
      watch = `Key level to watch: ${watchLevel.label} at $${watchLevel.price.toFixed(0)} — a sustained hold above this level confirms the setup for entry.`;
    }
  } else {
    watch = `No significant confluence level identified — wait for price to establish a clear support or resistance zone before acting.`;
  }

  return [what, why, watch];
}

export function TickerSlug({ ticker, type }: TickerSlugProps) {
  const navigate = useNavigate();
  const [enrichment, setEnrichment] = useState<SlugEnrichment>({
    confluenceZones: [],
    gamma: null,
    dpLevels: [],
    ohlcCandles: [],
    loading: true,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  // Lazy load all enrichment data on mount (slug is only rendered when expanded)
  useEffect(() => {
    const sym = ticker.ticker;
    let mounted = true;

    async function loadEnrichment() {
      const [pivotsRes, gammaRes, dpRes, ohlcRes] = await Promise.allSettled([
        fetch(`${API_URL}/pivots/${sym}`).then(r => r.json()),
        fetch(`${API_URL}/gamma/${sym}`).then(r => r.json()),
        fetch(`${API_URL}/darkpool/${sym}/levels`).then(r => r.json()),
        fetch(`${API_URL}/charts/${sym}/ohlc?period=3mo&interval=1d`).then(r => r.json()),
      ]);

      if (!mounted) return;

      const confluenceZones = pivotsRes.status === 'fulfilled'
        ? (pivotsRes.value.confluence_zones || [])
        : [];

      const dpLevels = dpRes.status === 'fulfilled'
        ? (dpRes.value.levels || [])
        : [];

      const candles = ohlcRes.status === 'fulfilled'
        ? (ohlcRes.value.candles || [])
        : [];

      setEnrichment({
        confluenceZones,
        gamma: gammaRes.status === 'fulfilled' ? {
          max_pain: gammaRes.value.max_pain,
          gamma_walls: gammaRes.value.gamma_walls || [],
          current_price: gammaRes.value.current_price,
        } : null,
        dpLevels,
        ohlcCandles: candles,
        loading: false,
      });
    }

    loadEnrichment();
    return () => { mounted = false; };
  }, [ticker.ticker, API_URL]);

  // Determine "what to watch" level from real data (priority order)
  let watchLevel: { price: number; label: string } | null = null;

  // 1. Pivot confluence zone (best)
  if (enrichment.confluenceZones.length > 0) {
    const zone = enrichment.confluenceZones[0];
    watchLevel = {
      price: zone.avg_price,
      label: `${zone.level_count}-set confluence (${zone.sets.join('/')})`,
    };
  }
  // 2. Gamma max pain
  else if (enrichment.gamma?.max_pain) {
    watchLevel = { price: enrichment.gamma.max_pain, label: 'gamma max pain' };
  }
  // 3. DP support/resistance
  else if (enrichment.dpLevels.length > 0) {
    const lvl = enrichment.dpLevels[0];
    watchLevel = { price: lvl.price, label: `DP ${lvl.level_type.toLowerCase()} (${lvl.strength}% strength)` };
  }
  // 4. 20-day MA fallback
  else if (enrichment.ohlcCandles.length >= 20) {
    const ma20 = computeMA(enrichment.ohlcCandles, 20);
    if (ma20) watchLevel = { price: ma20, label: '20-day moving average' };
  }

  const [what, why, watch] = buildNarrative(ticker, type, watchLevel);

  // Compute MAs for MiniChart
  const ma20 = computeMA(enrichment.ohlcCandles, 20);
  const ma50 = computeMA(enrichment.ohlcCandles, 50);

  return (
    <div className="ticker-slug" onClick={(e) => e.stopPropagation()}>
      {/* 3-sentence narrative */}
      {enrichment.loading ? (
        <div className="ticker-slug__narrative" style={{ opacity: 0.5 }}>Loading intelligence...</div>
      ) : (
        <div className="ticker-slug__narrative">
          <p>{what}</p>
          <p>{why}</p>
          <p><strong>{watch}</strong></p>
        </div>
      )}

      {/* MiniChart */}
      {!enrichment.loading && enrichment.ohlcCandles.length > 0 && (
        <div className="ticker-slug__chart-container">
          <MiniChart
            symbol={ticker.ticker}
            candles={enrichment.ohlcCandles}
            ma20={ma20}
            ma50={ma50}
            gammaWalls={enrichment.gamma?.gamma_walls?.slice(0, 3) || []}
            dpLevels={enrichment.dpLevels}
            maxPain={enrichment.gamma?.max_pain ?? undefined}
            pivotR1={enrichment.confluenceZones[0]?.avg_price}
          />
        </div>
      )}

      {enrichment.loading && (
        <div className="ticker-slug__chart-loading">Loading chart...</div>
      )}

      {/* Quick links */}
      <div className="ticker-slug__quick-links">
        <span className="ticker-slug__link" onClick={() => navigate(`/darkpool?symbol=${ticker.ticker}`)}>
          → Dark Pool
        </span>
        <span className="ticker-slug__link" onClick={() => navigate(`/axlfi?symbol=${ticker.ticker}`)}>
          → AXLFI Intel
        </span>
        <span className="ticker-slug__link" onClick={() => navigate(`/options?symbol=${ticker.ticker}`)}>
          → Options Flow
        </span>
      </div>
    </div>
  );
}
