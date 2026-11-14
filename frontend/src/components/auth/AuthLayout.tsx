'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Cpu, ArrowLeft } from 'lucide-react';
import AnimatedGrid from '@/components/background/AnimatedGrid';
import { GlassCard } from '@/components/ui/GlassCard';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  backHref?: string;
  backLabel?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  backHref = '/',
  backLabel = 'Back to Home',
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#1A2C30] text-[#F8F9FA] flex flex-col justify-center overflow-x-hidden">
      <AnimatedGrid />

      {/* Main Split Layout Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Top Back Nav */}
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors p-1 rounded-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT PANEL: Brand & Floating Security Badges */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex lg:col-span-6 flex-col justify-between h-full space-y-8 pr-4"
          >
            <div>
              {/* Brand Logo */}
              <Link href="/" className="inline-flex items-center gap-2.5 mb-8 group">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FE7E3C]/20 via-[#0E6873]/30 to-[#61413C]/20 border border-[#FE7E3C]/40 shadow-[0_0_20px_rgba(254,126,60,0.3)] group-hover:border-[#FE7E3C] transition-colors">
                  <Shield className="w-6 h-6 text-[#FE7E3C]" />
                  <span className="absolute font-mono font-black text-xs text-white">₹</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-xl tracking-wider text-[#F8F9FA]">
                    GUARDIAN<span className="text-[#FE7E3C]">PAY</span>
                  </span>
                  <span className="font-mono text-[9px] tracking-widest text-[#C5BDB7] uppercase -mt-0.5">
                    AUTONOMOUS WALLET
                  </span>
                </div>
              </Link>

              {/* Large Heading */}
              <h1 className="font-display text-4xl xl:text-5xl font-black text-[#F8F9FA] tracking-tight leading-[1.12] mb-4">
                Security begins <br />
                with <span className="text-gradient-primary">identity.</span>
              </h1>

              <p className="font-sans text-base text-[#C5BDB7] leading-relaxed max-w-md">
                Zero-trust biometric perimeter and tamper-evident cryptographic session anchoring.
                Every authentication challenge is signed on-device before clearance.
              </p>
            </div>

            {/* Center Animated Shield & Security Cards */}
            <div className="relative my-8 py-8 flex items-center justify-center">
              {/* Pulsing Concentric Rings */}
              <div
                aria-hidden="true"
                className="absolute w-64 h-64 rounded-full border border-[rgba(14,104,115,0.25)] animate-[spin_40s_linear_infinite]"
              />
              <div
                aria-hidden="true"
                className="absolute w-48 h-48 rounded-full border border-dashed border-[rgba(97,65,60,0.35)] animate-[spin_25s_linear_infinite_reverse]"
              />

              {/* Central Glowing Shield */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="relative w-28 h-28 rounded-3xl bg-[#122023] border-2 border-[#FE7E3C] shadow-[0_0_35px_rgba(254,126,60,0.35)] flex items-center justify-center text-[#FE7E3C]"
              >
                <ShieldCheck className="w-14 h-14" />
                <span className="absolute font-mono font-black text-xl text-white">₹</span>
              </motion.div>

              {/* Floating Card 1: Top Right */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -top-2 right-4 px-3.5 py-2 rounded-xl bg-[#16363B]/85 border border-[rgba(97,65,60,0.4)] shadow-[0_8px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center gap-2.5 font-mono text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-[#F8F9FA] font-semibold">Enclave Key: Bound</span>
              </motion.div>

              {/* Floating Card 2: Bottom Left */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-2 left-4 px-3.5 py-2 rounded-xl bg-[#16363B]/85 border border-[rgba(97,65,60,0.4)] shadow-[0_8px_20px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center gap-2.5 font-mono text-xs"
              >
                <Cpu className="w-4 h-4 text-[#FE7E3C]" />
                <span className="text-[#C5BDB7]">Risk Score:</span>
                <span className="text-[#10B981] font-bold">04/100 (Safe)</span>
              </motion.div>
            </div>

            {/* Tagline footer */}
            <div className="pt-4 border-t border-[rgba(97,65,60,0.35)] flex items-center justify-between text-xs font-mono text-[#C5BDB7]">
              <span>AEGISGUARD PROTOCOL v4.2</span>
              <span className="text-[#FE7E3C]">Every rupee, verified.</span>
            </div>
          </motion.div>

          {/* RIGHT PANEL: Authentication Form Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full max-w-lg mx-auto"
          >
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6">
              <Link href="/" className="inline-flex items-center gap-2 mb-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FE7E3C]/20 to-[#0E6873]/30 border border-[#FE7E3C]/40">
                  <Shield className="w-5 h-5 text-[#FE7E3C]" />
                  <span className="absolute font-mono font-black text-xs text-white">₹</span>
                </div>
                <span className="font-display font-black text-xl text-[#F8F9FA]">
                  GUARDIAN<span className="text-[#FE7E3C]">PAY</span>
                </span>
              </Link>
              <h2 className="font-display text-xl font-bold text-[#F8F9FA]">{title}</h2>
              <p className="text-xs text-[#C5BDB7] mt-0.5">{subtitle}</p>
            </div>

            {/* Authentication Form Card */}
            <GlassCard
              variant="elevated"
              padding="lg"
              className="border-[rgba(14,104,115,0.45)] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(14,104,115,0.15)] backdrop-blur-2xl"
            >
              <div className="hidden lg:block mb-6 pb-4 border-b border-[rgba(97,65,60,0.3)]">
                <h2 className="font-display text-2xl font-bold text-[#F8F9FA] tracking-tight">
                  {title}
                </h2>
                <p className="font-sans text-xs text-[#C5BDB7] mt-1">{subtitle}</p>
              </div>

              {children}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
