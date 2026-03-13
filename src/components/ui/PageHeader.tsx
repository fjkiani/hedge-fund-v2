/**
 * PageHeader — Page title + subtitle + optional right-side actions.
 * Replaces the inline style={{}} objects in Feds, Politicians, Signals.
 */
import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="ui-page-header">
      <div>
        <div className="ui-page-header__left">
          {icon && <span className="ui-page-header__icon">{icon}</span>}
          <h1 className="ui-page-header__title">{title}</h1>
        </div>
        {subtitle && <p className="ui-page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
