'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { GlowButton } from '@/components/ui/GlowButton';
import { PaymentDecision, RiskLevel } from '@/lib/types';
import { getRiskColor, formatCurrency } from '@/lib/utils';
import { RecipientInfo } from './RecipientStep';

export interface RiskAnalysisData {
  score: number;
  level: RiskLevel;
  decision: PaymentDecision;
  reasons: string[];
  stages: {
    id: string;
    title: string;
    status: 'PASSED' | 'WARNING' | 'FLAGGED';
    details: string;
  }[];
}

export interface RiskAnalysisStepProps {
  recipient: RecipientInfo;
  amount: number;
  analysisData: RiskAnalysisData;
  onCompleteAnalysis: () => void;
}

export function RiskAnalysisStep({
  recipient,
  amount,
  analysisData,
  onCompleteAnalysis,
}: RiskAnalysisStepProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [revealedReasonsCount, setRevealedReasonsCount] = useState(0);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [isDecisionVisible, setIsDecisionVisible] = useState(false);

  // Progressive simulated pipeline sequence
  useEffect(() => {
    const totalStages = analysisData.stages.length;

    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < totalStages - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsAnalysisComplete(true);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(interval);
  }, [analysisData.stages.length]);

  // Reveal top 3 explainable factors sequentially 300ms apart before decision appears
  useEffect(() => {
    if (!isAnalysisComplete) return;

    const targetReasons = Math.min(3, analysisData.reasons.length || 3);
    const factorTimer = setInterval(() => {
      setRevealedReasonsCount((prev) => {
        if (prev < targetReasons) {
          return prev + 1;
        } else {
          clearInterval(factorTimer);
          setTimeout(() => setIsDecisionVisible(true), 300);
          return prev;
        }
      });
    }, 300);

    return () => clearInterval(factorTimer);
  }, [isAnalysisComplete, analysisData.reasons.length]);

  const { color, level, glow } = getRiskColor(analysisData.score);

  return (
    <div className="space-y-8 text-center py-4">
      {/* Signature Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0E6873]/25 border border-[#FE7E3C]/35 shadow-[0_0_15px_rgba(254,126,60,0.15)] mb-3">
          <Cpu className="w-4 h-4 text-[#FE7E3C] animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#FE7E3C] uppercase tracking-wider">
            Sub-15ms Neural Telemetry
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-4xl font-black text-[#F8F9FA] tracking-tight">
          Securing your payment.
        </h2>
        <p className="font-sans text-xs sm:text-sm text-[#C5BDB7] mt-1.5 max-w-md mx-auto">
          GuardianPay Intelligence is evaluating transfer payload of {formatCurrency(amount)} to{' '}
          <strong className="text-[#FE7E3C] font-mono">{recipient.vpa}</strong>.
        </p>
      </div>

      {/* Center Animated Radial RiskGauge */}
      <div className="relative py-4 flex flex-col items-center justify-center">
        {/* Outer ambient glow based on calculated score */}
        <div
          aria-hidden="true"
          className="absolute w-56 h-56 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-700"
          style={{ backgroundColor: color }}
        />

        <RiskGauge score={analysisData.score} size="lg" showLabel={true} />
      </div>

      {/* 6 Sequential Stages Progress Bar */}
      <div className="max-w-md mx-auto space-y-2 text-left">
        <span className="font-mono text-[11px] text-[#C5BDB7] uppercase tracking-wider block text-center">
          Neural Evaluation Pipeline (Stage {currentStageIndex + 1} of {analysisData.stages.length})
        </span>

        <div className="grid grid-cols-6 gap-1.5 h-1.5 w-full bg-[#122023] rounded-full p-0.5 border border-[rgba(97,65,60,0.35)]">
          {analysisData.stages.map((stg, i) => (
            <div
              key={stg.id}
              className={`h-full rounded-full transition-all duration-300 ${
                i <= currentStageIndex ? 'bg-[#FE7E3C] shadow-[0_0_8px_#FE7E3C]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>

        {/* Current Stage detail text */}
        <div className="p-3 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] flex items-center justify-between text-xs font-mono">
          <span className="text-[#F8F9FA] font-bold">
            {analysisData.stages[currentStageIndex]?.title}
          </span>
          <span className="text-[#10B981] text-[10px]">
            {analysisData.stages[currentStageIndex]?.details}
          </span>
        </div>
      </div>

      {/* Top 3 Explainable Risk Reasons (Revealed Sequentially) */}
      {isAnalysisComplete && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto text-left space-y-2.5 pt-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-[#FE7E3C] font-bold">
              Explainable Risk Vectors:
            </span>
            <span className="font-mono text-[10px] text-[#C5BDB7]">
              Model Confidence: 99.8%
            </span>
          </div>

          <div className="space-y-2">
            {analysisData.reasons.slice(0, revealedReasonsCount).map((reason, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="p-3 rounded-xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] flex items-start gap-2.5 text-xs font-sans text-[#F8F9FA]"
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}20`, color: color }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <span className="font-mono text-[10px] text-[#C5BDB7] block uppercase">
                    Factor 0{idx + 1}
                  </span>
                  <p className="font-medium text-[#F8F9FA] leading-snug">{reason}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Decision Outcome Banner (Reveals after factors) */}
          <AnimatePresence>
            {isDecisionVisible && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="p-4 rounded-xl border mt-4 text-center font-mono"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}40`,
                }}
              >
                <span className="text-xs uppercase tracking-wider block text-[#C5BDB7]">
                  Autonomous Defense Policy Enacted:
                </span>
                <span className="text-lg font-black tracking-tight" style={{ color: color }}>
                  {analysisData.decision === 'ALLOW'
                    ? 'CLEARED FOR DIRECT SETTLEMENT'
                    : analysisData.decision === 'STEP_UP'
                    ? 'STEP-UP MFA CHALLENGE TRIGGERED'
                    : analysisData.decision === 'HOLD'
                    ? 'TRANSACTION QUARANTINED (10-MIN COOLING)'
                    : 'HARD BLOCK & WALLET FROZEN'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Action to proceed to Authorization or Result handler */}
      {isDecisionVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-4 max-w-sm mx-auto"
        >
          <GlowButton
            variant="primary"
            size="lg"
            onClick={onCompleteAnalysis}
            rightIcon={<ArrowRight className="w-5 h-5 ml-1" />}
            className="w-full shadow-[0_0_25px_rgba(254,126,60,0.4)]"
          >
            Proceed to Decision Handler
          </GlowButton>
        </motion.div>
      )}
    </div>
  );
}

export default RiskAnalysisStep;
