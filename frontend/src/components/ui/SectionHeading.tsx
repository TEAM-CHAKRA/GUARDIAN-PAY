'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeadingProps {
  badge?: string;
  title: string;
  gradientWord?: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeading({
  badge,
  title,
  gradientWord,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  const parts = gradientWord ? title.split(gradientWord) : [title];

  return (
    <div
      className={cn(
        'flex flex-col',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      {badge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(254,126,60,0.35)] shadow-[0_0_15px_rgba(254,126,60,0.15)] mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FE7E3C] animate-pulse" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#FE7E3C]">
            {badge}
          </span>
        </div>
      )}

      <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F8F9FA] max-w-3xl leading-[1.15]">
        {parts.length > 1 ? (
          <>
            {parts[0]}
            <span className="text-gradient-primary">{gradientWord}</span>
            {parts[1]}
          </>
        ) : (
          title
        )}
      </h2>

      {description && (
        <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-[#C5BDB7] max-w-2xl font-sans leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

export default SectionHeading;
