'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { api } from '@/lib/api';

export interface RecipientInfo {
  vpa: string;
  name: string;
  isVerified: boolean;
  isFlagged: boolean;
  trustScore: number;
  category: 'TRUSTED' | 'NEW' | 'HIGH_RISK' | 'INVALID';
}

export interface RecipientStepProps {
  initialVpa?: string;
  onSelectRecipient: (recipient: RecipientInfo) => void;
  onOpenQrScanner?: () => void;
}

export function RecipientStep({
  initialVpa = 'diya@aegis',
  onSelectRecipient,
  onOpenQrScanner,
}: RecipientStepProps) {
  const [vpaInput, setVpaInput] = useState(initialVpa);
  const [verification, setVerification] = useState<RecipientInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recentRecipients = [
    {
      name: 'Diya Sharma',
      vpa: 'diya@aegis',
      trustScore: 98,
      isVerified: true,
      isFlagged: false,
      category: 'TRUSTED' as const,
      lastPayment: '₹1,450 • 2 hours ago',
    },
    {
      name: 'Vikramaditya Roy',
      vpa: 'vikram@aegis',
      trustScore: 95,
      isVerified: true,
      isFlagged: false,
      category: 'TRUSTED' as const,
      lastPayment: '₹12,000 • Yesterday',
    },
    {
      name: 'Ananya Verma',
      vpa: 'ananya@aegis',
      trustScore: 94,
      isVerified: true,
      isFlagged: false,
      category: 'TRUSTED' as const,
      lastPayment: '₹8,500 • 2 days ago',
    },
    {
      name: 'Secure Cloud Labs Ltd',
      vpa: 'cloudlabs@aegis',
      trustScore: 99,
      isVerified: true,
      isFlagged: false,
      category: 'TRUSTED' as const,
      lastPayment: '₹22,000 • 5 days ago',
    },
    {
      name: 'Dubious Merchant Services',
      vpa: 'dubious77@aegis',
      trustScore: 32,
      isVerified: false,
      isFlagged: true,
      category: 'HIGH_RISK' as const,
      lastPayment: 'Flagged on ledger',
    },
    {
      name: 'Darknet Crypto Bridge Node',
      vpa: 'bridge99x@aegis',
      trustScore: 6,
      isVerified: false,
      isFlagged: true,
      category: 'HIGH_RISK' as const,
      lastPayment: 'Blocked off-ramp',
    },
  ];

  // Auto check VPA whenever input updates
  useEffect(() => {
    let isCancelled = false;
    const checkVpa = async () => {
      const trimmed = vpaInput.trim().toLowerCase();
      if (!trimmed) {
        setVerification(null);
        setErrorMessage(null);
        return;
      }

      setIsChecking(true);
      try {
        const res = await api.verifyBeneficiary(trimmed);
        if (isCancelled) return;

        if (!res.isValidSyntax) {
          setVerification(null);
          setErrorMessage('Invalid VPA syntax. Valid format must end in @aegis (e.g. name@aegis).');
        } else {
          setErrorMessage(null);
          setVerification({
            vpa: trimmed,
            name: res.name || trimmed.split('@')[0],
            isVerified: res.isVerified,
            isFlagged: res.isFlagged,
            trustScore: res.trustScore,
            category: res.category,
          });
        }
      } catch {
        if (!isCancelled) setErrorMessage('Unable to query routing registry.');
      } finally {
        if (!isCancelled) setIsChecking(false);
      }
    };

    const timer = setTimeout(checkVpa, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [vpaInput]);

  const handleSelectRecent = (recent: typeof recentRecipients[0]) => {
    setVpaInput(recent.vpa);
    setVerification({
      vpa: recent.vpa,
      name: recent.name,
      isVerified: recent.isVerified,
      isFlagged: recent.isFlagged,
      trustScore: recent.trustScore,
      category: recent.category,
    });
  };

  const handleContinue = () => {
    if (!verification) return;
    onSelectRecipient(verification);
  };

  return (
    <div className="space-y-6">
      {/* VPA Input Field */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-xs text-[#C5BDB7] uppercase tracking-wider">
            Enter Beneficiary UPI ID / VPA
          </label>
          {onOpenQrScanner && (
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FE7E3C] hover:underline cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#C5BDB7]">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={vpaInput}
            onChange={(e) => setVpaInput(e.target.value)}
            placeholder="recipient@aegis"
            className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#FE7E3C] font-mono text-base focus:border-[#FE7E3C] focus:ring-1 focus:ring-[#FE7E3C] outline-none transition-all placeholder:text-[#C5BDB7]"
          />
          {verification?.isVerified && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#10B981]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="mt-2 text-xs font-mono text-[#E4201B] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}
      </div>

      {/* Verified Beneficiary Information Card */}
      {verification && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            verification.isFlagged
              ? 'bg-[#E4201B]/10 border-[#E4201B]/40 text-[#E4201B]'
              : verification.isVerified
              ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#FE7E3C]/10 border-[#FE7E3C]/40 text-[#FE7E3C]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {verification.isFlagged ? (
                <ShieldAlert className="w-5 h-5 text-[#E4201B]" />
              ) : verification.isVerified ? (
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-[#FE7E3C]" />
              )}
              <span className="font-display font-bold text-sm text-[#F8F9FA]">
                {verification.name}
              </span>
            </div>

            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase">
              {verification.isFlagged
                ? 'CRITICAL THREAT FLAGGED'
                : verification.isVerified
                ? 'VERIFIED BENEFICIARY'
                : 'UNVERIFIED RECIPIENT'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#C5BDB7] pt-1">
            <div>
              <span className="text-[#C5BDB7] block text-[10px]">VPA:</span>
              <span className="text-[#F8F9FA]">{verification.vpa}</span>
            </div>
            <div>
              <span className="text-[#C5BDB7] block text-[10px]">Consensus Trust Rating:</span>
              <span className="font-bold">{verification.trustScore}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Recipients List */}
      <div>
        <span className="font-mono text-xs text-[#C5BDB7] uppercase tracking-wider block mb-3">
          Or Select from Known Counterparties
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {recentRecipients.map((recent) => (
            <button
              key={recent.vpa}
              type="button"
              onClick={() => handleSelectRecent(recent)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                vpaInput === recent.vpa
                  ? 'bg-[#FE7E3C]/15 border-[#FE7E3C] shadow-[0_0_15px_rgba(254,126,60,0.2)]'
                  : 'bg-[#122023] border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans font-bold text-xs text-[#F8F9FA] group-hover:text-[#FE7E3C] truncate">
                  {recent.name}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    recent.isFlagged
                      ? 'text-[#E4201B] bg-[#E4201B]/10 border border-[#E4201B]/30'
                      : 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30'
                  }`}
                >
                  {recent.isFlagged ? 'FLAGGED' : 'VERIFIED'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#FE7E3C] block">{recent.vpa}</span>
              <span className="font-mono text-[9px] text-[#C5BDB7] block mt-1">
                {recent.lastPayment}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Next Step CTA */}
      <div className="pt-4 flex justify-end">
        <GlowButton
          variant="primary"
          size="lg"
          disabled={!verification || verification.category === 'INVALID'}
          onClick={handleContinue}
          rightIcon={<ArrowRight className="w-5 h-5 ml-1" />}
          className="w-full sm:w-auto"
        >
          Continue to Amount
        </GlowButton>
      </div>
    </div>
  );
}

export default RecipientStep;
