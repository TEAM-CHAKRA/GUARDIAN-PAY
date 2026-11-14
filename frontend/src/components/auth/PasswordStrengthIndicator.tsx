'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const criteria = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Numeric digit', met: /[0-9]/.test(password) },
    { label: 'Special symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  const strengthLabels = ['Weak', 'Moderate', 'Strong', 'Enclave-Grade'];
  const strengthColors = ['#E4201B', '#FE7E3C', '#0E6873', '#10B981'];

  const currentLabel = password.length === 0 ? 'None' : strengthLabels[score - 1] || 'Weak';
  const currentColor = password.length === 0 ? '#C5BDB7' : strengthColors[score - 1] || '#E4201B';

  return (
    <div className={cn('space-y-2 mt-2', className)}>
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#C5BDB7]">Password Strength:</span>
        <span className="font-bold uppercase tracking-wider" style={{ color: currentColor }}>
          {currentLabel}
        </span>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-full h-full transition-colors duration-300"
            style={{
              backgroundColor: idx < score ? currentColor : 'rgba(97, 65, 60, 0.3)',
              boxShadow: idx < score ? `0 0 8px ${currentColor}50` : 'none',
            }}
          />
        ))}
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-1 pt-1">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono">
            {c.met ? (
              <Check className="w-3 h-3 text-[#10B981] shrink-0" />
            ) : (
              <X className="w-3 h-3 text-[#C5BDB7] shrink-0" />
            )}
            <span className={c.met ? 'text-[#F8F9FA]' : 'text-[#C5BDB7]'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PasswordStrengthIndicator;
