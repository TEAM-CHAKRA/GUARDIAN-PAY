'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import AnimatedGrid from '@/components/background/AnimatedGrid';
import { GlowButton } from '@/components/ui/GlowButton';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#1A2C30] text-[#F8F9FA] overflow-hidden">
      <AnimatedGrid />

      <div className="relative z-10 max-w-md w-full text-center p-8 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        <div className="w-16 h-16 rounded-2xl bg-[#E4201B]/10 border border-[#E4201B]/30 text-[#E4201B] flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(228,32,27,0.25)]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="font-mono text-xs uppercase tracking-widest text-[#E4201B] font-semibold">
          Error 404 • Ledger Path Not Found
        </span>

        <h1 className="font-display text-3xl font-bold tracking-tight text-[#F8F9FA] mt-2 mb-3">
          Unverified Hash Route
        </h1>

        <p className="text-sm text-[#C5BDB7] leading-relaxed mb-8 font-sans">
          The requested coordinate or transaction receipt does not exist on the GUARDIANPAY consensus tree.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <GlowButton variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />} className="w-full">
              Return Home
            </GlowButton>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <GlowButton variant="secondary" size="md" className="w-full">
              Launch Console
            </GlowButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
