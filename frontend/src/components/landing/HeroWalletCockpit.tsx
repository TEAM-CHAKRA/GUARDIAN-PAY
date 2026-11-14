'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { HashChip } from '@/components/ui/HashChip';
import { CountUp } from '@/components/ui/CountUp';

export function HeroWalletCockpit() {
  return (
    <div className="relative w-full max-w-lg mx-auto flex items-center justify-center p-2">
      {/* Outer ambient glow behind cockpit */}
      <div
        aria-hidden="true"
        className="absolute w-80 h-96 rounded-full bg-gradient-to-tr from-[#FE7E3C]/20 via-[#0E6873]/30 to-[#61413C]/20 blur-[90px] pointer-events-none"
      />

      {/* Main Floating Cockpit Card with Rotating Conic-Gradient Border */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [0, -8, 0], opacity: 1 }}
        transition={{
          y: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
          opacity: { duration: 0.8 },
        }}
        className="relative p-[1.5px] rounded-[26px] overflow-hidden w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(254,126,60,0.25)]"
      >
        {/* Rotating thin orange conic-gradient border */}
        <div
          aria-hidden="true"
          className="absolute -inset-[100%] animate-[spin_8s_linear_infinite] pointer-events-none"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0%, #FE7E3C 25%, #0E6873 50%, #61413C 75%, transparent 100%)',
          }}
        />

        <div className="relative w-full rounded-[24px] p-5 bg-[#122023]/95 border border-[rgba(97,65,60,0.4)] backdrop-blur-2xl space-y-4">
          {/* Cockpit Web Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.35)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FE7E3C]/15 border border-[#FE7E3C]/40 flex items-center justify-center text-[#FE7E3C]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-display font-bold text-sm text-[#F8F9FA]">Verified Digital Wallet</p>
                <p className="font-mono text-[10px] text-[#FE7E3C]">user@guardianpay</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-mono text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>AI SECURED</span>
            </div>
          </div>

          {/* Primary Wallet Card */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[#0E6873]/50 via-[#1A2C30]/80 to-[#122023] border border-[rgba(254,126,60,0.35)] shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-15 text-[#FE7E3C]">
              <Sparkles className="w-14 h-14" />
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C5BDB7]">
                Available Simulated Balance
              </span>
              <Lock className="w-3.5 h-3.5 text-[#FE7E3C]" />
            </div>
            <div className="font-mono text-3xl font-black text-[#F8F9FA] tracking-tight">
              <CountUp value={84250} prefix="₹" decimals={2} duration={1.5} />
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-[10px] font-mono text-[#C5BDB7]">
              <span>Daily Cap: ₹2,00,000</span>
              <span className="text-[#10B981] font-semibold">Dual-Entry Verified</span>
            </div>
          </div>

          {/* Live AI Risk Assessment Row */}
          <div className="p-3.5 rounded-xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#FE7E3C]/10 text-[#FE7E3C]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-display font-semibold text-[#F8F9FA]">Autonomous Risk Scoring</p>
                <p className="text-[10px] font-mono text-[#C5BDB7]">Evaluation latency: &lt;12ms</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30">
                LOW RISK (08/100)
              </span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Ledger Chip */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#C5BDB7]">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#FE7E3C]" />
                Latest Block Hash
              </span>
              <span className="text-[#10B981] font-semibold">BLOCK #1042</span>
            </div>
            <HashChip hash="3a9f8b2c4d1e7f0a6b5c8d2e4f1a9b7c8d0e2f4a6b8c" truncate={true} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default HeroWalletCockpit;
