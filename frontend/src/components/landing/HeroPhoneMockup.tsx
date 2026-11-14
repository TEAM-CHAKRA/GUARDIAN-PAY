'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Wifi,
  Battery,
  Lock,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { HashChip } from '@/components/ui/HashChip';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function HeroPhoneMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto flex items-center justify-center p-4">
      {/* Outer ambient glow behind phone */}
      <div
        aria-hidden="true"
        className="absolute w-72 h-96 rounded-full bg-gradient-to-tr from-[#FE7E3C]/20 via-[#0E6873]/30 to-[#61413C]/20 blur-[80px] pointer-events-none"
      />

      {/* Main Floating Phone Device */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: [0, -10, 0], opacity: 1 }}
        transition={{
          y: { repeat: Infinity, duration: 6, ease: 'easeInOut' },
          opacity: { duration: 0.8 },
        }}
        className="relative w-full max-w-[340px] rounded-[38px] p-3.5 bg-gradient-to-b from-[#16363B]/90 via-[#1A2C30]/95 to-[#122023] border-2 border-[rgba(254,126,60,0.35)] shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(254,126,60,0.2)] backdrop-blur-2xl"
      >
        {/* Device Notch / Dynamic Island */}
        <div className="flex items-center justify-between px-5 pt-1.5 pb-2">
          <span className="font-mono text-[10px] text-[#C5BDB7]">09:41</span>
          <div className="w-20 h-4 rounded-full bg-[#122023] border border-[rgba(97,65,60,0.4)] flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[8px] font-mono tracking-widest text-[#FE7E3C]">SECURE</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#C5BDB7]">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3 h-3 text-[#10B981]" />
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="p-3.5 space-y-3.5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FE7E3C]/15 border border-[#FE7E3C]/40 flex items-center justify-center text-[#FE7E3C]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-display font-bold text-xs text-[#F8F9FA]">Aarav Mehta</p>
                <p className="font-mono text-[9px] text-[#FE7E3C]">aarav@aegis</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-mono text-[9px] font-bold">
              VERIFIED
            </span>
          </div>

          {/* Wallet Balance Card */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-br from-[#0E6873]/60 to-[#1A2C30]/80 border border-[rgba(254,126,60,0.35)] shadow-lg overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-15 text-[#FE7E3C]">
              <Sparkles className="w-12 h-12" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#C5BDB7]">
                Simulated Balance
              </span>
              <Lock className="w-3 h-3 text-[#FE7E3C]" />
            </div>
            <div className="font-mono text-2xl font-black text-[#F8F9FA] tracking-tight">
              ₹84,250<span className="text-sm text-[#FE7E3C]">.00</span>
            </div>
            <p className="text-[9px] text-[#C5BDB7] font-mono mt-1">
              Daily Limit: ₹2,00,000 • Dual-Entry Intact
            </p>
          </div>

          {/* Live AI Risk Shield Assessment */}
          <div className="p-3.5 rounded-2xl bg-[#122023]/80 border border-[rgba(97,65,60,0.35)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#FE7E3C]" />
                <span className="font-display font-semibold text-[11px] text-[#F8F9FA]">
                  AI Anomaly Engine
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#10B981] font-bold">
                PROTECTED
              </span>
            </div>

            <div className="flex items-center gap-3">
              <RiskGauge score={8} size="sm" showLabel={false} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#C5BDB7]">Risk Score</span>
                  <span className="text-[#10B981] font-bold">08/100 (LOW)</span>
                </div>
                <div className="w-full bg-[#1A2C30] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#10B981] h-full w-[8%]" />
                </div>
                <p className="text-[8.5px] text-[#C5BDB7] leading-tight">
                  180+ Telemetry signals passed. Zero anomaly vectors.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Protected Payment Card */}
          <div className="p-3 rounded-xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.3)] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-sans font-medium text-[11px] text-[#F8F9FA]">
                  Diya Sharma
                </span>
              </div>
              <span className="font-mono font-bold text-[11px] text-[#10B981]">
                -₹1,450.00
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-[#C5BDB7]">
              <span>diya@aegis</span>
              <StatusBadge status="SUCCESS" size="sm" showDot={false} />
            </div>
          </div>

          {/* Cryptographic SHA-256 seal chip */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[9px] font-mono text-[#C5BDB7]">Block #40 Seal:</span>
            <HashChip hash="0x9fa481e3d7cb0912ae4c9201bd74f194e82b4012" startLength={5} endLength={4} />
          </div>
        </div>
      </motion.div>

      {/* Floating Badge 1: Top-Left Security Pill */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, -6, 0] }}
        transition={{
          y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.5 },
          opacity: { duration: 0.6 },
        }}
        className="hidden sm:flex absolute -left-8 top-12 items-center gap-2 px-3 py-2 rounded-xl bg-[#16363B]/90 border border-[rgba(254,126,60,0.35)] shadow-[0_10px_25px_rgba(0,0,0,0.7),0_0_15px_rgba(254,126,60,0.2)] backdrop-blur-xl z-20"
      >
        <div className="w-6 h-6 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-mono font-bold text-[#F8F9FA]">Enclave Biometrics</p>
          <p className="text-[9px] text-[#10B981] font-mono">Zero Key Exposure</p>
        </div>
      </motion.div>

      {/* Floating Badge 2: Bottom-Right Ledger Verification Pill */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1, y: [0, 8, 0] }}
        transition={{
          y: { repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 },
          opacity: { duration: 0.6 },
        }}
        className="hidden sm:flex absolute -right-6 bottom-16 items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#16363B]/90 border border-[rgba(254,126,60,0.35)] shadow-[0_10px_25px_rgba(0,0,0,0.7),0_0_20px_rgba(254,126,60,0.2)] backdrop-blur-xl z-20"
      >
        <div className="w-7 h-7 rounded-lg bg-[#FE7E3C]/15 border border-[#FE7E3C]/40 flex items-center justify-center text-[#FE7E3C]">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FE7E3C] animate-pulse" />
            <p className="text-[10px] font-mono font-bold text-[#F8F9FA]">SHA-256 Chain Seal</p>
          </div>
          <p className="text-[9px] font-mono text-[#FE7E3C]">Sub-15ms Consensus</p>
        </div>
      </motion.div>
    </div>
  );
}

export default HeroPhoneMockup;
