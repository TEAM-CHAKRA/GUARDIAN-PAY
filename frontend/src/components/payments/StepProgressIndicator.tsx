'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentStep = 'RECIPIENT' | 'AMOUNT' | 'ANALYSIS' | 'AUTHORIZE' | 'RESULT';

export interface StepProgressIndicatorProps {
  currentStep: PaymentStep;
  className?: string;
}

const STEPS: { id: PaymentStep; number: string; label: string }[] = [
  { id: 'RECIPIENT', number: '01', label: 'Recipient' },
  { id: 'AMOUNT', number: '02', label: 'Amount' },
  { id: 'ANALYSIS', number: '03', label: 'Risk Analysis' },
  { id: 'AUTHORIZE', number: '04', label: 'Authorize' },
  { id: 'RESULT', number: '05', label: 'Result' },
];

export function StepProgressIndicator({ currentStep, className }: StepProgressIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn('w-full select-none', className)}>
      <div className="flex items-center justify-between relative">
        {/* Connecting background line */}
        <div
          aria-hidden="true"
          className="absolute top-4 left-6 right-6 h-0.5 bg-[#122023] -z-0 border-b border-[rgba(97,65,60,0.3)]"
        />

        {/* Animated active progress line */}
        <motion.div
          aria-hidden="true"
          className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-[#FE7E3C] to-[#E4201B] -z-0 shadow-[0_0_10px_rgba(254,126,60,0.4)]"
          initial={{ width: 0 }}
          animate={{
            width: `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 3rem)`,
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-300',
                  isCompleted
                    ? 'bg-[#10B981] text-[#1A2C30] shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : isActive
                    ? 'bg-[#1A2C30] border-2 border-[#FE7E3C] text-[#FE7E3C] shadow-[0_0_15px_rgba(254,126,60,0.4)]'
                    : 'bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#C5BDB7]'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
              </div>

              <span
                className={cn(
                  'mt-2 text-[11px] font-mono tracking-wider uppercase transition-colors hidden sm:block',
                  isActive
                    ? 'text-[#FE7E3C] font-bold'
                    : isCompleted
                    ? 'text-[#F8F9FA]'
                    : 'text-[#C5BDB7]'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StepProgressIndicator;
