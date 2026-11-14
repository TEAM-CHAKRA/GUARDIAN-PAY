'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowUpRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlowButton } from '@/components/ui/GlowButton';
import { DeviceRecognitionChip, DeviceInfo } from '@/components/auth/DeviceRecognitionChip';
import { AccountLockoutCard } from '@/components/auth/AccountLockoutCard';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api, DEMO_CREDENTIALS } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [identifier, setIdentifier] = useState('aarav@aegis');
  const [password, setPassword] = useState('Password@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lockout state
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(900);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Device telemetry state
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    deviceName: 'Titanium Phone 16 Pro',
    browser: 'Safari Mobile 19.4',
    os: 'iOS 19.4 (Secure Enclave)',
    location: 'Mumbai, MH, India',
    approxTime: 'Just now',
    isRecognized: true,
  });

  const toggleTestDevice = () => {
    setDeviceInfo((prev) => ({
      ...prev,
      isRecognized: !prev.isRecognized,
      deviceName: !prev.isRecognized ? 'Titanium Phone 16 Pro' : 'Unknown Android Emulated Terminal',
      location: !prev.isRecognized ? 'Mumbai, MH, India' : 'Tor Exit Node / Amsterdam',
    }));
    info(
      'Device Context Switched',
      !deviceInfo.isRecognized
        ? 'Now simulating your recognized primary device.'
        : 'Now simulating an unrecognized device with high-risk telemetry.'
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your @aegis VPA address, mobile number, or email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your security password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({
        identifier,
        password,
        rememberDevice,
        isNewDeviceSimulated: !deviceInfo.isRecognized,
      });

      if (response.isLockedOut) {
        setIsLockedOut(true);
        setLockoutSeconds(response.lockoutRemainingSeconds || 900);
        return;
      }

      success(
        'Credentials Cleared',
        deviceInfo.isRecognized
          ? 'Device matched recognized signature. Dispatched MFA challenge.'
          : 'New device detected! Adaptive step-up OTP challenge issued.'
      );

      router.push(`/verify-otp?userId=${response.user.id}&identifier=${encodeURIComponent(identifier)}`);
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
      if (msg.includes('Account locked')) {
        setIsLockedOut(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setIdentifier('aarav@aegis');
    setPassword('Password@2026');
    setErrorMessage(null);
    info('Demo Credentials Loaded', 'Aarav Mehta (aarav@aegis) credentials populated.');
  };

  const fillAliceCredentials = () => {
    setIdentifier('alice@example.com');
    setPassword('Password123!');
    setErrorMessage(null);
    info('Alice Credentials Loaded', 'Alice Sharma (alice@example.com) credentials populated.');
  };

  const fillAdminCredentials = () => {
    setIdentifier('admin@guardianpay.internal');
    setPassword('AdminPassword123!');
    setErrorMessage(null);
    info('Admin Credentials Loaded', 'SecOps Admin credentials populated.');
  };

  const triggerWrongPasswordDemo = () => {
    setIdentifier('aarav@aegis');
    setPassword('wrong');
    setErrorMessage(null);
  };

  return (
    <AuthLayout
      title="Wallet Access Portal"
      subtitle="Authenticate using cryptographic credentials or passkey"
      backHref="/"
      backLabel="Back to Overview"
    >
      {isLockedOut ? (
        <AccountLockoutCard
          initialSeconds={lockoutSeconds}
          onReset={() => {
            setIsLockedOut(false);
            setErrorMessage(null);
          }}
        />
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Device Recognition Banner */}
          <DeviceRecognitionChip
            device={deviceInfo}
            onToggleSimulated={toggleTestDevice}
            className="mb-2"
          />

          {/* Error alert banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Exception</p>
                <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Identifier Input */}
          <div>
            <label className="block font-mono text-xs text-[#C5BDB7] mb-1.5 uppercase tracking-wider">
              Identifier (VPA, Email, or Mobile)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="aarav@aegis or user@domain.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-sans text-sm focus:border-[#FE7E3C] focus:ring-1 focus:ring-[#FE7E3C] outline-none transition-all placeholder:text-[#C5BDB7]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-xs text-[#C5BDB7] uppercase tracking-wider">
                Security Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-mono text-[#FE7E3C] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-sm focus:border-[#FE7E3C] focus:ring-1 focus:ring-[#FE7E3C] outline-none transition-all placeholder:text-[#C5BDB7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Device Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-[rgba(97,65,60,0.4)] bg-[#122023] text-[#FE7E3C] focus:ring-[#FE7E3C] focus:ring-offset-[#1A2C30]"
              />
              <span className="text-xs text-[#C5BDB7]">Trust this hardware device</span>
            </label>
          </div>

          {/* Submit Button */}
          <GlowButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
            className="w-full mt-2"
          >
            Authenticate &amp; Continue
          </GlowButton>

          {/* Register Link */}
          <div className="pt-4 text-center border-t border-[rgba(97,65,60,0.3)] text-xs text-[#C5BDB7]">
            <span>Don&apos;t have a verified wallet yet? </span>
            <Link href="/register" className="text-[#FE7E3C] font-semibold hover:underline">
              Provision New Wallet
            </Link>
          </div>

          {/* Development Demo Controls Banner */}
          <div className="mt-4 p-3 rounded-xl bg-[#122023]/70 border border-[rgba(97,65,60,0.35)] text-[11px] font-mono text-[#C5BDB7] space-y-2">
            <div className="flex items-center justify-between text-[#FE7E3C]">
              <span className="font-bold uppercase">[DEV DEMO CONTROLS]</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <p>Test quick credentials or intentionally trigger security defense rules:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-2.5 py-1 rounded bg-[#FE7E3C]/10 hover:bg-[#FE7E3C]/20 text-[#FE7E3C] border border-[#FE7E3C]/30 transition-colors"
              >
                Aarav (Default)
              </button>
              <button
                type="button"
                onClick={fillAliceCredentials}
                className="px-2.5 py-1 rounded bg-[#0E6873]/20 hover:bg-[#0E6873]/40 text-[#F8F9FA] border border-[#0E6873]/50 transition-colors"
              >
                Alice Sharma (User)
              </button>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="px-2.5 py-1 rounded bg-[#10B981]/15 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/40 transition-colors"
              >
                SecOps Admin
              </button>
              <button
                type="button"
                onClick={triggerWrongPasswordDemo}
                className="px-2.5 py-1 rounded bg-[#E4201B]/10 hover:bg-[#E4201B]/20 text-[#E4201B] border border-[#E4201B]/30 transition-colors"
              >
                Test Lockout
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => {
          setForgotModalOpen(false);
          setForgotSubmitted(false);
        }}
        title="Reset Security Credentials"
        description="Initiate self-sovereign cryptographic identity recovery."
      >
        {forgotSubmitted ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-[#F8F9FA]">
              Recovery Challenge Dispatched
            </h4>
            <p className="text-xs text-[#C5BDB7]">
              If an account is associated with this identifier, an encrypted hardware link has been
              sent.
            </p>
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => setForgotModalOpen(false)}
              className="mt-2"
            >
              Done
            </GlowButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-xs text-[#C5BDB7] mb-1.5 uppercase">
                Account Email or VPA
              </label>
              <input
                type="text"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@aegis"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-sm focus:border-[#FE7E3C] outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <GlowButton
                variant="ghost"
                size="sm"
                onClick={() => setForgotModalOpen(false)}
              >
                Cancel
              </GlowButton>
              <GlowButton
                variant="primary"
                size="sm"
                onClick={() => setForgotSubmitted(true)}
              >
                Send Recovery Key
              </GlowButton>
            </div>
          </div>
        )}
      </Modal>
    </AuthLayout>
  );
}
