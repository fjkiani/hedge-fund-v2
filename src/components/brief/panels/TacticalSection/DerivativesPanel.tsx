import type { MasterBrief } from '../../../../hooks/useMasterBrief';
import { useOracle } from '../../OracleContext';
import { OracleRead } from '../OracleRead';
import { buildCOTSummary } from './derivativesHelpers';

export function DerivativesPanel({ data }: { data: MasterBrief }) {
  const d      = data.derivatives;
  const oracle = useOracle();
  if (!d || d.error) return (
    <div className="mb-panel mb-panel--deriv">
      <div className="mb-panel__error">Derivatives unavailable</div>
    </div>
  );

  const isNegGamma = d.gex_regime?.toUpperCase().includes('NEGATIVE');
  const cotSummary = buildCOTSummary(d);

  return (
    <div className="mb-panel mb-panel--deriv">
      <div className="mb-panel__title">📉 DERIVATIVES</div>
      <div className="mb-deriv-grid">
        <div className="mb-metric">
          <span className="mb-metric__label">GEX Regime</span>
          <span className={`mb-metric__value ${isNegGamma ? 'mb-metric--hot' : 'mb-metric--cool'}`}>
            {d.gex_regime || 'N/A'}
          </span>
        </div>
        <div className="mb-metric">
          <span className="mb-metric__label">Total GEX</span>
          <span className="mb-metric__value">{d.total_gex ? (d.total_gex / 1e6).toFixed(1) + 'M' : 'N/A'}</span>
        </div>
        {d.put_wall  && <div className="mb-metric"><span className="mb-metric__label">Put Wall</span><span className="mb-metric__value">${d.put_wall}</span></div>}
        {d.call_wall && <div className="mb-metric"><span className="mb-metric__label">Call Wall</span><span className="mb-metric__value">${d.call_wall}</span></div>}
        {d.spot > 0  && <div className="mb-metric"><span className="mb-metric__label">SPY Spot</span><span className="mb-metric__value">${d.spot?.toFixed(2)}</span></div>}
      </div>
      {cotSummary && (
        <div className="mb-cot-strip">
          <span className="mb-cot-label">COT ES Specs:</span>
          <span className={`mb-cot-value ${d.cot_spec_net! < 0 ? 'mb-metric--cold' : 'mb-metric--hot'}`}>
            {cotSummary}
          </span>
          {d.cot_trap && <span className="mb-cot-trap">{d.cot_trap}</span>}
        </div>
      )}
      <OracleRead section={oracle?.sections?.derivatives} />
    </div>
  );
}
