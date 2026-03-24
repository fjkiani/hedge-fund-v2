import type { MasterBrief } from '../../../../hooks/useMasterBrief';
import { useOracle } from '../../OracleContext';
import { OracleRead } from '../OracleRead';

const ALERT_COLORS: Record<string, string> = {
  RED:    '#ef4444',
  YELLOW: '#eab308',
  GREEN:  '#22c55e',
  ORANGE: '#f97316',
};

export function KillChainPanel({ data }: { data: MasterBrief }) {
  const kc     = data.kill_chain_state;
  const oracle = useOracle();
  if (!kc || kc.error) return (
    <div className="mb-panel mb-panel--kc">
      <div className="mb-panel__error">Kill Chain unavailable</div>
    </div>
  );

  const alertColor = ALERT_COLORS[kc.alert_level] ?? '#64748b';
  const capColor   = kc.confidence_cap <= 35 ? '#ef4444' : kc.confidence_cap <= 55 ? '#eab308' : '#22c55e';

  return (
    <div className="mb-panel mb-panel--kc">
      <div className="mb-panel__title">⚔️ KILL CHAIN</div>
      <div className="mb-kc-grid">
        <div className="mb-metric">
          <span className="mb-metric__label">Alert Level</span>
          <span className="mb-metric__value" style={{ color: alertColor }}>{kc.alert_level || 'UNKNOWN'}</span>
        </div>
        <div className="mb-metric">
          <span className="mb-metric__label">Layers Active</span>
          <span className="mb-metric__value">{kc.layers_active}/5</span>
        </div>
        <div className="mb-metric">
          <span className="mb-metric__label">Confidence Cap</span>
          <span className="mb-metric__value" style={{ color: capColor }}>{kc.confidence_cap}%</span>
        </div>
        {kc.cap_reason      && <div className="mb-metric"><span className="mb-metric__label">Cap Reason</span><span className="mb-metric__value mb-metric--small">{kc.cap_reason}</span></div>}
        {kc.regime_modifier !== 0 && <div className="mb-metric"><span className="mb-metric__label">Regime Mod</span><span className="mb-metric__value mb-metric--hot">{kc.regime_modifier}%</span></div>}
        {kc.mismatches_count > 0  && <div className="mb-metric"><span className="mb-metric__label">Mismatches</span><span className="mb-metric__value mb-metric--hot">{kc.mismatches_count}</span></div>}
      </div>
      {kc.narrative && <div className="mb-kc-narrative">{kc.narrative}</div>}
      <OracleRead section={oracle?.sections?.kill_chain} />
    </div>
  );
}
