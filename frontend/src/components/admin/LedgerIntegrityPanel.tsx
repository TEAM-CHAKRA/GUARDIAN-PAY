'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash,
  Link as LinkIcon,
  Unlink,
  Check,
  Flame,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { HashChip } from '@/components/ui/HashChip';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

interface BlockNode {
  id: string;
  utr: string;
  amount: number;
  blockHash: string;
  previousBlockHash: string;
  isValid: boolean;
  isTampered: boolean;
}

interface LedgerIntegrityPanelProps {
  initialStatus?: 'VERIFIED' | 'TAMPERED';
  onLedgerUpdated?: (status: 'VERIFIED' | 'TAMPERED') => void;
}

export function LedgerIntegrityPanel({
  initialStatus = 'VERIFIED',
  onLedgerUpdated,
}: LedgerIntegrityPanelProps) {
  const { success, warning, error: toastError } = useToast();

  const [isVerifying, setIsVerifying] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ledgerStatus, setLedgerStatus] = useState<'VERIFIED' | 'TAMPERED'>(initialStatus);
  const [verifiedCount, setVerifiedCount] = useState(40);
  const [failedCount, setFailedCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState('Just now');
  const [brokenBlockId, setBrokenBlockId] = useState<string | null>(null);

  // Dynamic Blocks
  const [blocks, setBlocks] = useState<BlockNode[]>([
    {
      id: 'TXN-20260312-4091',
      utr: '607198421098',
      amount: 1450.0,
      blockHash: '0x9fa481e3d7cb0912ae4c9201bd74f1947261901a88b',
      previousBlockHash: '0x3dc11a084ef920b1784ca1209384719283741829',
      isValid: true,
      isTampered: false,
    },
    {
      id: 'TXN-20260312-3982',
      utr: '607198421097',
      amount: 12000.0,
      blockHash: '0x3dc11a084ef920b1784ca1209384719283741829',
      previousBlockHash: '0x712a4b9c81029384719028347109283471902834',
      isValid: true,
      isTampered: false,
    },
    {
      id: 'TXN-20260312-3814',
      utr: '607198421096',
      amount: 8500.0,
      blockHash: '0x712a4b9c81029384719028347109283471902834',
      previousBlockHash: '0xbb4190c421098234710928347109283471902834',
      isValid: true,
      isTampered: false,
    },
    {
      id: 'TXN-20260312-3720',
      utr: '607198421095',
      amount: 3200.0,
      blockHash: '0xbb4190c421098234710928347109283471902834',
      previousBlockHash: '0xaa180923481092834710928347109283471902834',
      isValid: true,
      isTampered: false,
    },
  ]);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    setScanProgress(0);

    // Scan progress animation across blocks
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 150);

    try {
      const res = await api.verifyLedger();
      clearInterval(interval);
      setScanProgress(100);

      const normalizedStatus: 'VERIFIED' | 'TAMPERED' =
        res.chainIntegrity === '100% VERIFIED' ? 'VERIFIED' : 'TAMPERED';

      setLedgerStatus(normalizedStatus);
      setVerifiedCount(res.verified ? res.blockCount : res.blockCount - 1);
      setFailedCount(res.verified ? 0 : 1);
      setBrokenBlockId(res.brokenBlockId || null);
      setLastCheckTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (res.blocks && res.blocks.length > 0) {
        setBlocks(res.blocks.slice(0, 4));
      }

      if (res.verified) {
        success('Consensus Verified', 'All SHA-256 Merkle chain blocks valid. Zero collisions.');
      } else {
        warning('Integrity Violation Detected', `Hash mismatch at block ${res.brokenBlockId || 'TXN-20260312-3814'}`);
      }

      onLedgerUpdated?.(normalizedStatus);
    } catch {
      toastError('Consensus node timed out during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperBlock = async () => {
    try {
      const res = await api.tamperLedgerBlock();
      setLedgerStatus('TAMPERED');
      setBrokenBlockId(res.tamperedBlockId);
      setFailedCount(1);
      setVerifiedCount((prev) => Math.max(0, prev - 1));

      // Update local view
      setBlocks((prev) =>
        prev.map((b, i) =>
          i === 2 || b.id === res.tamperedBlockId
            ? { ...b, blockHash: '0xDEADBEEF00000000000000000000000000000000', isValid: false, isTampered: true }
            : b
        )
      );

      warning('Demo Tamper Injected', res.message);
      onLedgerUpdated?.('TAMPERED');
    } catch {
      toastError('Tamper harness error.');
    }
  };

  const handleRestoreChain = async () => {
    try {
      const res = await api.restoreLedgerChain();
      setLedgerStatus('VERIFIED');
      setBrokenBlockId(null);
      setFailedCount(0);
      setVerifiedCount(40);

      // Re-fetch clean blocks
      const clean = await api.verifyLedger();
      if (clean.blocks) {
        setBlocks(clean.blocks.slice(0, 4));
      }

      success('Ledger Re-Anchored', res.message);
      onLedgerUpdated?.('VERIFIED');
    } catch {
      toastError('Failed to reconcile ledger.');
    }
  };

  const isTampered = ledgerStatus === 'TAMPERED';

  return (
    <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(97,65,60,0.3)]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#FE7E3C]" />
            <h3 className="font-display font-black text-lg text-[#F8F9FA] tracking-wide">
              Cryptographic Ledger Verification
            </h3>
          </div>
          <p className="text-xs text-[#C5BDB7] mt-0.5">
            Immutable SHA-256 dual-entry blockchain ledger. Verified independently across all validator nodes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isTampered ? (
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={handleRestoreChain}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1 text-[#10B981]" />}
            >
              Re-Mine & Restore Chain
            </GlowButton>
          ) : (
            <button
              onClick={handleTamperBlock}
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-[#E4201B] bg-[#E4201B]/10 border border-[#E4201B]/30 hover:bg-[#E4201B]/20 transition-colors flex items-center gap-1.5"
              title="Inject demo hash mismatch to demonstrate tamper detection"
            >
              <Flame className="w-3.5 h-3.5" />
              Simulate Block Tamper
            </button>
          )}

          <GlowButton
            variant="primary"
            size="sm"
            isLoading={isVerifying}
            onClick={handleVerifyLedger}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isVerifying ? 'animate-spin' : ''}`} />}
          >
            {isVerifying ? `Scanning (${scanProgress}%)...` : 'Verify Ledger'}
          </GlowButton>
        </div>
      </div>

      {/* Verification Status Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#122023]/70 border border-[rgba(97,65,60,0.3)] text-xs font-mono">
        <div>
          <span className="text-[#C5BDB7] block text-[10px] uppercase">Consensus Status:</span>
          <span
            className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
              isTampered ? 'text-[#E4201B]' : 'text-[#10B981]'
            }`}
          >
            {isTampered ? (
              <>
                <XCircle className="w-4 h-4 text-[#E4201B]" />
                TAMPERED
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                100% VERIFIED
              </>
            )}
          </span>
        </div>

        <div>
          <span className="text-[#C5BDB7] block text-[10px] uppercase">Verified Blocks:</span>
          <span className="text-sm font-bold text-[#F8F9FA] mt-0.5 block">
            {verifiedCount} Blocks
          </span>
        </div>

        <div>
          <span className="text-[#C5BDB7] block text-[10px] uppercase">Broken Blocks:</span>
          <span
            className={`text-sm font-bold mt-0.5 block ${
              failedCount > 0 ? 'text-[#E4201B]' : 'text-[#10B981]'
            }`}
          >
            {failedCount} Discrepancies
          </span>
        </div>

        <div>
          <span className="text-[#C5BDB7] block text-[10px] uppercase">Last Evaluated:</span>
          <span className="text-sm font-bold text-[#FE7E3C] mt-0.5 block">
            {lastCheckTime}
          </span>
        </div>
      </div>

      {/* Progress Scan Bar (during verify) */}
      {isVerifying && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-[#FE7E3C]">
            <span>Running Merkle Root Verification & SHA-256 Signature Audit...</span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full bg-[#122023] h-1.5 rounded-full overflow-hidden border border-[#FE7E3C]/20">
            <div
              className="bg-gradient-to-r from-[#FE7E3C] to-[#E4201B] h-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Broken Block Alert Banner */}
      {isTampered && (
        <div className="p-3.5 rounded-xl bg-[#E4201B]/10 border border-[#E4201B]/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E4201B] shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="text-[#E4201B] font-mono font-bold block">
              CRYPTOGRAPHIC CHAIN INTEGRITY FAILURE
            </strong>
            <p className="text-[#C5BDB7] mt-0.5 leading-relaxed">
              Block signature <span className="font-mono text-[#F8F9FA]">{brokenBlockId || 'TXN-20260312-3814'}</span> does not match independent Merkle leaf hash. Consensus invalidation staged. Click &quot;Re-Mine &amp; Restore Chain&quot; to rectify.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Hash-Chain Visualization */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#C5BDB7] block">
          LIVE BLOCK CHAIN HEAD (LATEST 4 BLOCKS)
        </span>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {blocks.map((block, idx) => {
            const isInvalid = !block.isValid || block.isTampered;

            return (
              <div
                key={block.id}
                className={`p-3.5 rounded-xl border transition-all relative ${
                  isInvalid
                    ? 'bg-[#E4201B]/15 border-[#E4201B]/60 shadow-[0_0_20px_rgba(228,32,27,0.3)]'
                    : 'bg-[#122023]/60 border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C]/40'
                }`}
              >
                {/* Node Connector Link (between cards on desktop) */}
                {idx < blocks.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#1A2C30] border border-[rgba(97,65,60,0.35)] items-center justify-center">
                    {isInvalid ? (
                      <Unlink className="w-3 h-3 text-[#E4201B]" />
                    ) : (
                      <LinkIcon className="w-3 h-3 text-[#10B981]" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#FE7E3C] font-bold">
                    Block #{blocks.length - idx}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isInvalid
                        ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                        : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                    }`}
                  >
                    {isInvalid ? 'CORRUPT' : 'VALID'}
                  </span>
                </div>

                <p className="font-mono text-xs font-bold text-[#F8F9FA] truncate">
                  {block.id}
                </p>
                <p className="font-mono text-[11px] text-[#C5BDB7] mb-2">
                  ₹{block.amount.toLocaleString('en-IN')}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-white/5 text-[10px] font-mono">
                  <div>
                    <span className="text-[#C5BDB7] block">Current SHA-256:</span>
                    <HashChip hash={block.blockHash} startLength={6} endLength={4} />
                  </div>
                  <div>
                    <span className="text-[#C5BDB7] block">Previous Hash:</span>
                    <HashChip hash={block.previousBlockHash} startLength={6} endLength={4} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

export default LedgerIntegrityPanel;
