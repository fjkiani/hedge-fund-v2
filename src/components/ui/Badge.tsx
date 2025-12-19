import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'bullish' | 'bearish' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const variantClasses = {
    bullish: 'badge-bullish',
    bearish: 'badge-bearish',
    neutral: 'badge-neutral',
  };
  
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

