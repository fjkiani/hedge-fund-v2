/**
 * PreSignalSection — ADP + GDPNow cards (+ Jobless when API provides data)
 * Oracle slice: oracle.sections.pre_signal (shared summary for all cards)
 */
import type { MasterBrief } from '../../../hooks/useMasterBrief';
import { useOracle } from '../OracleContext';

const signalColor = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '#ef4444'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '#22c55e'
  : '#64748b';

const signalIcon = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '🔴'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '🟢'
  : '🟡';

const fmt = (n: number) => n >= 0 ? `+${n.toLocaleString()}` : n.toLocaleString();

// ── ADP Card ──────────────────────────────────────────────────────────────────
function ADPCard({ data }: { data: MasterBrief }) {
  const adp = data.adp_prediction;
  if (!adp || adp.error || adp.signal === 'IN_LINE') return null;

  return (
    <div className="mb-presignal-card">
      <div className="mb-presignal-card__header">
        <span className="mb-presignal-card__icon">{signalIcon(adp.signal)}</span>
        <span className="mb-presignal-card__name">ADP EMPLOYMENT</span>
        <span className="mb-presignal-card__signal" style={{ color: signalColor(adp.signal) }}>
          {adp.signal.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="mb-presignal-metrics">
        <div className="mb-psm"><span className="mb-psm__label">Model</span><span className="mb-psm__value">{adp.prediction?.toLocaleString()}</span></div>
        <div className="mb-psm"><span className="mb-psm__label">Consensus</span><span className="mb-psm__value">{adp.consensus?.toLocaleString()}</span></div>
        <div className="mb-psm">
          <span className="mb-psm__label">Delta</span>
          <span className="mb-psm__value" style={{ color: signalColor(adp.signal) }}>
            {adp.delta != null ? fmt(adp.delta) : '—'}
          </span>
        </div>
        <div className="mb-psm">
          <span className="mb-psm__label">Confidence</span>
          <span className="mb-psm__value">{adp.confidence != null ? `${Math.round(adp.confidence * 100)}%` : '—'}</span>
        </div>
      </div>
      {adp.reasons?.length > 0 && (
        <div className="mb-presignal-reasons">
          {adp.reasons.map((r, i) => <div key={i} className="mb-presignal-reason">· {r}</div>)}
        </div>
      )}
    </div>
  );
}

// ── GDP Card ──────────────────────────────────────────────────────────────────
function GDPCard({ data }: { data: MasterBrief }) {
  const gdp = data.gdp_nowcast;
  if (!gdp || gdp.error || gdp.signal === 'IN_LINE') return null;

  return (
    <div className="mb-presignal-card">
      <div className="mb-presignal-card__header">
        <span className="mb-presignal-card__icon">{signalIcon(gdp.signal)}</span>
        <span className="mb-presignal-card__name">GDP NOWCAST Q1</span>
        <span className="mb-presignal-card__signal" style={{ color: signalColor(gdp.signal) }}>
          {gdp.signal}
        </span>
      </div>
      <div className="mb-presignal-metrics">
        <div className="mb-psm"><span className="mb-psm__label">GDPNow</span><span className="mb-psm__value">{gdp.gdp_estimate}%</span></div>
        <div className="mb-psm"><span className="mb-psm__label">Consensus</span><span className="mb-psm__value">{gdp.consensus}%</span></div>
        <div className="mb-psm">
          <span className="mb-psm__label">Delta</span>
          <span className="mb-psm__value" style={{ color: signalColor(gdp.signal) }}>
            {gdp.vs_consensus != null ? `${gdp.vs_consensus > 0 ? '+' : ''}${gdp.vs_consensus?.toFixed(2)}pp` : '—'}
          </span>
        </div>
        <div className="mb-psm"><span className="mb-psm__label">Source</span><span className="mb-psm__value mb-psm__value--small">Atlanta Fed</span></div>
      </div>
      {gdp.edge && (
        <div className="mb-presignal-reasons">
          <div className="mb-presignal-reason">· {gdp.edge}</div>
        </div>
      )}
    </div>
  );
}

// ── Section export ────────────────────────────────────────────────────────────
export function PreSignalSection({ data }: { data: MasterBrief }) {
  const adp = data.adp_prediction;
  const gdp = data.gdp_nowcast;
  const oracle = useOracle();
  const orcRead = oracle?.sections?.pre_signal;

  const adpVisible = adp && !adp.error && adp.signal !== 'IN_LINE';
  const gdpVisible = gdp && !gdp.error && gdp.signal !== 'IN_LINE';
  if (!adpVisible && !gdpVisible) return null;

  return (
    <div className="mb-panel mb-panel--presignal mb-panel--full">
      <div className="mb-panel__title">⚡ PRE-SIGNAL INTELLIGENCE</div>
      <div className="mb-presignal-grid">
        <ADPCard data={data} />
        <GDPCard data={data} />
      </div>
      {orcRead?.summary && (
        <div className="mb-oracle-read">
          <span className="mb-oracle-read__label">NYX:</span>
          <span className="mb-oracle-read__text">{orcRead.summary}</span>
          {orcRead.confidence != null && (
            <span className="mb-oracle-read__conf">{Math.round(orcRead.confidence * 100)}%</span>
          )}
        </div>
      )}
      {adp?.as_of && (
        <div className="mb-presignal-footer">
          Updated: {new Date(adp.as_of + 'Z').toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true })} ET
        </div>
      )}
    </div>
  );
}
