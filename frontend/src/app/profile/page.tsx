'use client';

import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Smartphone,
  KeyRound,
  CheckCircle2,
  Copy,
  Lock,
  Layers,
  Sparkles,
  QrCode,
  BellRing,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { HashChip } from '@/components/ui/HashChip';
import { useToast } from '@/components/ui/Toast';

export default function ProfilePage() {
  const { success } = useToast();
  const [dailyLimit, setDailyLimit] = useState<number>(200000);
  const [roundUpEnabled, setRoundUpEnabled] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to Clipboard', `${label} copied successfully.`);
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[rgba(97,65,60,0.3)]">
          <div>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#FE7E3C]" />
              <h1 className="font-display font-black text-2xl text-[#F8F9FA] tracking-tight">
                My Profile &amp; Identity
              </h1>
            </div>
            <p className="text-xs text-[#C5BDB7] mt-1">
              Verified digital wallet credentials and cryptographic identity attestation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-mono text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>TIER-3 KYC VERIFIED</span>
            </span>
          </div>
        </div>

        {/* Primary Identity Card */}
        <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Avatar & Core Credentials */}
            <div className="md:col-span-8 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FE7E3C] via-[#0E6873] to-[#1A2C30] p-0.5 shrink-0 shadow-[0_0_20px_rgba(254,126,60,0.25)]">
                <div className="w-full h-full rounded-2xl bg-[#122023] flex items-center justify-center font-display font-black text-xl text-[#FE7E3C]">
                  AM
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-xl text-[#F8F9FA]">
                    Aarav Mehta
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    ACTIVE
                  </span>
                </div>
                <p className="font-mono text-xs text-[#C5BDB7] mt-0.5">
                  aarav.mehta@guardianpay.internal
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-[#C5BDB7]">
                  <span>Member since: March 2026</span>
                  <span>•</span>
                  <span>Account Node: #NODE-BOM-09</span>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="md:col-span-4 flex flex-col items-start md:items-end gap-2">
              <span className="text-[10px] font-mono text-[#C5BDB7] uppercase">
                Primary VPA Handle
              </span>
              <button
                onClick={() => copyToClipboard('aarav@aegis', 'VPA Handle')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] font-mono text-xs text-[#FE7E3C] hover:border-[#FE7E3C] transition-colors"
              >
                <span>aarav@aegis</span>
                <Copy className="w-3.5 h-3.5 text-[#C5BDB7]" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Two-Column Setup: Security Telemetry & Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hardware & Attestation */}
          <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(97,65,60,0.25)]">
              <Smartphone className="w-4 h-4 text-[#FE7E3C]" />
              <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                Device &amp; Enclave Attestation
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#122023]/70 border border-[rgba(97,65,60,0.25)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#F8F9FA]">MacBook Pro (Apple Silicon)</p>
                  <p className="text-[10px] text-[#C5BDB7]">Safari 18.3 • macOS 15.4</p>
                </div>
                <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
                  CURRENT
                </span>
              </div>

              <div className="flex items-center justify-between text-[#C5BDB7]">
                <span>Enclave Session ID:</span>
                <span className="text-[#C5BDB7]">0x99A4...D7CB</span>
              </div>
              <div className="flex items-center justify-between text-[#C5BDB7]">
                <span>Biometric Hardware Binding:</span>
                <span className="text-[#10B981]">SECURE ENCLAVE L3</span>
              </div>
              <div className="flex items-center justify-between text-[#C5BDB7]">
                <span>Zero-Knowledge Signer:</span>
                <span className="text-[#C5BDB7]">ED25519-SHA256</span>
              </div>
            </div>
          </GlassCard>

          {/* Cryptographic Ledger Identifiers */}
          <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(97,65,60,0.25)]">
              <Layers className="w-4 h-4 text-[#FE7E3C]" />
              <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                Cryptographic Credentials
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[#C5BDB7] block mb-1">Public Ledger Key:</span>
                <HashChip
                  hash="0x4b789102c892b1a9e88d7432f019482716492019"
                  startLength={10}
                  endLength={8}
                />
              </div>

              <div>
                <span className="text-[#C5BDB7] block mb-1">Genesis Block Anchor:</span>
                <HashChip
                  hash="0xaa18092348109283471092834710928347109283"
                  startLength={10}
                  endLength={8}
                />
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-[#C5BDB7]">
                <span>Ledger Consensus Sync:</span>
                <span className="text-[#10B981] font-bold">100% INTACT</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Preferences and Safeguards */}
        <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(97,65,60,0.25)]">
            <Lock className="w-4 h-4 text-[#FE7E3C]" />
            <h3 className="font-display font-bold text-base text-[#F8F9FA]">
              Security &amp; Transfer Preferences
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Limit */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[#C5BDB7] block">
                Daily Transfer Velocity Cap
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] font-mono text-sm text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C]"
                />
              </div>
              <p className="text-[10px] font-mono text-[#C5BDB7]">
                Transfers exceeding this limit invoke mandatory cooling holds.
              </p>
            </div>

            {/* Micro-Savings Round-Up Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[#C5BDB7] block">
                Micro-Savings Round-Up
              </label>
              <button
                onClick={() => setRoundUpEnabled(!roundUpEnabled)}
                className={`w-full px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center justify-between ${
                  roundUpEnabled
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                    : 'bg-[#122023] text-[#C5BDB7] border-[rgba(97,65,60,0.35)]'
                }`}
              >
                <span>Auto Round-Up</span>
                <span>{roundUpEnabled ? 'ACTIVE' : 'PAUSED'}</span>
              </button>
              <p className="text-[10px] font-mono text-[#C5BDB7]">
                Round settled transfers to nearest ₹50/₹100 into savings.
              </p>
            </div>

            {/* Instant Fraud Alerts */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase text-[#C5BDB7] block">
                Autonomous Threat Alerts
              </label>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-full px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center justify-between ${
                  notificationsEnabled
                    ? 'bg-[#FE7E3C]/15 text-[#FE7E3C] border-[#FE7E3C]/40'
                    : 'bg-[#122023] text-[#C5BDB7] border-[rgba(97,65,60,0.35)]'
                }`}
              >
                <span>Push &amp; In-App Alerts</span>
                <span>{notificationsEnabled ? 'ENABLED' : 'MUTED'}</span>
              </button>
              <p className="text-[10px] font-mono text-[#C5BDB7]">
                Instant real-time dispatch when risk score &gt; 30.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
