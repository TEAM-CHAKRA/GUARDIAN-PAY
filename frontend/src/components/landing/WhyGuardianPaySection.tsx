'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  Sliders,
  FileQuestion,
  FileKey,
  Sparkles,
  Check,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export function WhyGuardianPaySection() {
  const benefits = [
    {
      icon: Radar,
      title: 'Intelligent Payment Monitoring',
      description:
        'Continuous analysis of transfer cadence, geographical velocity, and anomaly trends before transactions settle.',
    },
    {
      icon: Sliders,
      title: 'Adaptive Security',
      description:
        'Security thresholds automatically adjust to the transaction risk level, asking for extra verification only when necessary.',
    },
    {
      icon: FileQuestion,
      title: 'Transparent Risk Explanations',
      description:
        'Clear, plain-language rationales for every security decision so users understand why a payment was held or stepped-up.',
    },
    {
      icon: FileKey,
      title: 'Cryptographic Transaction Verification',
      description:
        'Publicly verifiable SHA-256 block hashes provide mathematical proof of transaction validity and immutability.',
    },
    {
      icon: Sparkles,
      title: 'User-Focused Wallet Experience',
      description:
        'A clean, responsive interface offering fast simulated transfers, instant QR generation, and automatic round-up micro-savings.',
    },
  ];

  return (
    <section className="relative py-24 border-t border-[rgba(97,65,60,0.3)] bg-[#122023]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)] text-xs font-mono text-[#FE7E3C] uppercase tracking-wider font-bold">
            <span>Core Advantages</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#F8F9FA] tracking-tight">
            Why GUARDIANPAY
          </h2>
          <p className="font-sans text-base text-[#C5BDB7] leading-relaxed">
            Five core design principles that make digital payments safer, faster, and completely verifiable.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={index === 4 ? 'md:col-span-2 lg:col-span-1' : ''}
              >
                <GlassCard className="p-6 h-full flex flex-col justify-between border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C]/40 transition-all duration-300">
                  <div className="space-y-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/30 flex items-center justify-center text-[#FE7E3C]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#C5BDB7] leading-relaxed font-sans">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-[rgba(97,65,60,0.2)] flex items-center gap-2 text-xs font-mono text-[#10B981]">
                    <Check className="w-4 h-4 text-[#10B981]" />
                    <span>Engineered for Safety</span>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyGuardianPaySection;
