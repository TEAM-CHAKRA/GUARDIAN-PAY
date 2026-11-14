'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import HeroWalletCockpit from './HeroWalletCockpit';

export function HeroSection() {
  const handleScrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.getElementById('features');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typography & Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-start text-left z-10"
          >
            {/* Tagline Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E6873]/30 border border-[rgba(254,126,60,0.45)] shadow-[0_0_20px_rgba(254,126,60,0.2)] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#FE7E3C] animate-ping" />
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#FE7E3C]">
                Every rupee, protected intelligently
              </span>
            </div>

            {/* Main Headline (72-80px on desktop) */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-[#F8F9FA] leading-[1.02] mb-6">
              Intelligent Payments. <br />
              <span className="bg-gradient-to-r from-[#FE7E3C] via-[#FE7E3C] to-[#E4201B] bg-clip-text text-transparent">
                Cryptographic Trust.
              </span>
            </h1>

            {/* Product Explanation */}
            <p className="font-sans text-base sm:text-lg md:text-xl text-[#C5BDB7] max-w-[65ch] leading-[1.6] mb-8">
              GUARDIANPAY is a smart digital wallet engineered with real-time AI fraud detection, sub-15ms transaction risk scoring, adaptive step-up authentication, and SHA-256 cryptographic ledger verification.
            </p>

            {/* CTAs: Get Started & Explore Features */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
              <Link href="/register">
                <GlowButton
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowUpRight className="w-5 h-5 ml-1" />}
                  className="w-full sm:w-auto shadow-[0_0_30px_rgba(254,126,60,0.4)] font-semibold"
                >
                  Get Started
                </GlowButton>
              </Link>

              <a href="#features" onClick={handleScrollToFeatures}>
                <GlowButton
                  variant="secondary"
                  size="lg"
                  leftIcon={<ChevronDown className="w-5 h-5 text-[#FE7E3C]" />}
                  className="w-full sm:w-auto font-medium"
                >
                  Explore Features
                </GlowButton>
              </a>
            </div>

            {/* Security and Fraud Protection Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[rgba(97,65,60,0.35)] w-full max-w-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="text-xs font-mono text-[#C5BDB7]">
                  Autonomous AI Anomaly Engine
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="text-xs font-mono text-[#C5BDB7]">
                  Tamper-Evident SHA-256 Ledger
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Premium Web Wallet Cockpit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center lg:justify-end z-10"
          >
            <HeroWalletCockpit />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
