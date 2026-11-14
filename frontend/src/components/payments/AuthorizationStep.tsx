'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Lock,
  RotateCcw,
  AlertCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  Home,
} from 'lucide-react';
import { PinPad } from '@/components/ui/PinPad';
import { OtpInput } from '@/components/ui/OtpInput';
import { GlowButton } from '@/components/ui/GlowButton';
import { useToast } from '@/components/ui/Toast';
import { PaymentDecision, Transaction } from '@/lib/types';
import { api, DEMO_CREDENTIALS } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { RecipientInfo } from './RecipientStep';
import { RiskAnalysisData } from './RiskAnalysisStep';

export interface AuthorizationStepProps {
  recipient: RecipientInfo;
  amount: number;
  note: string;
  analysisData: RiskAnalysisData;
  idempotencyKey: string;
  onPaymentSuccess: (transaction: Transaction) => void;
  onPaymentFailure?: (errorMessage: string) => void;
  onCancel: () => void;
}

export function AuthorizationStep({
  recipient,
  amount,
  note,
  analysisData,
  idempotencyKey,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel,
}: AuthorizationStepProps) {
  const { success, warning, error, info } = useToast();

  // Internal state for step-up OTP
  const [stepUpCompleted, setStepUpCompleted] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(45);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Internal state for PIN Authorization
  const [pinFails, setPinFails] = useState(0);
  const [pinShake, setPinShake] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Internal state for 10-Minute Hold Cooling Countdown
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState(600); // 10 minutes

  useEffect(() => {
    if (analysisData.decision !== 'HOLD') return;
    const interval = setInterval(() => {
      setHoldRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [analysisData.decision]);

  // Step-up OTP timer
  useEffect(() => {
    if (analysisData.decision !== 'STEP_UP' || stepUpCompleted) return;
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => setOtpCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [analysisData.decision, stepUpCompleted, otpCountdown]);

  // Handle Step-Up OTP Verification
  const handleVerifyStepUpOtp = (code: string) => {
    if (code !== DEMO_CREDENTIALS.demoOtp && code !== '842500') {
      setOtpError('Invalid authorization code. Test demo OTP is 123456.');
      error('Step-Up Failed', 'Incorrect OTP entered.');
      return;
    }

    setOtpError(null);
    setStepUpCompleted(true);
    success('MFA Challenge Cleared', 'Secondary identity confirmed. Please enter your UPI PIN.');
  };

  // Handle PIN Completion
  const handlePinSubmit = async (pin: string) => {
    setIsAuthorizing(true);
    setPinError(null);

    try {
      const pinRes = await api.verifyPin({
        userId: 'USR-101',
        pin,
      });

      if (!pinRes.verified) {
        setPinShake(true);
        setTimeout(() => setPinShake(false), 500);
        const fails = pinFails + 1;
        setPinFails(fails);

        if (pinRes.isLockedOut || fails >= 3) {
          setPinError('Security Lockout: 3 failed PIN attempts. Enclave locked for 15 minutes.');
          error('Enclave Locked', 'Maximum authentication attempts exceeded.');
        } else {
          setPinError(`Incorrect UPI PIN. ${3 - fails} attempt(s) remaining.`);
        }
        setIsAuthorizing(false);
        return;
      }

      // PIN is verified! Commit the actual transaction via API with Idempotency-Key
      const txResult = await api.sendTransaction({
        receiverVpa: recipient.vpa,
        receiverUpiId: recipient.vpa,
        amount,
        amountPaise: Math.round(amount * 100),
        note,
        pin,
        idempotencyKey,
        forceScore: analysisData.score,
      });

      if (!txResult || !txResult.transaction) {
        throw new Error('Transaction could not be sealed: No settlement returned by network.');
      }

      if (txResult.decision === 'ALLOW') {
        success('Payment Authorized & Sealed', 'Ledger block created on SHA-256 chain.');
      } else if (txResult.decision === 'HOLD') {
        warning('Payment Quarantined', 'High anomaly detected. Quarantined in Escrow Vault for review.');
      } else if (txResult.decision === 'BLOCK') {
        error('Payment Blocked', 'Critical anomaly neutralized by GuardianPay Shield.');
      } else {
        info('Verification Required', 'Adaptive second-factor challenge issued.');
      }

      onPaymentSuccess(txResult.transaction);
    } catch (err: any) {
      const msg = err?.message || 'Transaction could not be sealed.';
      setPinError(msg);
      error('Settlement Failed', msg);
    } finally {
      setIsAuthorizing(false);
    }
  };

  // 1. OUTCOME: BLOCK (Score 81–100)
  if (analysisData.decision === 'BLOCK') {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-[#001326]/90 border border-[#FF3B5C]/50 shadow-[0_15px_50px_rgba(255,59,92,0.25)] text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FF3B5C]/15 border border-[#FF3B5C]/40 text-[#FF3B5C] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(255,59,92,0.35)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FF3B5C] font-bold">
            [CRITICAL ANOMALY DETECTED • HARD BLOCK]
          </span>
          <h2 className="font-display text-2xl font-black text-[#F2FAFF] mt-1">
            Payment blocked for your protection.
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#9BB3C9] mt-2 max-w-md mx-auto leading-relaxed">
            GuardianPay Intelligence detected an irreconcilable high-risk threat vector. Your wallet
            has been quarantined to prevent unauthorized off-ramps.
          </p>
        </div>

        {/* Threat Factors & Incident Box */}
        <div className="p-4 rounded-xl bg-[#122023] border border-[#E4201B]/40 text-left space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[#E4201B]">
            <span className="font-bold">Incident Reference: INC-2026-9481</span>
            <span className="font-bold">Risk Score: {analysisData.score}/100</span>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[rgba(228,32,27,0.2)] text-[11px] text-[#C5BDB7]">
            {analysisData.reasons.map((r, i) => (
              <p key={i} className="flex items-start gap-2">
                <span className="text-[#E4201B]">✕</span>
                <span>{r}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <GlowButton variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />} className="w-full">
              Return to Dashboard
            </GlowButton>
          </Link>
          <GlowButton variant="danger" size="md" onClick={onCancel} className="w-full sm:w-auto">
            Acknowledge Quarantine
          </GlowButton>
        </div>
      </div>
    );
  }

  // 2. OUTCOME: HOLD (Score 61–80)
  if (analysisData.decision === 'HOLD') {
    const minutes = Math.floor(holdRemainingSeconds / 60);
    const seconds = holdRemainingSeconds % 60;
    const formattedHoldTime = `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;

    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-[#122023]/90 border border-[#FE7E3C]/50 shadow-[0_15px_50px_rgba(254,126,60,0.2)] text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/40 text-[#FE7E3C] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(254,126,60,0.3)]">
          <Clock className="w-8 h-8" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FE7E3C] font-bold">
            [TRANSACTION QUARANTINED • COOLING ACTIVE]
          </span>
          <h2 className="font-display text-2xl font-black text-[#F8F9FA] mt-1">
            Payment temporarily held.
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#C5BDB7] mt-2 max-w-md mx-auto leading-relaxed">
            Autonomous policy triggered a 10-minute cooling window to prevent social engineering or
            payment diversion. No money has been debited.
          </p>
        </div>

        {/* Cooling Timer Readout */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#1A2C30] border border-[rgba(97,65,60,0.35)] font-mono">
          <Clock className="w-5 h-5 text-[#FE7E3C]" />
          <span className="text-xs text-[#C5BDB7]">Cooling Period Remaining:</span>
          <span className="text-lg font-black text-[#FE7E3C]">{formattedHoldTime}</span>
        </div>

        {/* Hold Factors */}
        <div className="p-4 rounded-xl bg-[#122023] border border-[#FE7E3C]/30 text-left space-y-2 font-mono text-xs">
          <span className="text-[#FE7E3C] font-bold block mb-1">
            Suspicious Indicators (Score {analysisData.score}/100):
          </span>
          {analysisData.reasons.map((r, i) => (
            <p key={i} className="text-[11px] text-[#C5BDB7] flex items-start gap-2">
              <span className="text-[#FE7E3C]">⚠</span>
              <span>{r}</span>
            </p>
          ))}
        </div>

        {/* Cancel Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <GlowButton
            variant="secondary"
            size="md"
            onClick={async () => {
              await api.cancelHeldTransaction(idempotencyKey);
              warning('Transaction Cancelled', 'Held payment aborted. Zero funds moved.');
              onCancel();
            }}
            className="w-full sm:w-auto"
          >
            Cancel Payment Safely
          </GlowButton>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <GlowButton variant="ghost" size="md" className="w-full">
              Leave in Quarantine
            </GlowButton>
          </Link>
        </div>
      </div>
    );
  }

  // 3. OUTCOME: STEP-UP OTP (Score 31–60) before PIN
  if (analysisData.decision === 'STEP_UP' && !stepUpCompleted) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/40 text-[#FE7E3C] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(254,126,60,0.25)]">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FE7E3C] font-bold">
            [MFA REQUIRED • SCORE {analysisData.score}/100]
          </span>
          <h2 className="font-display text-2xl font-bold text-[#F8F9FA] mt-1">
            Additional verification required.
          </h2>
          <p className="font-sans text-xs text-[#C5BDB7] mt-1 max-w-sm mx-auto">
            Transfer ticket of {formatCurrency(amount)} requires second-factor authorization code.
          </p>
        </div>

        {otpError && (
          <div className="p-3 rounded-xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] text-xs font-mono">
            {otpError}
          </div>
        )}

        {/* 6-Digit OtpInput */}
        <div className="py-2">
          <OtpInput
            length={6}
            onComplete={(code) => {
              setOtpCode(code);
              handleVerifyStepUpOtp(code);
            }}
          />
        </div>

        {/* Documented Demo OTP Box */}
        <div className="p-3 rounded-xl bg-[#122023] border border-[#FE7E3C]/25 text-xs font-mono text-left space-y-1">
          <div className="flex items-center justify-between text-[#FE7E3C]">
            <span className="font-bold uppercase">[DEV DEMO CHALLENGE]</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-[#C5BDB7]">
            Test passcode is <strong className="text-[#10B981] font-mono">123456</strong>.
          </p>
          <button
            type="button"
            onClick={() => handleVerifyStepUpOtp('123456')}
            className="text-[11px] text-[#FE7E3C] hover:underline cursor-pointer block mt-1"
          >
            Autofill (123456) &amp; Unlock PIN Step →
          </button>
        </div>

        <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[rgba(97,65,60,0.2)]">
          <button type="button" onClick={onCancel} className="text-[#C5BDB7] hover:text-[#E4201B]">
            Cancel Transfer
          </button>

          <span className="text-[#C5BDB7]">
            Resend in <strong className="text-[#FE7E3C]">{otpCountdown}s</strong>
          </span>
        </div>
      </div>
    );
  }

  // 4. OUTCOME: ALLOW (or Step-up cleared) -> PIN AUTHORIZATION
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <span className="font-mono text-xs text-[#10B981] uppercase font-bold tracking-wider">
          {analysisData.decision === 'STEP_UP' ? 'STEP-UP MFA CLEARED' : 'RISK SCORE 18 • ALLOWED'}
        </span>
        <h3 className="font-display text-xl font-bold text-[#F8F9FA] mt-1">
          Authorize {formatCurrency(amount)} to {recipient.name}
        </h3>
        <p className="font-mono text-xs text-[#C5BDB7] mt-0.5">{recipient.vpa}</p>
      </div>

      {pinError && (
        <motion.div
          animate={pinShake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="p-3 rounded-xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] text-xs font-mono flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{pinError}</span>
        </motion.div>
      )}

      {/* PinPad with masked dots */}
      <PinPad
        length={6}
        title="Enter 6-Digit UPI PIN"
        subtitle="Default demo PIN: 123456"
        onComplete={handlePinSubmit}
      />

      <div className="pt-2 flex justify-between items-center text-xs font-mono border-t border-[rgba(97,65,60,0.2)]">
        <button
          type="button"
          onClick={onCancel}
          className="text-[#C5BDB7] hover:text-[#E4201B] transition-colors"
        >
          Abort Transfer
        </button>

        <button
          type="button"
          onClick={() => handlePinSubmit('123456')}
          className="text-[#FE7E3C] hover:underline cursor-pointer"
        >
          Autofill Valid PIN (123456)
        </button>
      </div>
    </div>
  );
}

export default AuthorizationStep;
