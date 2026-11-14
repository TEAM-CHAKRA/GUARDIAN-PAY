'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'interactive' | 'accent' | 'copper';
  hoverGlow?: boolean;
  tilt?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      hoverGlow = false,
      tilt,
      padding = 'md',
      children,
      className,
      onMouseMove,
      onMouseLeave,
      style,
      ...motionProps
    },
    forwardedRef
  ) => {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Spring-smoothed tilt physics
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 180, mass: 0.5 };
    const rotateXSpring = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springConfig);
    const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), springConfig);

    const shouldTilt = tilt !== undefined ? tilt : variant === 'interactive';

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const el = cardRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          el.style.setProperty('--mx', `${x}px`);
          el.style.setProperty('--my', `${y}px`);

          if (shouldTilt) {
            mouseX.set(x / rect.width - 0.5);
            mouseY.set(y / rect.height - 0.5);
          }
        }
        setIsHovered(true);
        if (onMouseMove) onMouseMove(e);
      },
      [shouldTilt, mouseX, mouseY, onMouseMove]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        setIsHovered(false);
        if (shouldTilt) {
          mouseX.set(0);
          mouseY.set(0);
        }
        if (onMouseLeave) onMouseLeave(e);
      },
      [shouldTilt, mouseX, mouseY, onMouseLeave]
    );

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3 sm:p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
      xl: 'p-8 sm:p-10',
    };

    const variantClasses = {
      default:
        'bg-gradient-to-b from-[#1A2C30]/85 to-[#0E6873]/20 backdrop-blur-xl border border-[rgba(97,65,60,0.45)] shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_rgba(248,249,250,0.06)] hover:border-[rgba(254,126,60,0.45)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(14,104,115,0.2)]',
      elevated:
        'bg-gradient-to-b from-[#16363B]/90 to-[#1A2C30]/85 backdrop-blur-2xl border border-[rgba(14,104,115,0.45)] shadow-[0_16px_48px_0_rgba(0,0,0,0.65),0_0_28px_rgba(14,104,115,0.15),inset_0_1px_0_rgba(248,249,250,0.08)] hover:border-[rgba(254,126,60,0.5)]',
      interactive:
        'bg-gradient-to-b from-[#1A2C30]/80 via-[#0E6873]/15 to-[#1A2C30]/90 backdrop-blur-xl border border-[rgba(97,65,60,0.45)] shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_rgba(248,249,250,0.06)] hover:border-[rgba(254,126,60,0.6)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.7),0_0_24px_rgba(254,126,60,0.22)] cursor-pointer transition-colors duration-300',
      accent:
        'bg-gradient-to-b from-[#0E6873]/35 to-[#1A2C30]/90 backdrop-blur-xl border border-[rgba(254,126,60,0.4)] shadow-[0_12px_36px_rgba(0,0,0,0.55),0_0_30px_rgba(254,126,60,0.18),inset_0_1px_0_rgba(248,249,250,0.08)] hover:border-[rgba(254,126,60,0.65)]',
      copper:
        'bg-gradient-to-b from-[#61413C]/25 to-[#1A2C30]/85 backdrop-blur-xl border border-[rgba(97,65,60,0.55)] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(248,249,250,0.06)] hover:border-[rgba(254,126,60,0.5)]',
    };

    return (
      <div style={{ perspective: shouldTilt ? 1000 : undefined }} className="contents">
        <motion.div
          ref={(node) => {
            cardRef.current = node;
            if (typeof forwardedRef === 'function') {
              forwardedRef(node);
            } else if (forwardedRef) {
              (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={cn(
            'group relative rounded-2xl overflow-hidden transition-[border-color,box-shadow]',
            variantClasses[variant],
            paddingClasses[padding],
            hoverGlow &&
              'hover:shadow-[0_0_28px_rgba(254,126,60,0.28)] hover:border-[rgba(254,126,60,0.6)]',
            className
          )}
          style={{
            rotateX: shouldTilt ? rotateXSpring : undefined,
            rotateY: shouldTilt ? rotateYSpring : undefined,
            transformStyle: shouldTilt ? 'preserve-3d' : undefined,
            ...style,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          {...motionProps}
        >
          {/* Subtle top inner border highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(254,126,60,0.35)] to-transparent"
          />

          {/* Pointer-tracked radial highlight inside the card */}
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background:
                'radial-gradient(320px circle at var(--mx, -500px) var(--my, -500px), rgba(254,126,60,0.08), transparent 70%)',
            }}
          />

          {children}
        </motion.div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
