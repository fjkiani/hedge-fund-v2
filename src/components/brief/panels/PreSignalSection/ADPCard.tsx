import type { MasterBrief } from '../../../../hooks/useMasterBrief';

const signalColor = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '#ef4444'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '#22c55e'
  : '#64748b';

const signalIcon = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '🔴'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '🟢'
  : '🟡';

const fmt = (n: number) => n >= 0 ? `+${n.toLocaleString()}` : n.toLocaleString();

export function ADPCard({ data }: { data: MasterBrief }) {
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
        <div className="mb-psm"><span className="mb-psm__label">Confidence</span><span className="mb-psm__value">{adp.confidence != null ? `${Math.round(adp.confidence * 100)}%` : '—'}</span></div>
      </div>
      {adp.reasons?.length > 0 && (
        <div className="mb-presignal-reasons">
          {adp.reasons.map((r, i) => <div key={i} className="mb-presignal-reason">· {r}</div>)}
        </div>
      )}
    </div>
  );
}
