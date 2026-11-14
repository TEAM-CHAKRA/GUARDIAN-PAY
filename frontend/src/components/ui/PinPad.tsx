'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Delete, ShieldCheck, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PinPadProps {
  length?: number;
  onComplete?: (pin: string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
  isError?: boolean;
}

export function PinPad({
  length = 6,
  onComplete,
  title = 'Enter Security PIN',
  subtitle = 'Encrypted on-device hardware authorization',
  className,
  isError = false,
}: PinPadProps) {
  const [pin, setPin] = useState<string>('');

  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => {
        setPin('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  const handleDigit = (digit: string) => {
    if (pin.length < length) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === length && onComplete) {
        onComplete(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'delete'];

  return (
    <div className={cn('flex flex-col items-center max-w-xs mx-auto', className)}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#FE7E3C]/10 border border-[#FE7E3C]/30 text-[#FE7E3C] mb-2 shadow-[0_0_15px_rgba(254,126,60,0.2)]">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h4 className="text-base font-bold text-[#F8F9FA] tracking-tight">{title}</h4>
        <p className="text-xs text-[#C5BDB7] mt-0.5">{subtitle}</p>
      </div>

      {/* Masked PIN Indicators with Pop-in & 3-Cycle Shake on Error */}
      <motion.div
        animate={isError ? { x: [-12, 12, -8, 8, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className="flex items-center gap-3.5 mb-8"
      >
        {Array.from({ length }).map((_, idx) => {
          const isFilled = idx < pin.length;
          return (
            <motion.div
              key={idx}
              initial={false}
              animate={
                isFilled
                  ? { scale: [0.7, 1.25, 1], opacity: 1 }
                  : { scale: 1, opacity: 0.6 }
              }
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'w-4 h-4 rounded-full border transition-all duration-200',
                isError
                  ? 'bg-[#E4201B] border-[#E4201B] shadow-[0_0_12px_#E4201B]'
                  : isFilled
                  ? 'bg-[#FE7E3C] border-[#FE7E3C] shadow-[0_0_12px_#FE7E3C]'
                  : 'bg-[#0E6873]/30 border-[rgba(97,65,60,0.45)]'
              )}
            />
          );
        })}
      </motion.div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {keys.map((k, i) => {
          if (k === 'clear') {
            return (
              <motion.button
                key={i}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={handleClear}
                className="h-14 rounded-xl flex items-center justify-center font-mono text-xs uppercase tracking-wider text-[#C5BDB7] hover:text-[#E4201B] bg-[#0E6873]/20 hover:bg-[#0E6873]/40 border border-transparent hover:border-[#E4201B]/40 transition-all cursor-pointer"
                aria-label="Clear PIN"
              >
                <RefreshCcw className="w-4 h-4" />
              </motion.button>
            );
          }

          if (k === 'delete') {
            return (
              <motion.button
                key={i}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={handleDelete}
                className="h-14 rounded-xl flex items-center justify-center text-[#C5BDB7] hover:text-[#FE7E3C] bg-[#0E6873]/20 hover:bg-[#0E6873]/40 border border-transparent hover:border-[#FE7E3C]/40 transition-all cursor-pointer"
                aria-label="Delete last digit"
              >
                <Delete className="w-5 h-5" />
              </motion.button>
            );
          }

          return (
            <motion.button
              key={i}
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDigit(k)}
              className="h-14 rounded-xl flex items-center justify-center font-mono text-xl font-bold text-[#F8F9FA] bg-[#0E6873]/20 hover:bg-[#0E6873]/40 border border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C]/50 hover:shadow-[0_0_15px_rgba(254,126,60,0.2)] transition-all cursor-pointer"
            >
              {k}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default PinPad;
