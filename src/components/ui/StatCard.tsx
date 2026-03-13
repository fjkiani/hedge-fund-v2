/**
 * StatCard — Large metric card with value, label, and color variant.
 * Used in scorecard grids, overview stats, etc.
 */

type Variant = 'default' | 'green' | 'red' | 'blue' | 'orange' | 'purple';

interface StatCardProps {
  value: string | number;
  label: string;
  variant?: Variant;
}

export function StatCard({ value, label, variant = 'default' }: StatCardProps) {
  const cardClass = variant !== 'default' ? `ui-stat--${variant}` : '';
  const valueClass = `ui-stat__value--${variant}`;

  return (
    <div className={`ui-stat ${cardClass}`}>
      <div className={`ui-stat__value ${valueClass}`}>{value}</div>
      <div className="ui-stat__label">{label}</div>
    </div>
  );
}

/**
 * StatGrid — Container for StatCard items.
 */
interface StatGridProps {
  columns?: 3 | 4 | 5;
  children: React.ReactNode;
}

export function StatGrid({ columns = 5, children }: StatGridProps) {
  return (
    <div className={`ui-stat-grid ui-stat-grid--${columns}`}>
      {children}
    </div>
  );
}
