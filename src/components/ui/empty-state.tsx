import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  /**
   * Compact variant for use inside cards or panels.
   * Full variant (default) is centered with generous vertical padding.
   */
  variant?: 'full' | 'compact';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'full',
  className,
}: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {/* Icon container */}
      <div
        aria-hidden="true"
        className={cn(
          'rounded-2xl flex items-center justify-center mb-4',
          isCompact ? 'w-10 h-10 rounded-xl' : 'w-14 h-14',
        )}
        style={{ background: '#F1F5F9' }}
      >
        <Icon
          className={cn(isCompact ? 'w-5 h-5' : 'w-6 h-6')}
          style={{ color: '#94A3B8' }}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-slate-900 mb-1.5',
          isCompact ? 'text-sm' : 'text-[15px]'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={cn(
          'text-slate-500 max-w-[280px] leading-relaxed',
          isCompact ? 'text-xs' : 'text-sm',
        )}
      >
        {description}
      </p>

      {/* Action */}
      {action && (
        <div className={cn('flex items-center justify-center', isCompact ? 'mt-4' : 'mt-6')}>
          {action}
        </div>
      )}
    </div>
  );
}
