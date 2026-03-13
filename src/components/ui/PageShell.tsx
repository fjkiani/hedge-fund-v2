/**
 * PageShell — Sidebar + main content wrapper.
 * Every page composes inside this instead of repeating the flex layout.
 */
import type { ReactNode } from 'react';
import { Sidebar } from '../layout/Sidebar';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <div className="ui-page">
      <Sidebar />
      <main className={`ui-page-main ${className}`}>
        {children}
      </main>
    </div>
  );
}
