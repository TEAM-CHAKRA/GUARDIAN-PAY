'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlowButton from './GlowButton';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-[rgba(97,65,60,0.35)] bg-[#0E6873]/15 backdrop-blur-md',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#0E6873]/30 border border-[rgba(254,126,60,0.3)] flex items-center justify-center text-[#FE7E3C] mb-4 shadow-[0_0_20px_rgba(254,126,60,0.15)]">
        {icon || <ShieldAlert className="w-7 h-7" />}
      </div>
      <h4 className="font-display text-base sm:text-lg font-bold text-[#F8F9FA] tracking-tight">
        {title}
      </h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#C5BDB7] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <GlowButton variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </GlowButton>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
