'use client';

import React, { useEffect, useState } from 'react';
import { useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delta?: {
    value: number;
    isPositive: boolean;
    period?: string;
  };
  detail?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Stat({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  delta,
  detail,
  size = 'md',
  className,
}: StatProps) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    return spring.on('change', (latest) => {
      setDisplayValue(
        latest.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
    });
  }, [spring, decimals]);

  const sizeClasses = {
    sm: {
      value: 'text-xl sm:text-2xl',
      label: 'text-xs',
    },
    md: {
      value: 'text-2xl sm:text-3xl lg:text-4xl',
      label: 'text-xs sm:text-sm',
    },
    lg: {
      value: 'text-3xl sm:text-4xl lg:text-5xl',
      label: 'text-sm sm:text-base',
    },
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <span className={cn('font-medium text-[#C5BDB7] tracking-wide', sizeClasses[size].label)}>
        {label}
      </span>

      <div className="flex items-baseline gap-1 mt-1 font-mono font-bold text-[#F8F9FA] tracking-tight">
        {prefix && <span className="text-[#FE7E3C] select-none">{prefix}</span>}
        <span className={cn('tabular-nums', sizeClasses[size].value)}>{displayValue}</span>
        {suffix && <span className="text-[#C5BDB7] text-lg select-none ml-0.5">{suffix}</span>}
      </div>

      {(delta || detail) && (
        <div className="flex items-center gap-2 mt-2 text-xs">
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-mono font-semibold px-1.5 py-0.5 rounded',
                delta.isPositive
                  ? 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20'
                  : 'text-[#E4201B] bg-[#E4201B]/10 border border-[#E4201B]/20'
              )}
            >
              {delta.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {delta.value}%
            </span>
          )}
          {detail && <span className="text-[#C5BDB7] truncate">{detail}</span>}
        </div>
      )}
    </div>
  );
}

export default Stat;
