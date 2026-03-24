/** MacroCommandBar — regime / next event / confidence cap / scan time strip */
import type { MasterBrief } from '../../../hooks/useMasterBrief';

const REGIME_COLOR: Record<string, string> = {
  STAGFLATION: '#ef4444', RECESSION: '#f97316', OVERHEATING: '#eab308',
  GOLDILOCKS: '#22c55e', DEFLATIONARY_BUST: '#8b5cf6', NEUTRAL: '#64748b',
};
const TIER_COLOR: Record<string, string> = {
  BLOCKED: '#ef4444', HIGH_RISK: '#f97316', RISK: '#eab308',
  AWARENESS: '#3b82f6', NORMAL: '#22c55e',
};

export function MacroCommandBar({ data }: { data: MasterBrief }) {
  const regime = data.macro_regime?.regime || 'UNKNOWN';
  const veto   = data.economic_veto || {};
  const cap    = data.kill_chain_state?.confidence_cap ?? 65;

  const regimeColor = REGIME_COLOR[regime] || '#64748b';
  const tierColor   = TIER_COLOR[veto.tier || 'NORMAL'] || '#64748b';

  return (
    <div className="mb-status-bar">
      <div className="mb-status-item" style={{ borderLeft: `3px solid ${regimeColor}` }}>
        <span className="mb-status-label">MACRO REGIME</span>
        <span className="mb-status-value" style={{ color: regimeColor }}>{regime}</span>
      </div>
      <div className="mb-status-item" style={{ borderLeft: `3px solid ${tierColor}` }}>
        <span className="mb-status-label">NEXT EVENT</span>
        <span className="mb-status-value">
          {veto.next_event || 'None'} {veto.hours_away != null ? `${veto.hours_away}h` : ''}
        </span>
      </div>
      <div className="mb-status-item">
        <span className="mb-status-label">CONFIDENCE CAP</span>
        <span className="mb-status-value"
          style={{ color: cap <= 35 ? '#ef4444' : cap <= 55 ? '#eab308' : '#22c55e' }}>
          {cap}%
        </span>
      </div>
      <div className="mb-status-item">
        <span className="mb-status-label">SCAN</span>
        <span className="mb-status-value">{data.scan_time}s</span>
      </div>
    </div>
  );
}
