'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Download,
  RotateCcw,
  Home,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatUtr, formatDate } from '@/lib/utils';
import { GlowButton } from '@/components/ui/GlowButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashChip } from '@/components/ui/HashChip';
import { useToast } from '@/components/ui/Toast';

interface PaymentResultStepProps {
  transaction: Transaction | null;
  errorMessage?: string | null;
  onReset: () => void;
}

export function PaymentResultStep({ transaction, errorMessage, onReset }: PaymentResultStepProps) {
  const { success } = useToast();

  // If no transaction is returned or an error occurred, render dedicated failure screen
  if (!transaction) {
    return (
      <div className="space-y-6 text-center animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-[#E4201B]/15 border-2 border-[#E4201B] shadow-[0_0_35px_rgba(228,32,27,0.35)] flex items-center justify-center mx-auto text-[#E4201B]">
          <AlertCircle className="w-11 h-11" />
        </div>

        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#E4201B] font-bold">
            [SETTLEMENT EXCEPTION • TRANSACTION REJECTED]
          </span>
          <h2 className="font-display text-3xl font-black text-[#F8F9FA] mt-1">
            Payment Not Cleared
          </h2>
          <p className="font-sans text-xs sm:text-sm text-[#C5BDB7] mt-1 max-w-md mx-auto">
            The transaction could not be settled on the ledger network.
          </p>
        </div>

        {/* Error Details Box */}
        <div className="p-5 rounded-2xl bg-[#122023]/90 border border-[#E4201B]/40 text-left space-y-3 font-mono text-xs max-w-lg mx-auto">
          <div className="flex items-center justify-between text-[#E4201B] font-bold border-b border-[#E4201B]/25 pb-2">
            <span>Rejection Reason:</span>
            <span>Ledger Error</span>
          </div>
          <p className="text-[#F8F9FA] text-sm break-words leading-relaxed">
            {errorMessage || 'Request rejected by perimeter verification. Please check your recipient VPA and amount.'}
          </p>
          <div className="text-[11px] text-[#C5BDB7] pt-1">
            <span>Zero paise were debited from your liquid capital.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <GlowButton
            variant="primary"
            size="md"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={onReset}
            className="w-full sm:w-auto"
          >
            Change Details &amp; Retry
          </GlowButton>

          <Link href="/dashboard" className="w-full sm:w-auto">
            <GlowButton variant="ghost" size="md" leftIcon={<Home className="w-4 h-4 text-[#FE7E3C]" />} className="w-full">
              Return to Dashboard
            </GlowButton>
          </Link>
        </div>
      </div>
    );
  }

  const isBlocked = transaction.status === 'BLOCKED' || transaction.riskAssessment?.decision === 'BLOCK';
  const isHeld = transaction.status === 'HELD' || transaction.riskAssessment?.decision === 'HOLD';
  const isPending = transaction.status === 'PENDING' || transaction.riskAssessment?.decision === 'STEP_UP';
  const isSuccess = !isBlocked && !isHeld && !isPending;

  const score = transaction.riskAssessment?.score ?? 0;
  const decision = transaction.riskAssessment?.decision ?? 'ALLOW';

  const lifecycleStages = [
    { label: 'Payload Signed', status: 'INITIATED' },
    { label: 'Risk Verified (<15ms)', status: 'VALIDATING' },
    { label: isBlocked ? 'Threat Intercepted' : isHeld ? 'Escrow Quarantined' : 'Telemetry Clear', status: 'CHALLENGED' },
    { label: isBlocked ? 'Ledger Protected' : isHeld ? 'Funds Held' : 'Ledger Debited', status: 'AUTHORIZED' },
    { label: isBlocked ? 'Debit Aborted' : isHeld ? 'Quarantine Stored' : 'VPA Credited', status: 'COMPLETED' },
    { label: 'SHA-256 Minted', status: 'CONFIRMED' },
  ];

  const handleDownloadReceipt = () => {
    const receiptContent = `
============================================================
              GUARDIANPAY CRYPTOGRAPHIC SETTLEMENT RECEIPT
============================================================
Transaction ID  : ${transaction.id}
UTR Reference   : ${transaction.utr}
Timestamp       : ${formatDate(transaction.timestamp)}
Status          : ${transaction.status}
Settlement Mode : REAL-TIME DUAL ENTRY SIMULATION

PAYMENT DETAILS
Sender VPA      : ${transaction.senderVpa || 'aarav@aegis'}
Recipient       : ${transaction.receiverName} (${transaction.receiverVpa})
Amount          : INR ${(transaction.amount || 0).toFixed(2)}
Category        : ${transaction.category || 'P2P_TRANSFER'}
Note            : ${transaction.note || 'None'}

SECURITY & AI AUDIT PROOF
Threat Score    : ${score} / 100
Risk Tier       : ${(transaction.riskAssessment?.riskLevel || transaction.riskAssessment?.level || 'LOW').toUpperCase()}
Decision        : ${decision}
Auth Mode       : ${transaction.authMethodUsed || 'UPI_PIN'}
Trigger Factors : ${(transaction.riskAssessment?.factors || []).map((f) => f.description).join('; ') || 'Zero anomaly detected'}

CRYPTOGRAPHIC INTEGRITY
Ledger Block    : #${transaction.blockNumber || 1042}
Block Hash      : ${transaction.blockHash || '0x4f89b...'}
Merkle Root     : 89f41b2e88a09b4317c80d56b0261f9b33e5c942
Proof Type      : SHA-256 Immutable Hash-Chain Settlement

Verification Portal: https://guardianpay.internal/verify/${transaction.id}
============================================================
`.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GUARDIANPAY-RECEIPT-${transaction.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    success('Receipt Downloaded', `Saved ${transaction.id}.txt to your files.`);
  };

  return (
    <div className="space-y-6 text-center animate-in fade-in">
      {/* Icon Badge depending on outcome */}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#10B981]/20 to-[#FE7E3C]/20 border-2 border-[#10B981] shadow-[0_0_35px_rgba(16,185,129,0.4)] flex items-center justify-center mx-auto"
        >
          <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none">
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              stroke="#10B981"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.path
              d="M14 24L21 31L34 17"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      )}

      {isHeld && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-3xl bg-[#FE7E3C]/20 border-2 border-[#FE7E3C] shadow-[0_0_35px_rgba(254,126,60,0.4)] flex items-center justify-center mx-auto text-[#FE7E3C]"
        >
          <Clock className="w-11 h-11" />
        </motion.div>
      )}

      {isBlocked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-3xl bg-[#E4201B]/20 border-2 border-[#E4201B] shadow-[0_0_35px_rgba(228,32,27,0.4)] flex items-center justify-center mx-auto text-[#E4201B]"
        >
          <ShieldAlert className="w-11 h-11" />
        </motion.div>
      )}

      {isPending && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-3xl bg-[#0E6873]/20 border-2 border-[#0E6873] shadow-[0_0_35px_rgba(14,104,115,0.4)] flex items-center justify-center mx-auto text-[#0E6873]"
        >
          <ShieldCheck className="w-11 h-11" />
        </motion.div>
      )}

      <div>
        <span
          className={`font-mono text-xs uppercase tracking-widest font-bold ${
            isSuccess
              ? 'text-[#10B981]'
              : isHeld
              ? 'text-[#FE7E3C]'
              : isBlocked
              ? 'text-[#E4201B]'
              : 'text-[#0E6873]'
          }`}
        >
          {isSuccess
            ? '[SETTLEMENT COMPLETED • ZERO DRIFT]'
            : isHeld
            ? '[HOLD POLICY • QUARANTINED IN ESCROW VAULT]'
            : isBlocked
            ? '[HARD BLOCK • CRITICAL ANOMALY DETECTED]'
            : '[STEP-UP CHALLENGE ISSUED]'}
        </span>
        <h2 className="font-display text-3xl font-black text-[#F8F9FA] mt-1">
          {isSuccess
            ? 'Payment Successful'
            : isHeld
            ? 'Payment Quarantined (Hold)'
            : isBlocked
            ? 'Payment Blocked'
            : 'Verification Pending'}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-[#C5BDB7] mt-1 max-w-lg mx-auto">
          {isSuccess ? (
            <>
              Transferred to <strong className="text-[#F8F9FA]">{transaction.receiverName}</strong> (
              <span className="font-mono text-[#FE7E3C]">{transaction.receiverVpa}</span>)
            </>
          ) : isHeld ? (
            'High-risk telemetry triggered automated quarantine. Funds are held in escrow pending compliance approval.'
          ) : isBlocked ? (
            'This payment was rejected by autonomous security defenses to prevent unauthorized loss. Zero funds debited.'
          ) : (
            'Second-factor verification challenge dispatched.'
          )}
        </p>
      </div>

      {/* Large Amount Readout */}
      <div className="py-2">
        <span
          className={`font-mono text-4xl sm:text-5xl font-black tracking-tight ${
            isBlocked ? 'text-[#E4201B] line-through opacity-70' : 'text-[#F8F9FA]'
          }`}
        >
          {formatCurrency(transaction.amount || 0)}
        </span>
      </div>

      {/* Transaction Details Glass Grid */}
      <div className="p-5 rounded-2xl bg-[#122023]/90 border border-[rgba(97,65,60,0.35)] text-left space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.25)]">
          <span className="text-[#C5BDB7]">Payment Status:</span>
          <StatusBadge status={transaction.status} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[#C5BDB7] block text-[10px] uppercase">Transaction ID:</span>
            <span className="text-[#F8F9FA] font-bold">{transaction.id}</span>
          </div>

          <div>
            <span className="text-[#C5BDB7] block text-[10px] uppercase">UTR Reference:</span>
            <span className="text-[#FE7E3C] font-bold">{formatUtr(transaction.utr)}</span>
          </div>

          <div>
            <span className="text-[#C5BDB7] block text-[10px] uppercase">Date &amp; Time:</span>
            <span className="text-[#C5BDB7]">{formatDate(transaction.timestamp)}</span>
          </div>

          <div>
            <span className="text-[#C5BDB7] block text-[10px] uppercase">AI Risk Rating:</span>
            <span
              className={`font-bold ${
                isSuccess
                  ? 'text-[#10B981]'
                  : isHeld
                  ? 'text-[#FE7E3C]'
                  : 'text-[#E4201B]'
              }`}
            >
              Score {score}/100 ({decision})
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[rgba(97,65,60,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-[#C5BDB7] text-[10px] uppercase">SHA-256 Block Hash:</span>
          <HashChip hash={transaction.blockHash || '0x000000'} startLength={6} endLength={6} />
        </div>
      </div>

      {/* State Machine Progression Timeline */}
      <div className="p-4 rounded-xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] text-left space-y-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#FE7E3C] font-bold block">
          Ledger State Machine Execution Trace:
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          {lifecycleStages.map((stage, idx) => (
            <motion.div
              key={stage.status}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-1.5 ${
                isBlocked
                  ? idx === 2
                    ? 'text-[#E4201B] font-bold'
                    : 'text-[#C5BDB7]'
                  : isHeld
                  ? idx === 2
                    ? 'text-[#FE7E3C] font-bold'
                    : 'text-[#10B981]'
                  : 'text-[#10B981]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{stage.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actions: Download Receipt, Back to Dashboard, Make Another Payment */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        {isSuccess && (
          <GlowButton
            variant="secondary"
            size="md"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownloadReceipt}
            className="w-full sm:w-auto"
          >
            Download Receipt
          </GlowButton>
        )}

        <GlowButton
          variant="primary"
          size="md"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          onClick={onReset}
          className="w-full sm:w-auto"
        >
          Make Another Payment
        </GlowButton>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <GlowButton variant="ghost" size="md" leftIcon={<Home className="w-4 h-4 text-[#FE7E3C]" />} className="w-full">
            Return Home
          </GlowButton>
        </Link>
      </div>
    </div>
  );
}

export default PaymentResultStep;
