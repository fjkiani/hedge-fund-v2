/**
 * EcoSignalsPanel — PMI + UMich Sentiment + UMich Expectations + Current Account
 * New signals added by backend. Rendered below TacticalSection.
 * Hidden entirely if all signals are IN_LINE or data absent.
 */
import type { MasterBrief } from '../../../hooks/useMasterBrief';

const signalColor = (sig: string) =>
  ['MISS_LIKELY', 'MISS', 'WEAK', 'BELOW_CONSENSUS', 'CONTRACTION'].includes(sig) ? '#ef4444'
  : ['BEAT_LIKELY', 'BEAT', 'STRONG', 'ABOVE_CONSENSUS', 'EXPANSION'].includes(sig) ? '#22c55e'
  : '#64748b';

const SIGNAL_ICON: Record<string, string> = {
  MISS: '🔴', MISS_LIKELY: '🔴', WEAK: '🔴', BELOW_CONSENSUS: '🔴', CONTRACTION: '🔴',
  BEAT: '🟢', BEAT_LIKELY: '🟢', STRONG: '🟢', ABOVE_CONSENSUS: '🟢', EXPANSION: '🟢',
};
const icon = (sig: string) => SIGNAL_ICON[sig] ?? '🟡';

function EcoSignalCard({ title, signal, confidence, edge, children }: {
  title: string;
  signal: string;
  confidence: number | null;
  edge: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-presignal-card">
      <div className="mb-presignal-card__header">
        <span className="mb-presignal-card__icon">{icon(signal)}</span>
        <span className="mb-presignal-card__name">{title}</span>
        <span className="mb-presignal-card__signal" style={{ color: signalColor(signal) }}>
          {signal.replace(/_/g, ' ')}
        </span>
      </div>
      {confidence != null && (
        <div className="mb-presignal-metrics">
          <div className="mb-psm">
            <span className="mb-psm__label">Confidence</span>
            <span className="mb-psm__value">{Math.round(confidence * 100)}%</span>
          </div>
        </div>
      )}
      {children}
      {edge && <div className="mb-presignal-reasons"><div className="mb-presignal-reason">· {edge}</div></div>}
    </div>
  );
}

export function EcoSignalsPanel({ data }: { data: MasterBrief }) {
  const pmi   = data.pmi;
  const ca    = data.current_account;
  const umich = data.umich_sentiment;
  const uexp  = data.umich_expectations;

  const cards = [
    pmi   && !pmi.error   && pmi.signal   !== 'IN_LINE',
    ca    && !ca.error    && ca.signal    !== 'IN_LINE',
    umich && !umich.error && umich.signal !== 'IN_LINE',
    uexp  && !uexp.error  && uexp.signal  !== 'IN_LINE',
  ].filter(Boolean);

  if (cards.length === 0) return null;

  return (
    <div className="mb-panel mb-panel--eco-signals mb-panel--full">
      <div className="mb-panel__title">🌐 ECO SIGNALS</div>
      <div className="mb-presignal-grid">

        {pmi && !pmi.error && pmi.signal !== 'IN_LINE' && (
          <EcoSignalCard title="PMI" signal={pmi.signal} confidence={pmi.confidence ?? null} edge={pmi.edge ?? null}>
            {pmi.series && (
              <div className="mb-presignal-metrics">
                {pmi.series.pmi_mfg && <div className="mb-psm"><span className="mb-psm__label">Mfg</span><span className="mb-psm__value" style={{ color: signalColor(pmi.series.pmi_mfg.signal) }}>{pmi.series.pmi_mfg.signal}</span></div>}
                {pmi.series.pmi_svcs && <div className="mb-psm"><span className="mb-psm__label">Svcs</span><span className="mb-psm__value" style={{ color: signalColor(pmi.series.pmi_svcs.signal) }}>{pmi.series.pmi_svcs.signal}</span></div>}
                {pmi.series.pmi_comp && <div className="mb-psm"><span className="mb-psm__label">Comp</span><span className="mb-psm__value" style={{ color: signalColor(pmi.series.pmi_comp.signal) }}>{pmi.series.pmi_comp.signal}</span></div>}
              </div>
            )}
          </EcoSignalCard>
        )}

        {ca && !ca.error && ca.signal !== 'IN_LINE' && (
          <EcoSignalCard title="CURRENT ACCOUNT" signal={ca.signal} confidence={null} edge={ca.edge ?? null}>
            <div className="mb-presignal-metrics">
              {ca.consensus != null && <div className="mb-psm"><span className="mb-psm__label">Consensus</span><span className="mb-psm__value">{ca.consensus}B</span></div>}
              {ca.delta != null && <div className="mb-psm"><span className="mb-psm__label">Delta</span><span className="mb-psm__value" style={{ color: signalColor(ca.signal) }}>{ca.delta > 0 ? `+${ca.delta.toFixed(1)}` : ca.delta.toFixed(1)}B</span></div>}
              {ca.sigma != null && <div className="mb-psm"><span className="mb-psm__label">σ</span><span className="mb-psm__value">{ca.sigma.toFixed(2)}σ</span></div>}
            </div>
          </EcoSignalCard>
        )}

        {umich && !umich.error && umich.signal !== 'IN_LINE' && (
          <EcoSignalCard title="UMICH SENTIMENT" signal={umich.signal} confidence={umich.confidence ?? null} edge={umich.edge ?? null}>
            <div className="mb-presignal-metrics">
              {umich.consensus != null && <div className="mb-psm"><span className="mb-psm__label">Consensus</span><span className="mb-psm__value">{umich.consensus}</span></div>}
              {umich.delta != null && <div className="mb-psm"><span className="mb-psm__label">Delta</span><span className="mb-psm__value" style={{ color: signalColor(umich.signal) }}>{umich.delta > 0 ? `+${umich.delta.toFixed(1)}` : umich.delta.toFixed(1)}</span></div>}
            </div>
          </EcoSignalCard>
        )}

        {uexp && !uexp.error && uexp.signal !== 'IN_LINE' && (
          <EcoSignalCard title="UMICH EXPECTATIONS" signal={uexp.signal} confidence={uexp.confidence ?? null} edge={uexp.edge ?? null}>
            <div className="mb-presignal-metrics">
              {uexp.consensus != null && <div className="mb-psm"><span className="mb-psm__label">Consensus</span><span className="mb-psm__value">{uexp.consensus}</span></div>}
              {uexp.delta != null && <div className="mb-psm"><span className="mb-psm__label">Delta</span><span className="mb-psm__value" style={{ color: signalColor(uexp.signal) }}>{uexp.delta > 0 ? `+${uexp.delta.toFixed(1)}` : uexp.delta.toFixed(1)}</span></div>}
            </div>
          </EcoSignalCard>
        )}

      </div>
    </div>
  );
}
