import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  requireConfirmation?: boolean;
  confirmationMessage?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      className, 
      variant = 'primary', 
      size = 'md', 
      loading = false, 
      leftIcon, 
      rightIcon, 
      requireConfirmation,
      confirmationMessage = 'Are you sure you want to perform this action?',
      onClick,
      disabled,
      children,
      ...props 
    }, 
    ref
  ) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none rounded-lg';
    
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
      secondary: 'bg-surface-muted text-text-primary border border-border hover:bg-border/50',
      danger: 'bg-danger text-white hover:bg-danger-hover shadow-sm',
      ghost: 'text-text-secondary hover:text-primary hover:bg-primary-soft',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 py-3 text-base',
      icon: 'h-10 w-10',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault();
        return;
      }
      
      if (requireConfirmation) {
        if (!window.confirm(confirmationMessage)) {
          e.preventDefault();
          return;
        }
      }
      
      if (onClick) onClick(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
        {!loading && leftIcon && <span className="mr-2 shrink-0">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';
