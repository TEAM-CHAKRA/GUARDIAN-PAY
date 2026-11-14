'use client';

import React, { useState } from 'react';
import { PiggyBank, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/components/ui/Toast';

export function RoundUpSavingsCard() {
  const { t } = useLanguage();
  const { success, info } = useToast();
  const [isEnabled, setIsEnabled] = useState(true);
  const [savingsTotal] = useState(3420);

  const toggleRoundUp = () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    if (nextState) {
      success('Round-Up Vault Activated', 'Future debits will automatically round to the nearest ₹10.');
    } else {
      info('Round-Up Paused', 'Micro-saving allocations placed on hold.');
    }
  };

  return (
    <GlassCard variant="default" padding="lg" className="relative overflow-hidden">
      {/* Decorative Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-gradient-to-br from-[#FE7E3C]/10 to-[#10B981]/10 blur-2xl"
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-[#F8F9FA]">
              {t('roundUpSavings')}
            </h4>
            <p className="font-sans text-[11px] text-[#C5BDB7]">
              {t('roundUpDesc')}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={toggleRoundUp}
          role="switch"
          aria-checked={isEnabled}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? 'bg-[#10B981]' : 'bg-[#122023] border-[rgba(97,65,60,0.35)]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#1A2C30] shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="flex items-baseline gap-2 mb-2 font-mono">
        <span className="text-2xl font-black text-[#F8F9FA] tracking-tight">
          ₹{savingsTotal.toLocaleString('en-IN')}.00
        </span>
        <span className="text-xs text-[#10B981] font-semibold">
          {isEnabled ? `• ${t('roundUpEnabled')}` : `• ${t('roundUpDisabled')}`}
        </span>
      </div>

      <p className="font-mono text-xs text-[#C5BDB7] mb-4">
        48 {t('qualifyingTxCount')}
      </p>

      {/* Example Box */}
      <div className="p-2.5 rounded-xl bg-[#122023]/80 border border-[rgba(97,65,60,0.35)] flex items-center justify-between text-[11px] font-mono text-[#C5BDB7]">
        <div className="flex items-center gap-1.5 text-[#C5BDB7]">
          <Sparkles className="w-3.5 h-3.5 text-[#FE7E3C]" />
          <span>{t('roundUpExample')}</span>
        </div>
        <span className="text-[#10B981] font-bold">+₹50</span>
      </div>
    </GlassCard>
  );
}

export default RoundUpSavingsCard;
