'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  FileText,
  User,
  Shield,
  Check,
} from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { formatCurrency } from '@/lib/utils';
import { RecipientInfo } from './RecipientStep';
import { Wallet } from '@/lib/types';

export interface AmountStepProps {
  recipient: RecipientInfo;
  wallet: Wallet | null;
  initialAmount?: string;
  initialNote?: string;
  onBack: () => void;
  onProceedToAnalysis: (amount: number, note: string) => void;
}

export function AmountStep({
  recipient,
  wallet,
  initialAmount = '1450',
  initialNote = '',
  onBack,
  onProceedToAnalysis,
}: AmountStepProps) {
  const [amountInput, setAmountInput] = useState(initialAmount);
  const [noteInput, setNoteInput] = useState(initialNote);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableBalance = wallet?.balance || 84250.0;
  const remainingDaily = (wallet?.dailyLimit || 200000) - (wallet?.spentToday || 12500);

  const parsedAmount = parseFloat(amountInput) || 0;

  const quickPresets = [500, 1000, 5000, 25000];

  const handleAddPreset = (val: number) => {
    setAmountInput(String(val));
    setErrorMsg(null);
  };

  const handleSetMax = () => {
    setAmountInput(String(availableBalance));
    setErrorMsg(null);
  };

  const validateAndProceed = () => {
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter an amount greater than ₹0.');
      return;
    }
    if (parsedAmount > availableBalance) {
      setErrorMsg(`Insufficient funds! Your available balance is ${formatCurrency(availableBalance)}.`);
      return;
    }
    if (parsedAmount > remainingDaily) {
      setErrorMsg(`Exceeds daily remaining limit of ${formatCurrency(remainingDaily)}.`);
      return;
    }

    setErrorMsg(null);
    onProceedToAnalysis(parsedAmount, noteInput || 'Transfer via GUARDIANPAY');
  };

  return (
    <div className="space-y-6">
      {/* Recipient Target Banner */}
      <div className="p-3.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FE7E3C]/10 border border-[#FE7E3C]/30 flex items-center justify-center font-display font-bold text-sm text-[#FE7E3C]">
            {recipient.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-display font-bold text-sm text-[#F8F9FA] block">
              {recipient.name}
            </span>
            <span className="font-mono text-xs text-[#FE7E3C]">{recipient.vpa}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] underline cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* Main Amount Input Container */}
      <div className="p-6 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] text-center space-y-4">
        <span className="font-mono text-xs text-[#C5BDB7] uppercase tracking-wider block">
          Enter Transfer Amount
        </span>

        <div className="flex items-center justify-center gap-2 font-mono">
          <span className="text-3xl sm:text-5xl font-black text-[#FE7E3C]">₹</span>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="0"
            className="w-64 sm:w-80 text-3xl sm:text-5xl font-black text-[#F8F9FA] bg-transparent text-center outline-none border-b-2 border-[rgba(97,65,60,0.35)] focus:border-[#FE7E3C] transition-colors tabular-nums"
          />
        </div>

        {/* Quick Amount Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {quickPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="px-3 py-1 rounded-lg bg-[#122023] border border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C] font-mono text-xs text-[#F8F9FA] transition-all cursor-pointer"
            >
              +₹{preset.toLocaleString('en-IN')}
            </button>
          ))}
          <button
            type="button"
            onClick={handleSetMax}
            className="px-3 py-1 rounded-lg bg-[#FE7E3C]/15 border border-[#FE7E3C]/35 font-mono text-xs text-[#FE7E3C] font-bold transition-all cursor-pointer"
          >
            Max Balance
          </button>
        </div>

        {/* Available Balance & Limit Info */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono pt-3 text-[#C5BDB7]">
          <span>
            Available: <strong className="text-[#F8F9FA]">{formatCurrency(availableBalance)}</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Remaining Daily Limit: <strong className="text-[#FE7E3C]">{formatCurrency(remainingDaily)}</strong>
          </span>
        </div>

        {/* Validation Error Banner */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] text-xs font-mono flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Payment Note Input */}
      <div>
        <label className="block font-mono text-xs text-[#C5BDB7] mb-1.5 uppercase tracking-wider">
          Payment Note (Optional)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
            <FileText className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="e.g. Consultancy fee, dinner split, cloud API bills"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] text-sm focus:border-[#FE7E3C] outline-none"
          />
        </div>
      </div>

      {/* Step Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <GlowButton
          type="button"
          variant="ghost"
          size="md"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onBack}
        >
          Back to Recipient
        </GlowButton>

        <GlowButton
          type="button"
          variant="primary"
          size="lg"
          rightIcon={<ArrowRight className="w-5 h-5 ml-1" />}
          onClick={validateAndProceed}
          className="w-full sm:w-auto"
        >
          Analyze &amp; Continue
        </GlowButton>
      </div>
    </div>
  );
}

export default AmountStep;
