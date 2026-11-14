'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-gradient-to-r from-[#1A2C30]/90 via-[#0E6873]/25 to-[#61413C]/25 border border-[rgba(97,65,60,0.25)] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[rgba(254,126,60,0.15)] before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

export default Skeleton;
