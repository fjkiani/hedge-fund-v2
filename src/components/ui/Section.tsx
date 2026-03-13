/**
 * Section — Card wrapper with header, optional count badge, and optional refresh.
 * Replaces raw bg-bg-secondary / sj-section / card patterns.
 */
import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  count?: number;
  countLabel?: string;
  onRefresh?: () => void;
  children: ReactNode;
  className?: string;
}

export function Section({ title, count, countLabel, onRefresh, children, className = '' }: SectionProps) {
  return (
    <div className={`ui-section ${className}`}>
      <div className="ui-section__header">
        <h2 className="ui-section__title">{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {count !== undefined && (
            <span className="ui-section__count">
              {count} {countLabel || 'items'}
            </span>
          )}
          {onRefresh && (
            <button onClick={onRefresh} className="ui-section__refresh">
              ↻ Refresh
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
