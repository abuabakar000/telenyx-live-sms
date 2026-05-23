import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

export function Badge({ className, variant = 'primary', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border backdrop-blur-sm',
        {
          'bg-red-500/10 text-red-400 border-red-500/20': variant === 'primary',
          'bg-zinc-900 text-zinc-300 border-zinc-800': variant === 'secondary',
          'bg-emerald-500/10 text-emerald-300 border-emerald-500/20': variant === 'success',
          'bg-red-500/10 text-red-300 border-red-500/20': variant === 'danger',
          'bg-amber-500/10 text-amber-300 border-amber-500/20': variant === 'warning',
          'bg-sky-500/10 text-sky-300 border-sky-500/20': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}
