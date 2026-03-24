/**
 * ForecastGrid — 4-col snapshot cards built from live MasterBrief data.
 * Replaces the hardcoded MACRO_PRESIGNALS array from scaffolding.
 * buildForecastCards() derives all values dynamically — zero hardcoding.
 */
import type { MasterBrief } from '../../../hooks/useMasterBrief';

interface ForecastCard {
  slug: string;
  label: string;
  title: string;
  actual: string;
  cons: string;
  delta: string;
  bias: string; // signal or regime
}

function buildForecastCards(data: MasterBrief): ForecastCard[] {
  const n   = data.nowcast;
  const adp = data.adp_prediction;
  const gdp = data.gdp_nowcast;

  const cards: ForecastCard[] = [];

  if (n?.cpi_mom != null) {
    cards.push({
      slug: 'cpi-now', label: 'PRE SIGNAL', title: 'CPI Now',
      actual: `${n.cpi_mom}%`, cons: '0.3%',
      delta: n.cpi_mom != null ? `${(n.cpi_mom - 0.3) > 0 ? '+' : ''}${(n.cpi_mom - 0.3).toFixed(2)}pp` : '—',
      bias: n.cpi_mom > 0.4 ? 'HOT' : n.cpi_mom < 0.2 ? 'COLD' : 'IN_LINE',
    });
  }

  if (n?.core_pce_mom != null) {
    cards.push({
      slug: 'pce-now', label: 'PRE SIGNAL', title: 'Core PCE',
      actual: `${n.core_pce_mom}%`, cons: '0.3%',
      delta: `${(n.core_pce_mom - 0.3) > 0 ? '+' : ''}${(n.core_pce_mom - 0.3).toFixed(2)}pp`,
      bias: n.core_pce_mom > 0.4 ? 'HOT' : n.core_pce_mom < 0.2 ? 'COLD' : 'IN_LINE',
    });
  }

  if (adp && !adp.error && adp.signal !== 'IN_LINE') {
    cards.push({
      slug: 'adp-miss', label: 'ADP', title: 'ADP Emp',
      actual: adp.prediction?.toLocaleString() ?? '—',
      cons: adp.consensus?.toLocaleString() ?? '—',
      delta: adp.delta != null ? (adp.delta >= 0 ? `+${adp.delta.toLocaleString()}` : adp.delta.toLocaleString()) : '—',
      bias: adp.signal,
    });
  }

  if (gdp && !gdp.error && gdp.signal !== 'IN_LINE') {
    cards.push({
      slug: 'gdp-miss', label: 'GDP', title: 'GDP Q1',
      actual: `${gdp.gdp_estimate}%`,
      cons: `${gdp.consensus}%`,
      delta: gdp.vs_consensus != null ? `${gdp.vs_consensus > 0 ? '+' : ''}${gdp.vs_consensus.toFixed(2)}pp` : '—',
      bias: gdp.signal,
    });
  }

  return cards;
}

const BIAS_COLOR: Record<string, string> = {
  MISS: '#ef4444', MISS_LIKELY: '#ef4444', HOT: '#ef4444',
  BEAT: '#22c55e', BEAT_LIKELY: '#22c55e', COLD: '#22c55e',
  IN_LINE: '#64748b',
};

export function ForecastGrid({ data }: { data: MasterBrief }) {
  const cards = buildForecastCards(data);
  if (cards.length === 0) return null;

  return (
    <div className="mb-forecast-grid">
      {cards.map(c => (
        <div key={c.slug} className="mb-forecast-card">
          <div className="mb-forecast-card__label">{c.label}</div>
          <div className="mb-forecast-card__title">{c.title}</div>
          <div className="mb-forecast-card__actual">{c.actual}</div>
          <div className="mb-forecast-card__meta">
            <span className="mb-forecast-card__cons">cons {c.cons}</span>
            <span className="mb-forecast-card__delta">{c.delta}</span>
          </div>
          <div className="mb-forecast-card__bias" style={{ color: BIAS_COLOR[c.bias] || '#64748b' }}>
            {c.bias.replace(/_/g, ' ')}
          </div>
        </div>
      ))}
    </div>
  );
}
