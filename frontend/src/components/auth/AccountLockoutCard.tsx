'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export interface AccountLockoutCardProps {
  initialSeconds?: number;
  onReset?: () => void;
  userId?: string;
}

export function AccountLockoutCard({
  initialSeconds = 900,
  onReset,
  userId = 'USR-101',
}: AccountLockoutCardProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRecovering, setIsRecovering] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const handleRecovery = async () => {
    setIsRecovering(true);
    try {
      await api.resetPinLockout(userId);
      success(
        'Perimeter Unlocked',
        'Identity verified via emergency cryptographic bypass. Lockout cleared.'
      );
      if (onReset) onReset();
    } catch {
      error('Recovery Error', 'Failed to release lockout perimeter.');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#122023]/95 border border-[#E4201B]/40 shadow-[0_12px_40px_rgba(228,32,27,0.2)] text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(228,32,27,0.3)]">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#E4201B] font-bold">
          [SECURITY LOCKOUT ACTIVE]
        </span>
        <h3 className="font-display text-xl font-bold text-[#F8F9FA] mt-1">
          Account Enclave Protected
        </h3>
        <p className="font-sans text-xs text-[#C5BDB7] mt-2 max-w-sm mx-auto leading-relaxed">
          Three consecutive failed security challenges were detected. To protect your simulated
          wallet assets from brute-force attempts, access has been quarantined.
        </p>
      </div>

      {/* Countdown Timer Display */}
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#1A2C30] border border-[rgba(97,65,60,0.35)] font-mono">
        <Clock className="w-4 h-4 text-[#FE7E3C]" />
        <span className="text-xs text-[#C5BDB7]">Lockout Remaining:</span>
        <span className="text-sm font-bold text-[#FE7E3C]">{formattedTime}</span>
      </div>

      {/* Safe Recovery Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <GlowButton
          variant="secondary"
          size="md"
          leftIcon={<RefreshCw className={`w-4 h-4 ${isRecovering ? 'animate-spin' : ''}`} />}
          onClick={handleRecovery}
          isLoading={isRecovering}
          className="w-full sm:w-auto"
        >
          Verify Identity &amp; Unlock
        </GlowButton>
      </div>

      <p className="text-[10px] font-mono text-[#C5BDB7]">
        AegisGuard Intrusion Detection System • Event #ALT-904 Logged
      </p>
    </div>
  );
}

export default AccountLockoutCard;
