'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ShieldCheck, Lock } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';

export function FinalCtaSection() {
  const handleScrollToSecurity = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.getElementById('security');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-28 sm:py-36 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Orange Aurora Panel Card */}
        <div className="relative rounded-3xl p-8 sm:p-14 lg:p-16 border border-[#FE7E3C]/40 shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_50px_rgba(254,126,60,0.18)] overflow-hidden bg-gradient-to-br from-[#1A2C30]/95 via-[#0E6873]/25 to-[#61413C]/35 backdrop-blur-2xl text-center">
          {/* Animated Orange Aurora Glow */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-[#FE7E3C]/25 to-[#E4201B]/15 blur-3xl"
            animate={{
              x: [0, 80, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-tl from-[#0E6873]/35 to-[#FE7E3C]/20 blur-3xl"
            animate={{
              x: [0, -60, 0],
              y: [0, -40, 0],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Slow shimmer sweep across the surface */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -skew-x-12 opacity-30"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(254,126,60,0.15) 50%, transparent 100%)',
            }}
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Top highlight line */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FE7E3C]/60 to-transparent"
          />

          <div className="relative z-10">
            {/* Shield Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FE7E3C]/20 to-[#0E6873]/30 border border-[#FE7E3C]/50 flex items-center justify-center mx-auto mb-6 text-[#FE7E3C] shadow-[0_0_30px_rgba(254,126,60,0.35)]">
              <ShieldCheck className="w-8 h-8" />
            </div>

            {/* Heading */}
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-[#F8F9FA] tracking-tight mb-4 leading-[1.08]">
              Your money deserves <br />
              <span className="bg-gradient-to-r from-[#FE7E3C] via-[#FE7E3C] to-[#E4201B] bg-clip-text text-transparent">
                intelligent protection.
              </span>
            </h2>

            {/* Supporting description */}
            <p className="font-sans text-base sm:text-lg text-[#C5BDB7] max-w-[65ch] mx-auto mb-10 leading-relaxed">
              Experience next-generation digital payments with autonomous fraud scoring, adaptive step-up authentication, and SHA-256 cryptographic proof.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <GlowButton
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowUpRight className="w-5 h-5 ml-1" />}
                  className="w-full sm:w-auto font-semibold shadow-[0_0_30px_rgba(254,126,60,0.4)]"
                >
                  Create Your Wallet
                </GlowButton>
              </Link>

              <a href="#security" onClick={handleScrollToSecurity} className="w-full sm:w-auto">
                <GlowButton
                  variant="secondary"
                  size="lg"
                  leftIcon={<Lock className="w-4 h-4 text-[#FE7E3C]" />}
                  className="w-full sm:w-auto"
                >
                  Explore Security
                </GlowButton>
              </a>
            </div>

            {/* Simulation Note */}
            <p className="text-xs font-mono text-[#C5BDB7] mt-8 tracking-wide">
              Instant onboarding • Simulation environment • Dual-entry verified
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCtaSection;
