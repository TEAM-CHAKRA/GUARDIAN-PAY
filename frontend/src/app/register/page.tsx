'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlowButton } from '@/components/ui/GlowButton';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [formData, setFormData] = useState({
    name: 'Kabir Singhania',
    phone: '+91 99880 11223',
    email: 'kabir.s@fintechlabs.io',
    password: 'CyberPass@2026',
    confirmPassword: 'CyberPass@2026',
    acceptTerms: true,
  });

  const fillDemoRegistration = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: `Rohan Gupta ${randomSuffix}`,
      email: `rohan${randomSuffix}@example.com`,
      phone: `9876543${randomSuffix}`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
    });
    setValidationErrors({});
    info('Demo Profile Loaded', 'Ready to test new wallet registration.');
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full legal name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      errors.email = 'Please provide a valid email address.';
    }

    const phoneClean = formData.phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      errors.phone = 'Please provide a valid 10-digit mobile number.';
    }

    if (formData.password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms of the cryptographic simulation.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      error('Form Incomplete', 'Please review the highlighted validation requirements.');
      return;
    }

    setIsLoading(true);
    try {
      const vpaSuggested = formData.name.toLowerCase().replace(/\s+/g, '') + '@aegis';
      const result = await api.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        vpa: vpaSuggested,
        password: formData.password,
      });

      success(
        'Identity Initialized',
        `Wallet identity created for ${result.user.name}. MFA challenge issued.`
      );

      router.push(`/verify-otp?userId=${result.user.id}&identifier=${encodeURIComponent(result.user.phone)}`);
    } catch (err: any) {
      error('Provisioning Failed', err?.message || 'Ledger registration could not be committed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Provision Smart Wallet"
      subtitle="Deterministic cryptographic registration with ₹25,000 welcome credit"
      backHref="/login"
      backLabel="Existing user? Login"
    >
      <form onSubmit={handleRegister} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block font-mono text-[11px] text-[#C5BDB7] mb-1 uppercase tracking-wider">
            Full Legal Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Kabir Singhania"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] text-sm focus:border-[#FE7E3C] outline-none transition-all placeholder:text-[#C5BDB7]"
            />
          </div>
          {validationErrors.name && (
            <p className="mt-1 text-xs text-[#E4201B] font-mono">{validationErrors.name}</p>
          )}
        </div>

        {/* Mobile & Email row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-mono text-[11px] text-[#C5BDB7] mb-1 uppercase tracking-wider">
              Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-xs focus:border-[#FE7E3C] outline-none transition-all placeholder:text-[#C5BDB7]"
              />
            </div>
            {validationErrors.phone && (
              <p className="mt-1 text-xs text-[#E4201B] font-mono">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block font-mono text-[11px] text-[#C5BDB7] mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] text-xs focus:border-[#FE7E3C] outline-none transition-all placeholder:text-[#C5BDB7]"
              />
            </div>
            {validationErrors.email && (
              <p className="mt-1 text-xs text-[#E4201B] font-mono">{validationErrors.email}</p>
            )}
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block font-mono text-[11px] text-[#C5BDB7] mb-1 uppercase tracking-wider">
            Master Security Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-sm focus:border-[#FE7E3C] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#C5BDB7] hover:text-[#FE7E3C]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={formData.password} />
          {validationErrors.password && (
            <p className="mt-1 text-xs text-[#E4201B] font-mono">{validationErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block font-mono text-[11px] text-[#C5BDB7] mb-1 uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-sm focus:border-[#FE7E3C] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#C5BDB7] hover:text-[#FE7E3C]"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-xs text-[#E4201B] font-mono">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Terms and Consent */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded border-[rgba(97,65,60,0.4)] bg-[#122023] text-[#FE7E3C] focus:ring-[#FE7E3C]"
            />
            <span className="text-xs text-[#C5BDB7] leading-relaxed">
              I acknowledge that GUARDIANPAY is a hackathon simulation network. No real fiat
              currency is debited or credited.
            </span>
          </label>
          {validationErrors.acceptTerms && (
            <p className="mt-1 text-xs text-[#E4201B] font-mono">
              {validationErrors.acceptTerms}
            </p>
          )}
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
          Provision Secure Wallet
        </GlowButton>

        <div className="pt-3 text-center border-t border-[rgba(97,65,60,0.3)] text-xs text-[#C5BDB7]">
          <span>Already provisioned? </span>
          <Link href="/login" className="text-[#FE7E3C] font-semibold hover:underline">
            Sign In to Wallet
          </Link>
        </div>

        {/* Development Demo Controls Banner */}
        <div className="mt-4 p-3 rounded-xl bg-[#122023]/70 border border-[rgba(97,65,60,0.35)] text-[11px] font-mono text-[#C5BDB7] space-y-2">
          <div className="flex items-center justify-between text-[#FE7E3C]">
            <span className="font-bold uppercase">[DEV DEMO CONTROLS]</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p>Instantly pre-fill a new unique profile to test wallet provisioning:</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={fillDemoRegistration}
              className="px-2.5 py-1 rounded bg-[#FE7E3C]/10 hover:bg-[#FE7E3C]/20 text-[#FE7E3C] border border-[#FE7E3C]/30 transition-colors"
            >
              Generate New User Profile
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
