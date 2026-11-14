'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, RefreshCw, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlowButton } from '@/components/ui/GlowButton';
import { OtpInput } from '@/components/ui/OtpInput';
import { useToast } from '@/components/ui/Toast';
import { api, DEMO_CREDENTIALS } from '@/lib/api';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || 'USR-101';
  const identifier = searchParams.get('identifier') || 'aarav@aegis';

  const { success, error, info } = useToast();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpSubmit = async (codeToVerify?: string) => {
    const targetOtp = codeToVerify || otp;
    if (targetOtp.length < 6) {
      setErrorMessage('Please enter the full 6-digit challenge code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await api.verifyOtp({ userId, otp: targetOtp });
      setIsVerified(true);
      success('Challenge Solved', 'Multi-factor authentication passed. Identity cryptographically bound.');

      setTimeout(() => {
        if (response.nextStep === 'SET_PIN') {
          router.push(`/set-pin?userId=${userId}`);
        } else if (response.user?.email === 'admin@guardianpay.internal' || (response.user as any)?.role === 'ADMIN' || identifier.includes('admin')) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 800);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid challenge code. Expected demo OTP: 123456');
      error('Verification Failed', 'Incorrect OTP entered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(45);
    setErrorMessage(null);
    info(
      'New Challenge Dispatched',
      `Fresh OTP simulated for terminal ${identifier}. Code: ${DEMO_CREDENTIALS.demoOtp}`
    );
  };

  const autofillDemoOtp = () => {
    setOtp(DEMO_CREDENTIALS.demoOtp);
    setErrorMessage(null);
    handleOtpSubmit(DEMO_CREDENTIALS.demoOtp);
  };

  return (
    <AuthLayout
      title="Second-Factor Challenge"
      subtitle={`Enclave authentication code dispatched to ${identifier}`}
      backHref="/login"
      backLabel="Back to Login"
    >
      <div className="space-y-6">
        {/* Verification Icon Badge */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FE7E3C]/10 border border-[#FE7E3C]/30 text-[#FE7E3C] flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(254,126,60,0.2)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <p className="font-mono text-xs text-[#C5BDB7]">
            Target Node: <span className="text-[#FE7E3C] font-semibold">{identifier}</span>
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] flex items-start gap-2.5 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Challenge Mismatch</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {isVerified && (
          <div className="p-3.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] flex items-center gap-2.5 text-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-semibold">MFA Challenge Solved! Redirecting to secure perimeter...</p>
          </div>
        )}

        {/* 6-Digit OtpInput */}
        <div className="py-2">
          <OtpInput
            length={6}
            onComplete={(code) => {
              setOtp(code);
              handleOtpSubmit(code);
            }}
          />
        </div>

        {/* Manual Submit Button */}
        <GlowButton
          variant="primary"
          size="md"
          isLoading={isLoading}
          disabled={isVerified}
          onClick={() => handleOtpSubmit()}
          className="w-full"
        >
          Verify Challenge
        </GlowButton>

        {/* Resend Action & Countdown */}
        <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[rgba(97,65,60,0.35)]">
          <span className="text-[#C5BDB7]">Didn&apos;t receive code?</span>
          {countdown > 0 ? (
            <span className="text-[#C5BDB7]">
              Resend in <span className="text-[#FE7E3C] font-bold">{countdown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-[#FE7E3C] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Resend Challenge</span>
            </button>
          )}
        </div>

        {/* Clearly Documented Development Demo Box */}
        <div className="p-4 rounded-xl bg-[#122023] border border-[#FE7E3C]/35 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-[#FE7E3C]">
            <span className="font-bold uppercase">[DEVELOPMENT DEMO MODE]</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-[#C5BDB7] leading-relaxed">
            No actual SMS or cellular gateway is invoked during this simulation. The documented demo
            passcode is <span className="text-[#10B981] font-bold font-mono">123456</span>.
          </p>
          <button
            type="button"
            onClick={autofillDemoOtp}
            className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#FE7E3C]/10 hover:bg-[#FE7E3C]/20 border border-[#FE7E3C]/30 text-[#FE7E3C] text-[11px] transition-colors cursor-pointer text-center"
          >
            Autofill Valid Demo Code (123456) &amp; Verify
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1A2C30] flex items-center justify-center text-[#FE7E3C] font-mono text-xs">
          Loading Security Perimeter...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
