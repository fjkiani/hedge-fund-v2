/**
 * PageShell — Sidebar + main content wrapper.
 * Every page composes inside this instead of repeating the flex layout.
 */
import type { ReactNode } from 'react';
import { Sidebar } from '../layout/Sidebar';
import { DataBlindBanner } from './DataBlindBanner';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Hide the feed-integrity banner (rare; default shows blindness). */
  hideBlindBanner?: boolean;
}

export function PageShell({ children, className = '', hideBlindBanner = false }: PageShellProps) {
  return (
    <div className="ui-page">
      <Sidebar />
      <main className={`ui-page-main ${className}`}>
        {!hideBlindBanner && <DataBlindBanner />}
        {children}
      </main>
    </div>
  );
}
