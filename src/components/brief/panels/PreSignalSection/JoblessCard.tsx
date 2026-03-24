import type { MasterBrief } from '../../../../hooks/useMasterBrief';

const signalColor = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '#ef4444'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '#22c55e'
  : '#64748b';

const signalIcon = (sig: string) =>
  sig === 'MISS_LIKELY' || sig === 'MISS' ? '🔴'
  : sig === 'BEAT_LIKELY' || sig === 'BEAT' ? '🟢'
  : '🟡';

export function JoblessCard({ data }: { data: MasterBrief }) {
  const jc = data.jobless_claims;
  if (!jc || jc.error || jc.signal === 'IN_LINE') return null;

  return (
    <div className="mb-presignal-card">
      <div className="mb-presignal-card__header">
        <span className="mb-presignal-card__icon">{signalIcon(jc.signal)}</span>
        <span className="mb-presignal-card__name">JOBLESS CLAIMS</span>
        <span className="mb-presignal-card__signal" style={{ color: signalColor(jc.signal) }}>
          {jc.signal.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="mb-presignal-metrics">
        {jc.icsa_latest    != null && <div className="mb-psm"><span className="mb-psm__label">ICSA Latest</span><span className="mb-psm__value">{jc.icsa_latest.toLocaleString()}</span></div>}
        {jc.icsa_4wk_avg   != null && <div className="mb-psm"><span className="mb-psm__label">4-Wk Avg</span><span className="mb-psm__value">{jc.icsa_4wk_avg.toLocaleString()}</span></div>}
        {jc.consensus      != null && <div className="mb-psm"><span className="mb-psm__label">Consensus</span><span className="mb-psm__value">{jc.consensus.toLocaleString()}</span></div>}
        {jc.delta          != null && (
          <div className="mb-psm">
            <span className="mb-psm__label">Delta</span>
            <span className="mb-psm__value" style={{ color: signalColor(jc.signal) }}>
              {jc.delta >= 0 ? `+${jc.delta.toLocaleString()}` : jc.delta.toLocaleString()}
            </span>
          </div>
        )}
        {jc.confidence     != null && <div className="mb-psm"><span className="mb-psm__label">Confidence</span><span className="mb-psm__value">{Math.round(jc.confidence * 100)}%</span></div>}
      </div>
      {jc.edge    && <div className="mb-presignal-reasons"><div className="mb-presignal-reason">· {jc.edge}</div></div>}
      {jc.reasons?.length > 0 && (
        <div className="mb-presignal-reasons">
          {jc.reasons.map((r, i) => <div key={i} className="mb-presignal-reason">· {r}</div>)}
        </div>
      )}
    </div>
  );
}
