import type { MasterBrief } from '../../../../hooks/useMasterBrief';

const signalColor = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '#ef4444'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '#22c55e'
  : '#64748b';

const signalIcon = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '🔴'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '🟢'
  : '🟡';

export function GDPCard({ data }: { data: MasterBrief }) {
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
