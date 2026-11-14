'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Target,
  Compass,
  Lightbulb,
  Cpu,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AnimatedGrid from '@/components/background/AnimatedGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-[#1A2C30] text-[#F8F9FA] overflow-x-hidden">
      {/* Background Grid */}
      <AnimatedGrid />

      {/* Public Navbar (Home, About Us, Login, Register) */}
      <Navbar />

      <main className="relative z-10 pt-28 pb-24">
        {/* 1. Header / About GUARDIANPAY */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E6873]/30 border border-[rgba(254,126,60,0.35)] shadow-[0_0_20px_rgba(254,126,60,0.2)] mb-6">
            <Shield className="w-3.5 h-3.5 text-[#FE7E3C]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FE7E3C]">
              About GUARDIANPAY
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-[#F8F9FA] leading-tight max-w-4xl mx-auto mb-6">
            Engineering Trust for Modern <br />
            <span className="bg-gradient-to-r from-[#FE7E3C] to-[#E4201B] bg-clip-text text-transparent">
              Digital Transactions.
            </span>
          </h1>

          <p className="font-sans text-base sm:text-lg text-[#C5BDB7] max-w-3xl mx-auto leading-relaxed">
            GUARDIANPAY is a proactive fintech security architecture built to demonstrate how smart digital wallets can intercept payment fraud before funds are transferred. By blending machine-learned anomaly scoring with cryptographic ledger immutability, we provide mathematical certainty for every settled transaction.
          </p>
        </section>

        {/* 2 & 3. Project Vision & Mission */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vision */}
            <GlassCard className="p-8 border-[rgba(97,65,60,0.35)] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/30 flex items-center justify-center text-[#FE7E3C]">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#F8F9FA]">
                Our Vision
              </h2>
              <p className="text-sm text-[#C5BDB7] leading-relaxed font-sans">
                We envision a digital financial system where payment safety is not an afterthought handled days after a fraud event, but an inherent, continuous safeguard that verifies identity, context, and intent with zero friction for legitimate users.
              </p>
            </GlassCard>

            {/* Mission */}
            <GlassCard className="p-8 border-[rgba(97,65,60,0.35)] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0E6873]/40 border border-[#0E6873]/60 flex items-center justify-center text-[#FE7E3C]">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl font-bold text-[#F8F9FA]">
                Our Mission
              </h2>
              <p className="text-sm text-[#C5BDB7] leading-relaxed font-sans">
                To build transparent, adaptive security tools that democratize enterprise-grade fraud detection. We aim to prove that cryptographic verification and machine learning can operate harmoniously within high-throughput consumer digital wallet environments.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* 4. Why The Project Was Created */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <GlassCard className="p-8 sm:p-12 border-[rgba(97,65,60,0.35)] space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)] text-xs font-mono text-[#FE7E3C] uppercase tracking-wider font-bold">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Project Genesis</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#F8F9FA]">
              Why GUARDIANPAY Was Created
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-[#C5BDB7] leading-relaxed font-sans">
              <p>
                In today&apos;s fast-paced digital economy, instant payment rails such as UPI and peer-to-peer wallets process billions of rupees every day. However, speed often comes at the cost of vulnerability to social engineering, SIM-swap attacks, device spoofing, and malicious recipient diversion.
              </p>
              <p>
                GUARDIANPAY was engineered as a comprehensive solution to these challenges: testing how real-time velocity monitoring, device attestation, and dynamic step-up verification can preemptively block fraud without slowing down everyday honest commerce.
              </p>
            </div>
          </GlassCard>
        </section>

        {/* 5. Core Philosophy */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)] text-xs font-mono text-[#FE7E3C] uppercase tracking-wider font-bold">
              <span>Core Values</span>
            </div>
            <h2 className="font-display text-3xl font-black text-[#F8F9FA]">
              Our Core Philosophy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/30 flex items-center justify-center text-[#FE7E3C]">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                1. Transparent Security
              </h3>
              <p className="text-xs text-[#C5BDB7] leading-relaxed font-sans">
                Security should never be an opaque black box. Users are entitled to clear explanations of why risk decisions are made.
              </p>
            </GlassCard>

            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/30 flex items-center justify-center text-[#FE7E3C]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                2. Adaptive Friction
              </h3>
              <p className="text-xs text-[#C5BDB7] leading-relaxed font-sans">
                Friction is only applied when risk demands it. Safe payments stay instantaneous, while anomalies receive proportional scrutiny.
              </p>
            </GlassCard>

            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/30 flex items-center justify-center text-[#FE7E3C]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                3. Mathematical Certainty
              </h3>
              <p className="text-xs text-[#C5BDB7] leading-relaxed font-sans">
                Relying on immutable SHA-256 hash chains ensures that records cannot be altered retroactively by any single entity.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* 6. Technology Overview */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <GlassCard className="p-8 sm:p-10 border-[rgba(97,65,60,0.35)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(97,65,60,0.25)]">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F8F9FA]">
                  Technology Stack Overview
                </h2>
                <p className="text-xs font-mono text-[#C5BDB7] mt-1">
                  Built entirely as a modern responsive web platform
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-mono text-xs font-bold self-start sm:self-auto">
                ALL SYSTEMS ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#122023]/80 border border-[rgba(97,65,60,0.25)] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#C5BDB7]">Frontend</span>
                <p className="font-mono text-sm font-bold text-[#F8F9FA]">Next.js 16 App Router</p>
                <p className="text-xs text-[#C5BDB7]">React 19 &amp; Tailwind CSS</p>
              </div>

              <div className="p-4 rounded-xl bg-[#122023]/80 border border-[rgba(97,65,60,0.25)] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#C5BDB7]">AI Risk Engine</span>
                <p className="font-mono text-sm font-bold text-[#FE7E3C]">Heuristic Anomaly Model</p>
                <p className="text-xs text-[#C5BDB7]">&lt;15ms deterministic scoring</p>
              </div>

              <div className="p-4 rounded-xl bg-[#122023]/80 border border-[rgba(97,65,60,0.25)] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#C5BDB7]">Cryptography</span>
                <p className="font-mono text-sm font-bold text-[#10B981]">SHA-256 Ledger Chain</p>
                <p className="text-xs text-[#C5BDB7]">Merkle parent link proofs</p>
              </div>

              <div className="p-4 rounded-xl bg-[#122023]/80 border border-[rgba(97,65,60,0.25)] space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#C5BDB7]">SecOps Command</span>
                <p className="font-mono text-sm font-bold text-[#E4201B]">Attack Simulator Lab</p>
                <p className="text-xs text-[#C5BDB7]">Autonomous policy controls</p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* 7. Closing CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#122023] to-[#1A2C30] border border-[rgba(97,65,60,0.4)] shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-black text-[#F8F9FA]">
              Ready to explore intelligent payment protection?
            </h2>
            <p className="text-sm sm:text-base text-[#C5BDB7] max-w-xl mx-auto font-sans leading-relaxed">
              Launch the live wallet simulation, trigger test payment scenarios, and observe how the AI anomaly engine defends your account in real time.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <GlowButton
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowUpRight className="w-5 h-5 ml-1" />}
                >
                  Create Your Demo Wallet
                </GlowButton>
              </Link>
              <Link href="/login">
                <GlowButton variant="secondary" size="lg">
                  Sign In to Existing Account
                </GlowButton>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <Footer />
    </div>
  );
}
