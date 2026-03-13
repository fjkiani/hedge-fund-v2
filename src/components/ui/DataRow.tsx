/**
 * DataRow — Flexible row component for alert lists, score entries, trade rows.
 *
 * Composable: icon + primary text + tag + secondary + trailing value.
 * Single component replaces sj-alert-item, sj-score-item, TradeRow, widget-table-row.
 */
import type { ReactNode } from 'react';

type Color = 'green' | 'red' | 'orange' | 'purple' | 'blue' | 'default';

interface DataRowProps {
  /** Emoji or icon string (left side) */
  icon?: string;
  /** Primary text (bold, colored) */
  primary: string;
  /** Color of the primary text */
  primaryColor?: Color;
  /** Small tag badge next to primary */
  tag?: string;
  /** Secondary description below primary */
  secondary?: string;
  /** Detail line below secondary (monospace) */
  detail?: string;
  /** Trailing text (right side, monospace, muted) */
  trailing?: string;
  /** Highlighted value (right side, large, colored) */
  value?: string;
  /** Whether value is positive (green) or negative (red) */
  valueUp?: boolean;
  /** Left slot for custom content (e.g. StatusBadge) */
  leftSlot?: ReactNode;
}

export function DataRow({
  icon,
  primary,
  primaryColor = 'default',
  tag,
  secondary,
  detail,
  trailing,
  value,
  valueUp,
  leftSlot,
}: DataRowProps) {
  return (
    <div className="ui-data-row">
      {leftSlot}
      {icon && <span className="ui-data-row__icon">{icon}</span>}
      <div className="ui-data-row__body">
        <div className="ui-data-row__top">
          <span className={`ui-data-row__primary ui-data-row__primary--${primaryColor}`}>
            {primary}
          </span>
          {tag && <span className="ui-data-row__tag">{tag}</span>}
        </div>
        {secondary && <p className="ui-data-row__secondary">{secondary}</p>}
        {detail && <div className="ui-data-row__detail">{detail}</div>}
      </div>
      {value && (
        <span className={`ui-data-row__value ${valueUp ? 'ui-data-row__value--up' : 'ui-data-row__value--down'}`}>
          {value}
        </span>
      )}
      {trailing && <span className="ui-data-row__trailing">{trailing}</span>}
    </div>
  );
}

/**
 * DataList — Container for DataRow items.
 */
interface DataListProps {
  scrollable?: boolean;
  children: ReactNode;
}

export function DataList({ scrollable, children }: DataListProps) {
  return (
    <div className={`ui-data-list ${scrollable ? 'ui-data-list--scrollable' : ''}`}>
      {children}
    </div>
  );
}
