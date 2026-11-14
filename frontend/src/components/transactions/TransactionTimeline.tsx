'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Transaction, TransactionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TransactionTimelineProps {
  transaction: Transaction;
}

export function TransactionTimeline({ transaction }: TransactionTimelineProps) {
  const status = transaction.status;
  const isFailed = status === 'FAILED';
  const isReversed = status === 'REVERSED';
  const isSuccess = status === 'SUCCESS';

  const baseDate = new Date(transaction.timestamp);
  const addSeconds = (secs: number) => {
    const d = new Date(baseDate.getTime() + secs * 1000);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const steps = [
    {
      key: 'INITIATED',
      label: 'INITIATED',
      title: 'Transfer Staged',
      description: 'Payload validated, unique idempotency token signed.',
      time: addSeconds(0),
      isReached: true,
      isCurrent: status === 'INITIATED',
      statusType: 'success',
    },
    {
      key: 'RISK_CHECK',
      label: 'RISK_CHECK',
      title: 'Neural Risk Evaluation',
      description: `Scored ${transaction.riskAssessment.score}/100 • Policy: ${transaction.riskAssessment.decision}`,
      time: addSeconds(1),
      isReached: true,
      isCurrent: status === 'RISK_CHECK',
      statusType: transaction.riskAssessment.score > 70 ? 'warning' : 'success',
    },
    ...(isFailed
      ? [
          {
            key: 'FAILED',
            label: 'FAILED',
            title: 'Autonomous Perimeter Block',
            description: transaction.failureReason || 'High-risk vector intercepted. Wallet isolated.',
            time: addSeconds(2),
            isReached: true,
            isCurrent: true,
            statusType: 'danger',
          },
        ]
      : isReversed
      ? [
          {
            key: 'REVERSED',
            label: 'REVERSED',
            title: 'Quarantine Aborted',
            description: 'Held transfer cancelled during cooling period. Zero funds moved.',
            time: addSeconds(12),
            isReached: true,
            isCurrent: true,
            statusType: 'warning',
          },
        ]
      : [
          {
            key: 'AUTHORIZED',
            label: 'AUTHORIZED',
            title: 'Credential Verified',
            description: transaction.stepUpRequired
              ? 'Multi-factor SMS OTP & UPI PIN verified.'
              : 'Hardware biometric enclave token validated.',
            time: addSeconds(2),
            isReached: ['AUTHORIZED', 'DEBITED', 'CREDITED', 'SUCCESS'].includes(status),
            isCurrent: status === 'AUTHORIZED',
            statusType: 'success',
          },
          {
            key: 'DEBITED',
            label: 'DEBITED',
            title: 'Sender Balance Settled',
            description: `₹${transaction.amount.toLocaleString('en-IN')} reserved from liquidity pool.`,
            time: addSeconds(3),
            isReached: ['DEBITED', 'CREDITED', 'SUCCESS'].includes(status),
            isCurrent: status === 'DEBITED',
            statusType: 'success',
          },
          {
            key: 'CREDITED',
            label: 'CREDITED',
            title: 'Counterparty Routing',
            description: `Beneficiary node confirmed delivery to ${transaction.receiverVpa}.`,
            time: addSeconds(4),
            isReached: ['CREDITED', 'SUCCESS'].includes(status),
            isCurrent: status === 'CREDITED',
            statusType: 'success',
          },
          {
            key: 'SUCCESS',
            label: 'SUCCESS',
            title: 'SHA-256 Block Finalized',
            description: 'Cryptographic block minted and dual-entry ledger reconciled.',
            time: addSeconds(5),
            isReached: isSuccess,
            isCurrent: isSuccess,
            statusType: 'success',
          },
        ]),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[rgba(97,65,60,0.25)]">
        <span className="text-xs font-mono uppercase tracking-wider text-[#C5BDB7]">
          Lifecycle State Machine
        </span>
        <span className="text-[11px] font-mono text-[#FE7E3C] bg-[#FE7E3C]/10 px-2 py-0.5 rounded border border-[#FE7E3C]/20">
          UTR: {transaction.utr}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#FE7E3C] before:via-[#0E6873] before:to-transparent">
        {steps.map((step, idx) => {
          const isDanger = step.statusType === 'danger';
          const isWarning = step.statusType === 'warning';

          return (
            <div key={step.key} className="relative group">
              {/* Node Dot */}
              <div
                className={cn(
                  'absolute -left-[27px] top-1 w-4 h-4 rounded-full flex items-center justify-center transition-all',
                  step.isReached
                    ? isDanger
                      ? 'bg-[#E4201B] shadow-[0_0_10px_#E4201B]'
                      : isWarning
                      ? 'bg-[#FE7E3C] shadow-[0_0_10px_#FE7E3C]'
                      : 'bg-[#10B981] shadow-[0_0_10px_#10B981]'
                    : 'bg-[#122023] border border-[rgba(97,65,60,0.35)]'
                )}
              >
                {step.isReached && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A2C30]" />
                )}
              </div>

              {/* Content Card */}
              <div
                className={cn(
                  'p-3 rounded-xl border transition-all',
                  step.isReached
                    ? 'bg-[#0E6873]/20 border-[rgba(97,65,60,0.35)] shadow-sm'
                    : 'bg-[#122023]/20 border-white/5 opacity-40'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border',
                        isDanger
                          ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                          : isWarning
                          ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                          : step.isReached
                          ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                          : 'text-[#C5BDB7] bg-transparent border-transparent'
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="text-xs font-semibold text-[#F8F9FA]">{step.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#C5BDB7]">{step.time}</span>
                </div>
                <p className="text-[11px] text-[#C5BDB7] leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TransactionTimeline;
