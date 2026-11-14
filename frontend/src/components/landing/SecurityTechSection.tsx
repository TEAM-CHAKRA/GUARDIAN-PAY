'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  Smartphone,
  Hash,
  Layers,
  Activity,
  Flame,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export function SecurityTechSection() {
  const chainBlocks = [
    {
      index: '#842',
      prevHash: '00a4e7...91fc',
      hash: '3f8b91...d204',
      txCount: '18 txns',
      status: 'VERIFIED',
    },
    {
      index: '#843',
      prevHash: '3f8b91...d204',
      hash: '7c12a8...e491',
      txCount: '24 txns',
      status: 'VERIFIED',
    },
    {
      index: '#844',
      prevHash: '7c12a8...e491',
      hash: 'b5e902...1a88',
      txCount: '12 txns',
      status: 'VERIFIED',
    },
    {
      index: '#845',
      prevHash: 'b5e902...1a88',
      hash: 'fa33d1...88c2',
      txCount: '31 txns',
      status: 'LATEST',
    },
  ];

  const technologies = [
    {
      icon: KeyRound,
      title: 'OTP Verification',
      subtitle: 'Adaptive Multi-Factor',
      description:
        'Time-sensitive one-time passwords triggered whenever behavioural entropy exceeds baseline thresholds.',
    },
    {
      icon: ShieldCheck,
      title: 'Transaction PIN Protection',
      subtitle: 'Zero-Knowledge Attestation',
      description:
        'Salted and hashed 4-digit numeric credentials required for cryptographically signing every ledger debit.',
    },
    {
      icon: Smartphone,
      title: 'Device Recognition',
      subtitle: 'Hardware Fingerprinting',
      description:
        'Browser fingerprinting, user-agent telemetry, and persistent session tokens that instantly identify rogue logins.',
    },
    {
      icon: Hash,
      title: 'SHA-256 Transaction Hashing',
      subtitle: 'Cryptographic Integrity',
      description:
        'Every debit, credit, timestamp, and VPA coordinate is hashed into an immutable 64-character hexadecimal digest.',
    },
    {
      icon: Layers,
      title: 'Hash-Chain Ledger Verification',
      subtitle: 'Blockchain Merkle Consistency',
      description:
        'Parent block hash linkage ensures any manual tampering breaks consecutive block proofs, exposing discrepancies.',
    },
    {
      icon: Activity,
      title: 'Security Monitoring',
      subtitle: 'SecOps Radar v4.2',
      description:
        '24/7 autonomous monitoring of aggregate transaction velocity, risk distributions, and account health telemetry.',
    },
    {
      icon: Flame,
      title: 'Fraud Activity Detection',
      subtitle: 'Deterministic Attack Heuristics',
      description:
        'Built-in attack simulator patterns intercepting credential stuffing, velocity draining, and geo-impossible anomalies.',
    },
  ];

  return (
    <section id="security" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.45)] text-xs font-mono text-[#FE7E3C] uppercase tracking-[0.16em] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Implemented Infrastructure</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#F8F9FA] tracking-tight leading-[1.1]">
            Security &amp; Technology Stack
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#C5BDB7] leading-relaxed max-w-[65ch] mx-auto">
            Real implementations of cryptographic security and risk evaluation built into the GUARDIANPAY runtime.
          </p>
        </div>

        {/* Animated SHA-256 Hash Chain Visualization */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#FE7E3C]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[#F8F9FA] font-bold">
                Live SHA-256 Ledger Chain (Merkle Proof)
              </span>
            </div>
            <span className="font-mono text-xs text-[#10B981] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              INTEGRITY: 100% OK
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {chainBlocks.map((blk, i) => (
              <motion.div
                key={blk.index}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative"
              >
                <GlassCard className="p-4 bg-gradient-to-b from-[#1A2C30] to-[#0E6873]/20 border-[rgba(97,65,60,0.45)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#FE7E3C] px-2 py-0.5 rounded bg-[#FE7E3C]/15 border border-[#FE7E3C]/30">
                      BLOCK {blk.index}
                    </span>
                    <span className="font-mono text-[10px] text-[#10B981] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {blk.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px] pt-2 border-t border-[rgba(97,65,60,0.25)]">
                    <div className="flex justify-between text-[#C5BDB7]">
                      <span className="text-[#C5BDB7]/70">Prev:</span>
                      <span className="text-[#0E6873] font-semibold">{blk.prevHash}</span>
                    </div>
                    <div className="flex justify-between text-[#C5BDB7]">
                      <span className="text-[#C5BDB7]/70">Hash:</span>
                      <span className="text-[#F8F9FA] font-bold">{blk.hash}</span>
                    </div>
                    <div className="flex justify-between text-[#C5BDB7]">
                      <span className="text-[#C5BDB7]/70">Payload:</span>
                      <span className="text-[#FE7E3C]">{blk.txCount}</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Connecting Arrow for desktop */}
                {i < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.15 + 0.2 }}
                      className="w-4 h-0.5 bg-[#FE7E3C] shadow-[0_0_8px_#FE7E3C]"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technologies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech, index) => {
            const Icon = tech.icon;
            return (
              <motion.div
                key={tech.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <GlassCard
                  variant="interactive"
                  className="p-6 h-full flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FE7E3C]/20 to-[#0E6873]/30 border border-[#FE7E3C]/40 flex items-center justify-center text-[#FE7E3C] shadow-[0_0_15px_rgba(254,126,60,0.12)]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[10px] text-[#C5BDB7]/80 uppercase">
                        LAYER 0{index + 1}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                        {tech.title}
                      </h3>
                      <p className="font-mono text-[11px] text-[#FE7E3C] mb-2 font-medium">
                        {tech.subtitle}
                      </p>
                      <p className="text-xs text-[#C5BDB7] leading-relaxed font-sans">
                        {tech.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-[rgba(97,65,60,0.25)] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#C5BDB7]/80">Engine Spec</span>
                    <span className="text-[#10B981] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      ACTIVE
                    </span>
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

export default SecurityTechSection;
