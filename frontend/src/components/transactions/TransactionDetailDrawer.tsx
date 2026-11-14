'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Download,
  ExternalLink,
  Layers,
  Fingerprint,
  FileCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashChip } from '@/components/ui/HashChip';
import { GlowButton } from '@/components/ui/GlowButton';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { TransactionTimeline } from './TransactionTimeline';
import { useToast } from '@/components/ui/Toast';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailDrawer({
  transaction,
  onClose,
}: TransactionDetailDrawerProps) {
  const { success } = useToast();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!transaction) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadReceipt = () => {
    const receiptData = `
========================================
       GUARDIANPAY TRANSACTION RECEIPT
========================================
Transaction ID  : ${transaction.id}
UTR Reference   : ${transaction.utr}
Timestamp       : ${transaction.timestamp}
Sender          : ${transaction.senderName} (${transaction.senderVpa})
Recipient       : ${transaction.receiverName} (${transaction.receiverVpa})
Amount          : INR ${transaction.amount.toFixed(2)}
Status          : ${transaction.status}
Note            : ${transaction.note || 'None'}

--- AI RISK ASSESSMENT ---
Risk Score      : ${transaction.riskAssessment.score}/100 (${transaction.riskAssessment.level})
Decision        : ${transaction.riskAssessment.decision}
Model Confidence: ${(transaction.riskAssessment.modelConfidence * 100).toFixed(1)}%

--- CRYPTOGRAPHIC PROOF ---
Block Hash      : ${transaction.blockHash}
Previous Hash   : ${transaction.previousBlockHash}
Consensus Engine: SHA-256 Dual-Entry Immutable Chain
========================================
Verified by GUARDIANPAY Autonomous Engine
    `.trim();

    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transaction.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    success('Receipt downloaded successfully.');
  };

  const isOutgoing = transaction.senderVpa === 'aarav@aegis';
  const score = transaction.riskAssessment.score;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl h-full bg-[#1A2C30] border-l border-[rgba(97,65,60,0.35)] shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgba(97,65,60,0.25)] bg-[#122023]/80 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono tracking-widest text-[#FE7E3C] uppercase">
                  TRANSACTION INTELLIGENCE
                </span>
                <StatusBadge status={transaction.status} size="sm" />
              </div>
              <h2 className="text-base font-display font-bold text-[#F8F9FA] tracking-wide">
                {transaction.id}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#C5BDB7] hover:text-[#F8F9FA] hover:bg-[#0E6873]/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Amount Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0E6873]/30 to-[#122023]/80 border border-[rgba(97,65,60,0.35)] shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#FE7E3C]/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#C5BDB7]">Transfer Value</span>
                <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                  <FileCheck className="w-3 h-3" />
                  Dual-Entry Balanced
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-mono font-black text-[#F8F9FA] tracking-tight">
                  ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-mono text-[#FE7E3C]">INR</span>
              </div>

              {/* Counterparties */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(97,65,60,0.25)] text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#C5BDB7] block">SENDER</span>
                  <p className="font-semibold text-[#F8F9FA] truncate">{transaction.senderName}</p>
                  <p className="font-mono text-[11px] text-[#C5BDB7] truncate">{transaction.senderVpa}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#C5BDB7] block">RECIPIENT</span>
                  <p className="font-semibold text-[#F8F9FA] truncate">{transaction.receiverName}</p>
                  <p className="font-mono text-[11px] text-[#FE7E3C] truncate">{transaction.receiverVpa}</p>
                </div>
              </div>
            </div>

            {/* AI Risk Score Assessment */}
            <div className="p-5 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-[#FE7E3C]" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#F8F9FA]">
                    Neural Risk Assessment
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#C5BDB7]">
                  Confidence: {(transaction.riskAssessment.modelConfidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-5">
                <div className="shrink-0">
                  <RiskGauge score={score} size="sm" showLabel={false} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-black text-[#F8F9FA]">
                      {score}
                      <span className="text-xs text-[#C5BDB7] font-normal">/100</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        score > 80
                          ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                          : score > 60
                          ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                          : score > 30
                          ? 'text-[#0E6873] bg-[#0E6873]/20 border-[#0E6873]/40'
                          : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                      }`}
                    >
                      {transaction.riskAssessment.level}
                    </span>
                  </div>
                  <p className="text-xs text-[#C5BDB7]">
                    Autonomous Policy Decision:{' '}
                    <strong className="text-[#FE7E3C]">{transaction.riskAssessment.decision}</strong>
                  </p>
                </div>
              </div>

              {/* Factors */}
              {transaction.riskAssessment.reasons.length > 0 && (
                <div className="pt-2 border-t border-[rgba(97,65,60,0.25)] space-y-1.5">
                  <span className="text-[10px] font-mono text-[#C5BDB7] block">CONTRIBUTORY VECTORS</span>
                  {transaction.riskAssessment.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#C5BDB7]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FE7E3C] mt-1.5 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lifecycle Timeline */}
            <div className="p-5 rounded-2xl bg-[#122023]/60 border border-[rgba(97,65,60,0.35)]">
              <TransactionTimeline transaction={transaction} />
            </div>

            {/* Ledger Proofs */}
            <div className="p-5 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FE7E3C]" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#F8F9FA]">
                    Cryptographic Ledger Anchor
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#10B981] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  CONSENSUS 100%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#C5BDB7] block mb-1">
                    CURRENT BLOCK SHA-256 HASH
                  </span>
                  <HashChip hash={transaction.blockHash} startLength={10} endLength={6} />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#C5BDB7] block mb-1">
                    PREVIOUS BLOCK HASH
                  </span>
                  <HashChip hash={transaction.previousBlockHash} startLength={10} endLength={6} />
                </div>
              </div>
            </div>

            {/* Technical Metadata Table */}
            <div className="p-4 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.25)] space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#C5BDB7]">UTR Reference</span>
                <span className="text-[#F8F9FA]">{transaction.utr}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#C5BDB7]">Timestamp</span>
                <span className="text-[#F8F9FA]">{new Date(transaction.timestamp).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#C5BDB7]">Note / Reference</span>
                <span className="text-[#F8F9FA]">{transaction.note || 'P2P Transfer'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#C5BDB7]">Idempotency Hash</span>
                <span className="text-[#FE7E3C] truncate max-w-[200px]">
                  {(transaction as any).idempotencyKey || `IDEM-${transaction.id.slice(4)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-[rgba(97,65,60,0.25)] bg-[#122023]/90 backdrop-blur-md flex items-center gap-3">
            <GlowButton
              variant="secondary"
              size="md"
              onClick={handleDownloadReceipt}
              leftIcon={<Download className="w-4 h-4 mr-2" />}
              className="flex-1"
            >
              Download Receipt
            </GlowButton>
            <GlowButton
              variant="primary"
              size="md"
              onClick={() => copyToClipboard(transaction.blockHash, 'Block Hash')}
              leftIcon={<Copy className="w-4 h-4 mr-2" />}
              className="flex-1"
            >
              Copy Hash
            </GlowButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default TransactionDetailDrawer;
