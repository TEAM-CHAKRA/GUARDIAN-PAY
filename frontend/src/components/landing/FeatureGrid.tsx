'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  SendHorizontal,
  BrainCircuit,
  KeyRound,
  Activity,
  QrCode,
  FileCheck2,
  Layers,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export function FeatureGrid() {
  const features = [
    {
      id: 'wallet',
      icon: Wallet,
      title: 'Smart Digital Wallet',
      description:
        'Dual-entry simulated financial ledger with instant balance synchronization and automatic micro-savings round-ups.',
    },
    {
      id: 'transfers',
      icon: SendHorizontal,
      title: 'Simulated Money Transfers',
      description:
        'Instant peer-to-peer and VPA payment simulations that test end-to-end velocity thresholds without risking real capital.',
    },
    {
      id: 'ai-fraud',
      icon: BrainCircuit,
      title: 'AI Fraud Detection',
      description:
        'Contextual anomaly detection evaluating recipient familiarity, device telemetry, geographical bounds, and temporal patterns.',
    },
    {
      id: 'adaptive-auth',
      icon: KeyRound,
      title: 'Adaptive Authentication',
      description:
        'Dynamic security gate which escalates low-risk PIN inputs to stepped-up OTP challenges when anomalies are flagged.',
    },
    {
      id: 'risk-scoring',
      icon: Activity,
      title: 'Real-Time Risk Assessment',
      description:
        'Sub-15 millisecond scoring engine calculating calibrated 0–100 threat scores and deterministic policy recommendations.',
    },
    {
      id: 'qr-payments',
      icon: QrCode,
      title: 'QR Code Payments',
      description:
        'Encrypted zero-knowledge payment generation for rapid merchant and peer scan-and-pay simulated settlement.',
    },
    {
      id: 'crypto-receipts',
      icon: FileCheck2,
      title: 'Cryptographic Transaction Receipts',
      description:
        'Independently verifiable settlement proof containing full UTR timestamps, recipient telemetry, and Merkle leaf hashes.',
    },
    {
      id: 'sha256-ledger',
      icon: Layers,
      title: 'SHA-256 Ledger Verification',
      description:
        'Immutable hash-chain structure where every block links cryptographically to its parent, guaranteeing anti-tamper auditability.',
    },
    {
      id: 'monitoring',
      icon: Eye,
      title: 'Transaction Monitoring',
      description:
        'Complete chronological audit trails with comprehensive status filters, risk breakdowns, and downloadable settlement records.',
    },
    {
      id: 'security-mgmt',
      icon: ShieldAlert,
      title: 'Security Management',
      description:
        'Emergency wallet lock down, real-time velocity limit tuning, device attestation management, and cryptographic PIN rotation.',
    },
  ];

  return (
    <section id="features" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Faint dotted grid backdrop (radial-gradient of dots at 24px pitch, teal 20%) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(14, 104, 115, 0.22) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 60%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 60%, transparent 100%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.45)] text-xs font-mono text-[#FE7E3C] uppercase tracking-[0.16em] font-semibold">
            <span>Enterprise Fintech Architecture</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#F8F9FA] tracking-tight leading-[1.1]">
            Ten Core Capabilities. <br />
            <span className="text-[#FE7E3C]">One Unified</span> Security Architecture.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#C5BDB7] leading-relaxed max-w-[65ch] mx-auto">
            Every feature of GUARDIANPAY is designed to balance user convenience with military-grade fraud interception.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <GlassCard
                  variant="interactive"
                  className="p-6 h-full flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FE7E3C]/20 to-[#0E6873]/30 border border-[#FE7E3C]/40 flex items-center justify-center text-[#FE7E3C] group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#F8F9FA] group-hover:text-white transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-[#C5BDB7] leading-relaxed font-sans">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[rgba(97,65,60,0.3)] flex items-center justify-between text-[11px] font-mono text-[#C5BDB7]">
                    <span className="text-[#C5BDB7]/80">MOD 0{index + 1}</span>
                    <span className="text-[#10B981] font-semibold tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
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

export default FeatureGrid;
