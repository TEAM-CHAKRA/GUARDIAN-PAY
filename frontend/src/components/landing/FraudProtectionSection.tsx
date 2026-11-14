'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Key, Clock, ShieldAlert, AlertTriangle, Cpu } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { useRiskTint } from '@/lib/RiskTintContext';

export function FraudProtectionSection() {
  const { setRiskTint } = useRiskTint();
  const [selectedScore, setSelectedScore] = useState<number>(24);

  const handleScoreChange = (newScore: number) => {
    setSelectedScore(newScore);
    if (newScore <= 30) setRiskTint('safe');
    else if (newScore <= 60) setRiskTint('warn');
    else if (newScore <= 80) setRiskTint('hold');
    else setRiskTint('danger');
  };

  const decisions = [
    {
      decision: 'ALLOW',
      color: '#10B981',
      range: 'Score 0 – 30',
      icon: CheckCircle2,
      title: 'Normal Authorization',
      explanation:
        'Payment proceeds immediately. Risk score falls below baseline threshold; transaction requires only standard PIN verification.',
    },
    {
      decision: 'STEP_UP',
      color: '#FE7E3C',
      range: 'Score 31 – 60',
      icon: Key,
      title: 'Adaptive Multi-Factor',
      explanation:
        'Moderate anomaly detected (e.g. unfamiliar recipient, new device IP). Requires secondary 6-digit OTP confirmation before PIN.',
    },
    {
      decision: 'HOLD',
      color: '#D9531E',
      range: 'Score 61 – 80',
      icon: Clock,
      title: 'Security Cooling Period',
      explanation:
        'Elevated anomaly flagged (e.g. rapid velocity spike). Payment is queued in a timed escrow hold pending additional account verification.',
    },
    {
      decision: 'BLOCK',
      color: '#E4201B',
      range: 'Score 81 – 100',
      icon: ShieldAlert,
      title: 'Immediate Rejection',
      explanation:
        'Critical threat detected (e.g. credential compromise signature, velocity abuse). Payment is rejected instantly and defensive limits engage.',
    },
  ];

  const getDecisionFromScore = (score: number) => {
    if (score <= 30) return decisions[0];
    if (score <= 60) return decisions[1];
    if (score <= 80) return decisions[2];
    return decisions[3];
  };

  const currentActive = getDecisionFromScore(selectedScore);

  return (
    <section id="fraud-protection" className="relative py-24 border-t border-[rgba(97,65,60,0.3)] bg-[#122023]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)] text-xs font-mono text-[#FE7E3C] uppercase tracking-wider font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous Risk Policy</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#F8F9FA] tracking-tight">
            AI Fraud Protection Engine
          </h2>
          <p className="font-sans text-base text-[#C5BDB7] leading-relaxed">
            Every transaction is dynamically scored across multiple behavioural vectors, generating deterministic security decisions.
          </p>
        </div>

        {/* Interactive Risk Score Simulation Cockpit */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-[#1A2C30]/90 border border-[rgba(97,65,60,0.35)] shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Interactive Score Slider & Live Feedback */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#C5BDB7] uppercase">Test Risk Vector Slider:</span>
                  <span className="font-bold text-sm text-[#F8F9FA]">
                    Score: <span style={{ color: currentActive.color }}>{selectedScore}</span> / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedScore}
                  onChange={(e) => handleScoreChange(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-[#122023] appearance-none cursor-pointer accent-[#FE7E3C]"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#C5BDB7]">
                  <span>0 (Safe)</span>
                  <span>30 (Allow limit)</span>
                  <span>60 (Step-Up)</span>
                  <span>80 (Hold)</span>
                  <span>100 (Critical Block)</span>
                </div>
              </div>

              {/* Dynamic Feedback Card */}
              <div
                className="p-4 rounded-2xl border transition-all duration-300"
                style={{
                  backgroundColor: `${currentActive.color}15`,
                  borderColor: `${currentActive.color}50`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                    style={{
                      color: currentActive.color,
                      backgroundColor: `${currentActive.color}20`,
                      borderColor: `${currentActive.color}40`,
                    }}
                  >
                    STATUS: {currentActive.decision}
                  </span>
                  <span className="font-mono text-xs text-[#C5BDB7]">
                    {currentActive.range}
                  </span>
                </div>
                <p className="font-display font-bold text-base text-[#F8F9FA] mb-1">
                  {currentActive.title}
                </p>
                <p className="text-xs text-[#C5BDB7] leading-relaxed font-sans">
                  {currentActive.explanation}
                </p>
              </div>
            </div>

            {/* Right: Radial Risk Gauge Visual with Concentric Radar Pulse Rings */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 relative">
              {/* Concentric Radar Rings Pulsing Outward */}
              <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  key={`ring-1-${currentActive.decision}`}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: [0.8, 1.4, 1.8], opacity: [0.5, 0.2, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-44 h-44 rounded-full border-2"
                  style={{ borderColor: currentActive.color }}
                />
                <motion.div
                  key={`ring-2-${currentActive.decision}`}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: [0.8, 1.4, 1.8], opacity: [0.5, 0.2, 0] }}
                  transition={{ duration: 3.2, delay: 1.1, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-44 h-44 rounded-full border"
                  style={{ borderColor: currentActive.color }}
                />
                <motion.div
                  key={`ring-3-${currentActive.decision}`}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: [0.8, 1.4, 1.8], opacity: [0.5, 0.2, 0] }}
                  transition={{ duration: 3.2, delay: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-44 h-44 rounded-full border border-dashed"
                  style={{ borderColor: currentActive.color }}
                />
              </div>

              <div className="relative z-10">
                <RiskGauge score={selectedScore} size="lg" />
              </div>
              <p className="text-[11px] font-mono text-[#C5BDB7] mt-4 text-center relative z-10">
                Autonomous policy dynamically calibrated in &lt;15ms
              </p>
            </div>
          </div>
        </div>

        {/* Four Policy Decision Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {decisions.map((item) => {
            const Icon = item.icon;
            const isMatch = currentActive.decision === item.decision;

            return (
              <GlassCard
                key={item.decision}
                className={`p-6 border transition-all duration-300 ${
                  isMatch
                    ? 'border-[#FE7E3C] shadow-[0_0_25px_rgba(254,126,60,0.25)]'
                    : 'border-[rgba(97,65,60,0.35)]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      color: item.color,
                      backgroundColor: `${item.color}20`,
                    }}
                  >
                    {item.decision}
                  </span>
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="text-[11px] font-mono text-[#C5BDB7] mb-2">
                  {item.range}
                </div>
                <h4 className="font-display font-bold text-sm text-[#F8F9FA] mb-1.5">
                  {item.title}
                </h4>
                <p className="text-xs text-[#C5BDB7] leading-relaxed font-sans">
                  {item.explanation}
                </p>
              </GlassCard>
            );
          })}
        </div>

        {/* Transparent Simulation Disclaimer */}
        <div className="mt-12 p-4 rounded-xl bg-[#1A2C30]/50 border border-[rgba(97,65,60,0.25)] flex items-center gap-3 max-w-2xl mx-auto text-xs font-mono text-[#C5BDB7]">
          <AlertTriangle className="w-4 h-4 text-[#FE7E3C] shrink-0" />
          <p>
            Simulation Notice: GUARDIANPAY is a demonstration fintech sandbox. Algorithms demonstrate adaptive decision architectures and do not provide real-world banking clearance.
          </p>
        </div>
      </div>
    </section>
  );
}

export default FraudProtectionSection;
