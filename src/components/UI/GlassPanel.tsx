'use client';
import { HTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  blur?: 'sm' | 'md' | 'lg';
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ children, glow, blur = 'md', className, ...props }, ref) => {
    const blurMap = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
    };

    return (
      <div
        ref={ref}
        className={twMerge(
          'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]',
          blurMap[blur],
          glow && 'shadow-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';
