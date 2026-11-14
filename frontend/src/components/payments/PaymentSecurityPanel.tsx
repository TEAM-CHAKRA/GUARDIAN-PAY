'use client';

import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/lib/utils';
import { Wallet } from '@/lib/types';

export interface PaymentSecurityPanelProps {
  wallet: Wallet | null;
  idempotencyKey: string;
  onSelectPresetScenario?: (scenario: {
    vpa: string;
    amount: number;
    score: number;
    label: string;
  }) => void;
  className?: string;
}

export function PaymentSecurityPanel({
  wallet,
  idempotencyKey,
  onSelectPresetScenario,
  className,
}: PaymentSecurityPanelProps) {
  const scenarios = [
    {
      vpa: 'diya@aegis',
      amount: 1450,
      score: 18,
      label: 'Test 18 (ALLOW)',
      badgeColor: 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10',
      desc: 'Trusted beneficiary • Instant clear',
    },
    {
      vpa: 'ananya@aegis',
      amount: 32000,
      score: 47,
      label: 'Test 47 (STEP_UP)',
      badgeColor: 'text-[#FE7E3C] border-[#FE7E3C]/30 bg-[#FE7E3C]/10',
      desc: 'Above threshold • Requires OTP challenge',
    },
    {
      vpa: 'dubious77@aegis',
      amount: 75000,
      score: 72,
      label: 'Test 72 (HOLD)',
      badgeColor: 'text-[#D9531E] border-[#D9531E]/30 bg-[#D9531E]/10',
      desc: 'Flagged merchant • 10-min cooling hold',
    },
    {
      vpa: 'bridge99x@aegis',
      amount: 120000,
      score: 94,
      label: 'Test 94 (BLOCK)',
      badgeColor: 'text-[#E4201B] border-[#E4201B]/30 bg-[#E4201B]/10',
      desc: 'Darknet off-ramp • Autonomous freeze',
    },
  ];

  return (
    <div className={className}>
      <GlassCard variant="default" padding="lg" className="space-y-6">
        {/* Security Perimeter Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[#F8F9FA]">
                Active Defense Perimeter
              </h4>
              <p className="font-mono text-[10px] text-[#10B981] uppercase font-bold">
                ENCLAVE TOKEN #0x9F4A ACTIVE
              </p>
            </div>
          </div>
          <p className="font-sans text-xs text-[#C5BDB7] leading-relaxed">
            Every transaction is pre-scored across 180+ neural telemetry vectors before dual-entry
            settlement is committed.
          </p>
        </div>

        {/* Persistent Protection Checks Panel */}
        <div className="p-3.5 rounded-xl bg-[#122023]/90 border border-[rgba(97,65,60,0.35)] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-[rgba(97,65,60,0.25)]">
            <span className="text-[#FE7E3C] font-bold uppercase tracking-wider text-[10px]">
              Protection Checks
            </span>
            <span className="text-[#10B981] font-bold text-[10px]">4/4 READY</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#C5BDB7]">Device Hardware Attestation</span>
              <span className="flex items-center gap-1 text-[#10B981]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enclave L3</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#C5BDB7]">Velocity &amp; Daily Cap</span>
              <span className="flex items-center gap-1 text-[#10B981]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#C5BDB7]">Beneficiary Reputation Scan</span>
              <span className="flex items-center gap-1 text-[#10B981]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Blocklist</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#C5BDB7]">SHA-256 Dual-Entry Sync</span>
              <span className="flex items-center gap-1 text-[#10B981]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Anchored</span>
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry & Enclave State */}
        <div className="p-3.5 rounded-xl bg-[#122023]/80 border border-[rgba(97,65,60,0.35)] space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Available Capital:</span>
            <span className="text-[#F8F9FA] font-bold">
              {formatCurrency(wallet?.balance || 84250.0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Spent Today:</span>
            <span className="text-[#FE7E3C]">
              {formatCurrency(wallet?.spentToday || 12500)} / {formatCurrency(wallet?.dailyLimit || 200000)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Neural Engine:</span>
            <span className="text-[#10B981] flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              ONLINE (&lt;15ms)
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[rgba(97,65,60,0.25)]">
            <span className="text-[#C5BDB7]">Idempotency Key:</span>
            <span className="text-[#C5BDB7] text-[10px] truncate max-w-[120px]">
              {idempotencyKey.slice(0, 12)}...
            </span>
          </div>
        </div>

        {/* Deterministic Hackathon Test Scenario Selector */}
        {onSelectPresetScenario && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#FE7E3C] font-bold">
                Deterministic Test Presets
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#FE7E3C]" />
            </div>
            <p className="font-sans text-[11px] text-[#C5BDB7] mb-3">
              One-click testing for all four autonomous risk score tiers:
            </p>

            <div className="space-y-2">
              {scenarios.map((sc) => (
                <button
                  key={sc.label}
                  type="button"
                  onClick={() => onSelectPresetScenario(sc)}
                  className="w-full p-2.5 rounded-xl bg-[#122023] hover:bg-[#0E6873]/25 border border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C]/60 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-xs font-bold text-[#F8F9FA] group-hover:text-[#FE7E3C]">
                      {sc.label}
                    </span>
                    <span className={`px-2 py-0.2 rounded font-mono text-[9px] font-bold border ${sc.badgeColor}`}>
                      {sc.score}/100
                    </span>
                  </div>
                  <p className="font-sans text-[10px] text-[#C5BDB7] leading-tight">
                    {sc.desc} ({sc.vpa} • {formatCurrency(sc.amount)})
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default PaymentSecurityPanel;
