'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  color?: 'cyan' | 'blue' | 'violet' | 'orange' | 'lagoon' | 'copper' | 'success' | 'warning' | 'danger';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  color = 'orange',
  height = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorGradients: Record<string, string> = {
    orange: 'from-[#FE7E3C] to-[#E4201B] shadow-[0_0_12px_rgba(254,126,60,0.4)]',
    cyan: 'from-[#FE7E3C] to-[#E4201B] shadow-[0_0_12px_rgba(254,126,60,0.4)]',
    blue: 'from-[#0E6873] to-[#FE7E3C] shadow-[0_0_12px_rgba(14,104,115,0.4)]',
    lagoon: 'from-[#0E6873] to-[#FE7E3C] shadow-[0_0_12px_rgba(14,104,115,0.4)]',
    violet: 'from-[#61413C] to-[#FE7E3C] shadow-[0_0_12px_rgba(97,65,60,0.4)]',
    copper: 'from-[#61413C] to-[#FE7E3C] shadow-[0_0_12px_rgba(97,65,60,0.4)]',
    success: 'from-[#10B981] to-[#0E6873] shadow-[0_0_12px_rgba(16,185,129,0.4)]',
    warning: 'from-[#FE7E3C] to-[#61413C] shadow-[0_0_12px_rgba(254,126,60,0.4)]',
    danger: 'from-[#E4201B] to-[#9E1410] shadow-[0_0_12px_rgba(228,32,27,0.4)]',
  };

  const activeGradient = colorGradients[color] || colorGradients.orange;

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-mono text-[#C5BDB7]">
          <span>Progress</span>
          <span className="font-bold text-[#F8F9FA]">{clamped}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-[#122023] border border-[rgba(97,65,60,0.35)] overflow-hidden p-0.5',
          heightClasses[height]
        )}
      >
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', activeGradient)}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
