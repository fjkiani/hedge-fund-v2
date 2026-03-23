/**
 * MetricBadge — Label + value display primitive
 * Used in sidebar panels for conviction metrics.
 */

interface MetricBadgeProps {
  label: string;
  value: string | number;
  variant?: 'green' | 'purple' | 'red' | 'cyan' | 'default';
}

const VARIANT_CLASS: Record<string, string> = {
  green: 'metric-badge--green',
  purple: 'metric-badge--purple',
  red: 'metric-badge--red',
  cyan: 'metric-badge--cyan',
  default: 'metric-badge--default',
};

export function MetricBadge({ label, value, variant = 'default' }: MetricBadgeProps) {
  return (
    <div className="metric-badge">
      <span className="metric-badge__label">{label}</span>
      <span className={`metric-badge__value ${VARIANT_CLASS[variant] || ''}`}>
        {value}
      </span>
    </div>
  );
}
