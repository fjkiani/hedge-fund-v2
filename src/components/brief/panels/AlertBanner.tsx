/** AlertBanner — priority-sorted alert strip */
import type { MasterBriefAlert } from '../../../hooks/useMasterBrief';

export function AlertBanner({ alerts }: { alerts: MasterBriefAlert[] }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="mb-alerts">
      {alerts.map((a, i) => (
        <div key={i} className={`mb-alert mb-alert--${a.priority.toLowerCase()}`}>
          <span className="mb-alert__icon">
            {a.priority === 'CRITICAL' ? '🚨' : a.priority === 'HIGH' ? '⚡' : '📊'}
          </span>
          <span className="mb-alert__type">{a.type.replace(/_/g, ' ')}</span>
          <span className="mb-alert__detail">
            {a.event && <strong>{a.event}</strong>}
            {a.signal && ` → ${a.signal}`}
            {a.edge && ` — ${a.edge}`}
            {a.hours !== undefined && ` (${a.hours}h)`}
          </span>
          {a.action && <span className="mb-alert__action">{a.action}</span>}
        </div>
      ))}
    </div>
  );
}
