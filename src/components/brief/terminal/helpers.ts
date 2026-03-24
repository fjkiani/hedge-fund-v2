import { MasterBrief } from '../../../hooks/useMasterBrief';

export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—';
  return decimals > 0 ? n.toFixed(decimals) : n.toLocaleString();
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n}%`;
}

export function fmtUsd(n: number | null | undefined): string {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtGex(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n / 1e6).toFixed(1)}M`;
}

export function buildForecastCards(data: MasterBrief) {
  const cards: Array<{
    slug: string; label: string; title: string;
    actual: string; cons: string; delta: string;
    bias: string; note: string; color: string;
  }> = [];

  const nc = data.nowcast;
  if (nc && !('error' in nc && nc.error)) {
    cards.push({
      slug: 'uni-cpi-now', label: 'PRE SIGNAL', title: 'CPI Now',
      actual: `${nc.cpi_mom}%`, cons: '0.3%',
      delta: `+${(nc.cpi_mom - 0.3).toFixed(2)}%`,
      bias: nc.cpi_mom > 0.3 ? 'PRE_HOT' : 'IN_LINE',
      note: 'Monitor TLT/SPY puts', color: '#f97316',
    });
    cards.push({
      slug: 'uni-pce-now', label: 'PRE SIGNAL', title: 'Core PCE',
      actual: `${nc.pce_mom}%`, cons: '0.3%',
      delta: `+${(nc.pce_mom - 0.3).toFixed(2)}%`,
      bias: nc.pce_mom > 0.3 ? 'PRE_HOT' : 'IN_LINE',
      note: "Fed's preferred gauge", color: '#f97316',
    });
  }

  const adp = data.adp_prediction;
  if (adp && !adp.error) {
    cards.push({
      slug: 'uni-adp-miss', label: 'ADP PRESIGNAL', title: 'ADP Emp',
      actual: fmt(adp.prediction), cons: fmt(adp.consensus),
      delta: fmt(adp.delta),
      bias: adp.signal || 'UNKNOWN',
      note: 'Position accordingly', color: '#f43f5e',
    });
  }

  const gdp = data.gdp_nowcast;
  if (gdp && !gdp.error) {
    cards.push({
      slug: 'uni-gdp-miss', label: 'GDP PRESIGNAL', title: 'GDP Q1',
      actual: `${gdp.gdp_estimate}%`, cons: `${gdp.consensus}%`,
      delta: `${gdp.vs_consensus?.toFixed(2)}pp`,
      bias: gdp.signal || 'UNKNOWN',
      note: 'Growth warning', color: '#f43f5e',
    });
  }

  return cards;
}

export function buildDivergenceCards(data: MasterBrief) {
  const signals = data.hidden_hands?.finnhub_signals ?? [];
  return signals.slice(0, 4).map((s: any, i: number) => ({
    slug: `uni-hh-${i}`,
    title: 'HIDDEN HANDS',
    actor: `${s.politician_action?.charAt(0).toUpperCase()}${s.politician_action?.slice(1)} ${s.ticker}`,
    mspr: s.insider_mspr != null ? (s.insider_mspr > 0 ? `+${s.insider_mspr.toFixed(0)}` : `${s.insider_mspr.toFixed(0)}`) : '—',
    divergence: s.convergence?.replace('STRONG_', '') || 'N/A',
    note: s.reasoning?.[0]?.substring(0, 40) || 'monitor signal',
    color: s.convergence === 'DIVERGENCE' ? '#f43f5e' : '#3b82f6',
  }));
}
