'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  className?: string;
}

export function OtpInput({ length = 6, onComplete, className }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto advance if digit entered
    if (cleanVal && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === length && onComplete) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, length - 1);
    inputsRef.current[nextIndex]?.focus();

    if (pastedData.length === length && onComplete) {
      onComplete(pastedData);
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 sm:gap-3', className)}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${idx + 1} of verification code`}
          className={cn(
            'w-11 h-14 sm:w-12 sm:h-16 text-center font-mono text-xl font-bold rounded-xl border bg-[#0E6873]/20 text-[#F8F9FA] transition-all outline-none',
            digit
              ? 'border-[#FE7E3C] shadow-[0_0_15px_rgba(254,126,60,0.3)]'
              : 'border-[rgba(14,104,115,0.4)] hover:border-[rgba(254,126,60,0.4)]',
            'focus:border-[#FE7E3C] focus:ring-2 focus:ring-[#FE7E3C]/40 focus:bg-[#0E6873]/50'
          )}
        />
      ))}
    </div>
  );
}

export default OtpInput;
