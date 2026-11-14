'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { GlowButton } from '@/components/ui/GlowButton';
import { useLanguage } from '@/lib/LanguageContext';

export interface WalletProtectionWidgetProps {
  isFrozen?: boolean;
  score?: number;
  onOpenSecurity?: () => void;
  onToggleFreeze?: () => void;
}

export function WalletProtectionWidget({
  isFrozen = false,
  score = 8,
  onOpenSecurity,
  onToggleFreeze,
}: WalletProtectionWidgetProps) {
  const { t } = useLanguage();

  return (
    <GlassCard variant="default" padding="lg" className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isFrozen ? 'bg-[#E4201B]/15 text-[#E4201B]' : 'bg-[#10B981]/15 text-[#10B981]'
              }`}
            >
              {isFrozen ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                {t('walletProtection')}
              </h3>
              <span
                className={`font-mono text-xs font-bold uppercase tracking-wider ${
                  isFrozen ? 'text-[#E4201B]' : 'text-[#10B981]'
                }`}
              >
                {isFrozen ? 'WALLET ISOLATED / FROZEN' : 'ACTIVE DEFENSE SHIELD'}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Gauge & Telemetry Summary */}
        <div className="flex items-center gap-4 py-2">
          <RiskGauge score={isFrozen ? 94 : score} size="sm" showLabel={false} />
          <div className="space-y-1.5">
            <div>
              <span className="font-mono text-[10px] text-[#C5BDB7] uppercase block">
                {t('currentRiskPosture')}
              </span>
              <span
                className={`font-mono text-sm font-bold ${
                  isFrozen ? 'text-[#E4201B]' : 'text-[#10B981]'
                }`}
              >
                {isFrozen ? 'CRITICAL (94/100)' : t('lowRisk')}
              </span>
            </div>
            <p className="font-mono text-[10px] text-[#C5BDB7]">
              {t('twoMinAgo')} • Sub-15ms Neural Node #3
            </p>
          </div>
        </div>

        {/* Security checks bullet list */}
        <div className="space-y-2 mt-4 pt-4 border-t border-[rgba(97,65,60,0.35)] text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Hardware Enclave:</span>
            <span className="text-[#10B981] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ATTESTED
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Zero-Knowledge Proof:</span>
            <span className="text-[#10B981] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              VALIDATED
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Active Threat Anomalies:</span>
            <span className={isFrozen ? 'text-[#E4201B] font-bold' : 'text-[#FE7E3C]'}>
              {isFrozen ? '1 Intercepted Breach' : t('zeroThreats')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[rgba(97,65,60,0.35)] flex items-center gap-3">
        {onOpenSecurity && (
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={onOpenSecurity}
            className="flex-1"
          >
            {t('inspectAudit')}
          </GlowButton>
        )}
        {onToggleFreeze && (
          <GlowButton
            variant={isFrozen ? 'primary' : 'danger'}
            size="sm"
            onClick={onToggleFreeze}
            className="flex-1"
          >
            {isFrozen ? t('unfreezeWallet') : t('freezeWallet')}
          </GlowButton>
        )}
      </div>
    </GlassCard>
  );
}

export default WalletProtectionWidget;
