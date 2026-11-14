'use client';

import React, { useState } from 'react';
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
  Fingerprint,
  Smartphone,
  Globe,
  Clock,
  Layers,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '@/lib/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashChip } from '@/components/ui/HashChip';
import { GlowButton } from '@/components/ui/GlowButton';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface InvestigationDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
  onTransactionUpdated: (updatedTx: Transaction) => void;
}

export function InvestigationDrawer({
  transaction,
  onClose,
  onTransactionUpdated,
}: InvestigationDrawerProps) {
  const { success, warning, error: toastError } = useToast();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionType, setConfirmActionType] = useState<'APPROVE' | 'BLOCK' | 'FREEZE'>('APPROVE');
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!transaction) return null;

  const score = transaction.riskAssessment.score;

  const handleAction = async () => {
    setIsActionLoading(true);
    try {
      if (confirmActionType === 'APPROVE') {
        const res = await api.approveFlaggedTransaction(transaction.id);
        success(`Transaction ${transaction.id} manually approved and released.`);
        onTransactionUpdated(res.transaction);
      } else if (confirmActionType === 'BLOCK') {
        const res = await api.blockFlaggedTransaction(transaction.id);
        warning(`Transaction ${transaction.id} quarantined under manual SecOps block.`);
        onTransactionUpdated(res.transaction);
      } else if (confirmActionType === 'FREEZE') {
        await api.freezeUserWallet(transaction.senderId, true);
        warning(`Wallet for ${transaction.senderName} (${transaction.senderVpa}) locked.`);
      }
      setIsConfirmModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'SecOps enforcement action failed.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        />

        {/* Slide-over panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl h-full bg-[#1A2C30] border-l border-[rgba(97,65,60,0.35)] shadow-[0_0_60px_rgba(0,0,0,0.9)] z-10 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgba(97,65,60,0.25)] bg-[#122023]/80 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#E4201B] animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest text-[#E4201B] uppercase font-bold">
                  SECOPS INCIDENT DOSSIER
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

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Amount & Counterparties Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0E6873]/30 to-[#122023]/80 border border-[rgba(97,65,60,0.35)] shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#C5BDB7]">Intercepted Transfer Value</span>
                <span className="text-[10px] font-mono text-[#FE7E3C] bg-[#FE7E3C]/10 px-2 py-0.5 rounded border border-[#FE7E3C]/20">
                  UTR: {transaction.utr}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-mono font-black text-[#F8F9FA] tracking-tight">
                  ₹{transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-mono text-[#FE7E3C]">INR</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[rgba(97,65,60,0.25)] text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#C5BDB7] block">SENDER (SUBJECT)</span>
                  <p className="font-semibold text-[#F8F9FA]">{transaction.senderName}</p>
                  <p className="font-mono text-[11px] text-[#C5BDB7]">{transaction.senderVpa}</p>
                  <span className="text-[10px] font-mono text-[#C5BDB7]">ID: {transaction.senderId}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#C5BDB7] block">RECIPIENT (TARGET)</span>
                  <p className="font-semibold text-[#F8F9FA]">{transaction.receiverName}</p>
                  <p className="font-mono text-[11px] text-[#FE7E3C]">{transaction.receiverVpa}</p>
                  <span className="text-[10px] font-mono text-[#C5BDB7]">ID: {transaction.receiverId}</span>
                </div>
              </div>
            </div>

            {/* Neural Threat Telemetry */}
            <div className="p-5 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-[#E4201B]" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#F8F9FA]">
                    Neural Threat Assessment
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
                          : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                      }`}
                    >
                      {transaction.riskAssessment.level}
                    </span>
                  </div>
                  <p className="text-xs text-[#C5BDB7]">
                    Current Autonomous Policy:{' '}
                    <strong className="text-[#FE7E3C]">{transaction.riskAssessment.decision}</strong>
                  </p>
                </div>
              </div>

              {/* Factors & Anomalies */}
              <div className="pt-2 border-t border-[rgba(97,65,60,0.25)] space-y-2">
                <span className="text-[10px] font-mono text-[#C5BDB7] block">
                  INTERCEPTED ANOMALY VECTORS
                </span>
                {transaction.riskAssessment.reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#122023] border border-white/5 flex items-start gap-2 text-xs text-[#F8F9FA]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FE7E3C] mt-0.5 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Device & Hardware Enclave Intelligence */}
            <div className="p-5 rounded-2xl bg-[#122023]/60 border border-[rgba(97,65,60,0.35)] space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#FE7E3C]" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#F8F9FA]">
                  Originating Terminal Telemetry
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#122023] border border-white/5">
                  <span className="text-[10px] text-[#C5BDB7] block">Terminal Type</span>
                  <span className="text-[#F8F9FA]">
                    {score > 80 ? 'Rooted / Emulated Terminal' : 'Titanium Phone 16 Pro'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#122023] border border-white/5">
                  <span className="text-[10px] text-[#C5BDB7] block">Enclave Hardware Attestation</span>
                  <span className={score > 80 ? 'text-[#E4201B]' : 'text-[#10B981]'}>
                    {score > 80 ? 'INVALID / ABSENT' : 'PASSKEY VERIFIED'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#122023] border border-white/5">
                  <span className="text-[10px] text-[#C5BDB7] block">IP Routing</span>
                  <span className="text-[#F8F9FA]">192.168.1.104 (Mumbai IN)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#122023] border border-white/5">
                  <span className="text-[10px] text-[#C5BDB7] block">Velocity Envelope</span>
                  <span className={score > 60 ? 'text-[#FE7E3C]' : 'text-[#10B981]'}>
                    {score > 60 ? 'Exceeds Hourly Mean' : 'Within Bounds'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic Hash Verification */}
            <div className="p-5 rounded-2xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#C5BDB7]">Block SHA-256 Hash:</span>
                <HashChip hash={transaction.blockHash} startLength={8} endLength={6} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#C5BDB7]">Previous Block Hash:</span>
                <HashChip hash={transaction.previousBlockHash} startLength={8} endLength={6} />
              </div>
            </div>
          </div>

          {/* Footer SecOps Command Actions */}
          <div className="p-5 border-t border-[rgba(97,65,60,0.25)] bg-[#122023]/90 backdrop-blur-md flex flex-wrap items-center gap-2.5">
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setConfirmActionType('APPROVE');
                setIsConfirmModalOpen(true);
              }}
              className="flex-1 text-xs"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#10B981]" />}
            >
              Override &amp; Clear
            </GlowButton>

            <GlowButton
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirmActionType('BLOCK');
                setIsConfirmModalOpen(true);
              }}
              className="flex-1 text-xs"
              leftIcon={<ShieldAlert className="w-3.5 h-3.5 mr-1.5" />}
            >
              Enforce Block
            </GlowButton>

            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setConfirmActionType('FREEZE');
                setIsConfirmModalOpen(true);
              }}
              className="flex-1 text-xs text-[#E4201B] border-[#E4201B]/30 hover:border-[#E4201B]"
              leftIcon={<Lock className="w-3.5 h-3.5 mr-1.5 text-[#E4201B]" />}
            >
              Freeze Sender
            </GlowButton>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={
          confirmActionType === 'APPROVE'
            ? 'Confirm Manual Approval'
            : confirmActionType === 'BLOCK'
            ? 'Confirm Incident Block'
            : 'Confirm Sender Wallet Quarantine'
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-[#C5BDB7] leading-relaxed">
            {confirmActionType === 'APPROVE'
              ? 'Are you sure you want to clear this transaction? Funds will be settled and committed to the consensus ledger.'
              : confirmActionType === 'BLOCK'
              ? 'Are you sure you want to quarantine this transaction? The payment will be aborted with a SecOps manual enforcement stamp.'
              : `Enforcing a freeze will immediately halt all outbound debit capabilities for user ${transaction.senderName}.`}
          </p>

          <div className="p-3 rounded-xl bg-[#122023] border border-white/10 text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-[#C5BDB7]">Target Tx:</span>
              <span className="text-[#F8F9FA]">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#C5BDB7]">Amount:</span>
              <span className="text-[#FE7E3C]">₹{transaction.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </GlowButton>
            <GlowButton
              variant={confirmActionType === 'APPROVE' ? 'secondary' : 'danger'}
              size="sm"
              isLoading={isActionLoading}
              onClick={handleAction}
            >
              Confirm Action
            </GlowButton>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  );
}

export default InvestigationDrawer;
