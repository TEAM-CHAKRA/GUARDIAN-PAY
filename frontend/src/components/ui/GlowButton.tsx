'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlowButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'copper';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...motionProps
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3.5 py-1.5 text-xs font-medium gap-1.5 rounded-lg min-h-[36px]',
      md: 'px-5 py-2.5 text-sm font-semibold gap-2 rounded-xl min-h-[44px]',
      lg: 'px-7 py-3.5 text-base font-semibold gap-2.5 rounded-xl min-h-[52px]',
    };

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-[#FE7E3C] via-[#FF9254] to-[#E4201B] text-[#1A2C30] font-bold shadow-[0_0_20px_rgba(254,126,60,0.35)] hover:shadow-[0_0_30px_rgba(254,126,60,0.55)] border border-[rgba(255,255,255,0.25)]',
      secondary:
        'bg-[#0E6873]/40 backdrop-blur-md text-[#F8F9FA] border border-[rgba(14,104,115,0.45)] shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-[rgba(254,126,60,0.5)] hover:bg-[#0E6873]/60 hover:shadow-[0_0_20px_rgba(14,104,115,0.3)]',
      copper:
        'bg-[#61413C]/40 backdrop-blur-md text-[#F8F9FA] border border-[rgba(97,65,60,0.5)] shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-[rgba(254,126,60,0.5)] hover:bg-[#61413C]/70',
      danger:
        'bg-gradient-to-r from-[#E4201B] to-[#9E1410] text-white shadow-[0_0_20px_rgba(228,32,27,0.35)] hover:shadow-[0_0_30px_rgba(228,32,27,0.55)] border border-[rgba(255,255,255,0.2)]',
      ghost:
        'bg-transparent text-[#C5BDB7] hover:text-[#FE7E3C] hover:bg-[#0E6873]/20 border border-transparent',
    };

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        initial="initial"
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        disabled={isDisabled}
        className={cn(
          'group relative inline-flex items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-[#FE7E3C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A2C30] transition-all duration-200 cursor-pointer overflow-hidden',
          sizeClasses[size],
          variantClasses[variant],
          isDisabled &&
            'opacity-50 cursor-not-allowed pointer-events-none filter grayscale-[30%]',
          className
        )}
        {...motionProps}
      >
        {/* Subtle light sweep across the surface on hover */}
        {!isDisabled && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-[100%] w-[100%] -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent z-10"
            variants={{
              initial: { left: '-100%' },
              hover: { left: '200%' },
            }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
          />
        )}

        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0 relative z-10">{leftIcon}</span>}
            <span className="relative z-10">{children}</span>
            {rightIcon && <span className="inline-flex shrink-0 relative z-10">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

GlowButton.displayName = 'GlowButton';

export default GlowButton;
