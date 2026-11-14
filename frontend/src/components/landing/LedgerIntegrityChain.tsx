'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { GlassCard } from '@/components/ui/GlassCard';
import { HashChip } from '@/components/ui/HashChip';
import { Link2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SEED_TRANSACTIONS } from '@/lib/mock/seed';
import { formatCurrency } from '@/lib/utils';

export function LedgerIntegrityChain() {
  const chainBlocks = SEED_TRANSACTIONS.slice(0, 5);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);

  const activeBlock = chainBlocks[selectedBlockIndex];

  return (
    <section id="trust" className="relative py-24 z-10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Cryptographic Audit"
          title="Trust is not a promise. It's verifiable."
          gradientWord="verifiable."
          description="Every settlement is cryptographically anchored to its predecessor via SHA-256 hash chains. Historical transaction alterations produce an immediate chain break."
          align="center"
          className="mb-14"
        />

        {/* Ledger Control Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-[#122023]/90 border border-[rgba(97,65,60,0.35)] mb-8 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#F8F9FA]">
                  SHA-256 HASH CHAIN
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] font-mono text-[10px] font-bold">
                  LEDGER STATUS: VERIFIED
                </span>
              </div>
              <p className="font-mono text-xs text-[#C5BDB7]">
                Deterministic Proof Engine • Zero Drift • 40 Blocks Committed
              </p>
            </div>
          </div>

          <div className="mt-3 sm:mt-0 font-mono text-xs text-[#FE7E3C] px-3 py-1.5 rounded-lg bg-[#0E6873]/30 border border-[#FE7E3C]/20">
            [INTERACTIVE DEMO BLOCKS]
          </div>
        </div>

        {/* Horizontal Chain Visualization */}
        <div className="relative overflow-x-auto pb-6">
          <div className="flex items-center gap-3 min-w-[900px] px-2">
            {chainBlocks.map((block, idx) => {
              const isSelected = selectedBlockIndex === idx;
              return (
                <React.Fragment key={block.id}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedBlockIndex(idx)}
                    className="flex-1 cursor-pointer"
                  >
                    <GlassCard
                      variant={isSelected ? 'accent' : 'default'}
                      padding="md"
                      className={`relative border transition-all ${
                        isSelected
                          ? 'border-[#FE7E3C] shadow-[0_0_25px_rgba(254,126,60,0.3)] bg-[#16363B]/90'
                          : 'border-[rgba(97,65,60,0.35)] hover:border-[rgba(254,126,60,0.4)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[10px] font-bold uppercase text-[#FE7E3C]">
                          Block #{40 - idx}
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[9px] text-[#10B981]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SEALED</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <p className="font-mono font-bold text-xs text-[#F8F9FA] truncate">
                          {block.id}
                        </p>
                        <p className="font-mono text-[11px] text-[#C5BDB7]">
                          {formatCurrency(block.amount)}
                        </p>
                      </div>

                      {/* Hash snippet */}
                      <div className="pt-2 border-t border-[rgba(97,65,60,0.3)] flex flex-col gap-1">
                        <span className="text-[9px] font-mono text-[#C5BDB7]">Current Hash:</span>
                        <span className="text-[10px] font-mono text-[#FE7E3C] truncate">
                          {block.blockHash.slice(0, 16)}...
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* Connecting Chain Link Icon */}
                  {idx < chainBlocks.length - 1 && (
                    <div className="relative shrink-0 flex items-center justify-center w-8">
                      <div className="w-full h-0.5 bg-[rgba(97,65,60,0.4)]" />
                      <div className="absolute w-6 h-6 rounded-full bg-[#122023] border border-[#FE7E3C]/40 flex items-center justify-center text-[#FE7E3C]">
                        <Link2 className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Block Inspection Box */}
        {activeBlock && (
          <motion.div
            key={activeBlock.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 rounded-2xl bg-[#122023]/80 border border-[rgba(14,104,115,0.45)] backdrop-blur-xl shadow-lg"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-[rgba(97,65,60,0.3)] gap-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-[#FE7E3C] font-semibold">
                  Block Inspector • {activeBlock.id}
                </span>
                <h4 className="font-display text-lg font-bold text-[#F8F9FA] mt-0.5">
                  Cryptographic Payload & Provenance
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <HashChip hash={activeBlock.blockHash} label="BLOCK HASH" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 font-mono text-xs">
              <div>
                <span className="text-[#C5BDB7] block mb-1 uppercase text-[10px]">
                  Parent Block Hash:
                </span>
                <span className="text-[#C5BDB7] break-all">{activeBlock.previousBlockHash}</span>
              </div>
              <div>
                <span className="text-[#C5BDB7] block mb-1 uppercase text-[10px]">
                  Counterparties & UTR:
                </span>
                <span className="text-[#F8F9FA] block">{activeBlock.senderVpa} → {activeBlock.receiverVpa}</span>
                <span className="text-[#FE7E3C] text-[11px] block mt-0.5">UTR: {activeBlock.utr}</span>
              </div>
              <div>
                <span className="text-[#C5BDB7] block mb-1 uppercase text-[10px]">
                  AI Risk & Decision:
                </span>
                <span className="text-[#10B981] font-bold block">
                  Score {activeBlock.riskAssessment.score}/100 • {activeBlock.riskAssessment.decision}
                </span>
                <span className="text-[#C5BDB7] text-[11px] block mt-0.5">
                  Confidence: {(activeBlock.riskAssessment.modelConfidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default LedgerIntegrityChain;
