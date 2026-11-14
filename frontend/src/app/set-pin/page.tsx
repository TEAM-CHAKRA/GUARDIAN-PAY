'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PinPad } from '@/components/ui/PinPad';
import { AccountLockoutCard } from '@/components/auth/AccountLockoutCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

function SetPinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || 'USR-101';
  const { success, error, info } = useToast();

  const [step, setStep] = useState<'ENTER_PIN' | 'CONFIRM_PIN' | 'SUCCESS'>('ENTER_PIN');
  const [firstPin, setFirstPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const triggerShake = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);

    const nextFails = failedAttempts + 1;
    setFailedAttempts(nextFails);

    if (nextFails >= 3) {
      setIsLockedOut(true);
      error('Security Lockout Triggered', 'Three consecutive mismatched PIN entries.');
    }
  };

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setErrorMessage(null);
    setStep('CONFIRM_PIN');
    info('PIN Captured', 'Please re-enter the 6-digit PIN to confirm accuracy.');
  };

  const handleConfirmPinComplete = async (confirmPin: string) => {
    if (confirmPin !== firstPin) {
      triggerShake(`PIN mismatch! ${3 - (failedAttempts + 1)} confirmation attempts remaining.`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await api.setPin({
        userId,
        pin: firstPin,
        confirmPin,
      });

      setStep('SUCCESS');
      success(
        'UPI Security PIN Configured',
        'PIN successfully enrolled in your simulated hardware enclave.'
      );

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      error('Configuration Failed', err?.message || 'Could not enroll PIN into hardware enclave.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFlow = () => {
    setFirstPin('');
    setErrorMessage(null);
    setStep('ENTER_PIN');
  };

  return (
    <AuthLayout
      title="Hardware PIN Setup"
      subtitle="Configure your 6-digit payment authorization PIN"
      backHref="/verify-otp"
      backLabel="Back to MFA Verification"
    >
      {isLockedOut ? (
        <AccountLockoutCard
          initialSeconds={900}
          userId={userId}
          onReset={() => {
            setIsLockedOut(false);
            setFailedAttempts(0);
            handleResetFlow();
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Error message with animated shake */}
          {errorMessage && (
            <motion.div
              animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="p-3.5 rounded-xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] flex items-start gap-2.5 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Confirmation Mismatch</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </motion.div>
          )}

          {step === 'ENTER_PIN' && (
            <div className="space-y-4">
              <PinPad
                length={6}
                title="Create 6-Digit Payment PIN"
                subtitle="This PIN authorizes transfers above risk threshold"
                onComplete={handleFirstPinComplete}
              />
            </div>
          )}

          {step === 'CONFIRM_PIN' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <PinPad
                length={6}
                title="Confirm 6-Digit Payment PIN"
                subtitle="Re-enter to verify identical sequence"
                onComplete={handleConfirmPinComplete}
              />

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResetFlow}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start over with different PIN</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'SUCCESS' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#F8F9FA]">
                PIN Enrolled Successfully!
              </h3>
              <p className="text-xs text-[#C5BDB7] max-w-xs mx-auto leading-relaxed">
                Your payment authorization PIN is now cryptographically bound to this hardware
                enclave. Redirecting to your smart wallet console...
              </p>

              <div className="pt-4">
                <GlowButton
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  Enter Wallet Dashboard Now
                </GlowButton>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AuthLayout>
  );
}

export default function SetPinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1A2C30] flex items-center justify-center text-[#FE7E3C] font-mono text-xs">
          Configuring Enclave PIN Pad...
        </div>
      }
    >
      <SetPinContent />
    </Suspense>
  );
}
