'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Target, Compass, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';

export function AboutPreviewSection() {
  return (
    <section className="relative py-20 border-t border-[rgba(97,65,60,0.3)] bg-[#1A2C30]/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: About Summary */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)] text-xs font-mono text-[#FE7E3C] uppercase tracking-wider font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>About GUARDIANPAY</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-black text-[#F8F9FA] tracking-tight leading-tight">
              A New Standard in <br />
              <span className="text-[#FE7E3C]">Fraud-Resistant</span> Payments
            </h2>

            <p className="font-sans text-base text-[#C5BDB7] leading-relaxed">
              GUARDIANPAY was created to bridge the critical gap between digital payment convenience and proactive transaction security. While traditional payment rails rely on post-incident dispute resolution, GUARDIANPAY evaluates transaction telemetry before money moves.
            </p>

            <div className="pt-2">
              <Link href="/about">
                <GlowButton
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                  Learn More About Us
                </GlowButton>
              </Link>
            </div>
          </div>

          {/* Right: Mission and Vision Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/30 flex items-center justify-center text-[#FE7E3C]">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                Our Mission
              </h3>
              <p className="text-sm text-[#C5BDB7] leading-relaxed">
                To empower users and businesses with transparent, autonomous fraud detection that prevents financial compromise in real time.
              </p>
            </GlassCard>

            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0E6873]/40 border border-[#0E6873]/60 flex items-center justify-center text-[#FE7E3C]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                Our Vision
              </h3>
              <p className="text-sm text-[#C5BDB7] leading-relaxed">
                An ecosystem where every transaction is provably immutable, verifiably signed, and shielded from synthetic account takeovers.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutPreviewSection;
