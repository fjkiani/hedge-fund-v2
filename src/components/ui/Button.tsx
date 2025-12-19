import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}: ButtonProps) {
  const variantClasses = {
    default: 'bg-accent-blue text-bg-primary hover:bg-accent-blue/80',
    outline: 'border border-border-active text-text-primary hover:bg-bg-hover',
    ghost: 'text-text-primary hover:bg-bg-hover',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`
        rounded-lg font-medium transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

