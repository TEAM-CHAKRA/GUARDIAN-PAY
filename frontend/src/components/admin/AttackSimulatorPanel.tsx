'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Smartphone,
  Share2,
  Moon,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Eye,
  Layers,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { HashChip } from '@/components/ui/HashChip';
import { useToast } from '@/components/ui/Toast';
import { FraudScenario, Transaction } from '@/lib/types';
import { api } from '@/lib/api';

interface AttackSimulatorPanelProps {
  scenarios: FraudScenario[];
  onAttackIntercepted: (tx: Transaction) => void;
  onOpenInvestigation: (tx: Transaction) => void;
}

export function AttackSimulatorPanel({
  scenarios,
  onAttackIntercepted,
  onOpenInvestigation,
}: AttackSimulatorPanelProps) {
  const { success, warning, error: toastError } = useToast();

  const [activeScenarioId, setActiveScenarioId] = useState<string>('SCENARIO-VELOCITY');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{
    scenario: FraudScenario;
    interceptedTransaction: Transaction;
    mitigationAction: string;
  } | null>(null);

  const scenarioIcons: Record<string, React.ReactNode> = {
    'SCENARIO-VELOCITY': <Zap className="w-5 h-5 text-[#E4201B]" />,
    'SCENARIO-DEVICE': <Smartphone className="w-5 h-5 text-[#FE7E3C]" />,
    'SCENARIO-MULE': <Share2 className="w-5 h-5 text-[#FE7E3C]" />,
    'SCENARIO-NIGHT': <Moon className="w-5 h-5 text-[#0E6873]" />,
  };

  const currentScenario =
    scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  const handleRunSimulation = async (scenario: FraudScenario) => {
    setIsRunning(true);
    setSimulationStep(1); // Staging payload
    setLastResult(null);

    try {
      // Step 1: Payload injection
      await new Promise((r) => setTimeout(r, 450));
      setSimulationStep(2); // Neural heuristic scanning

      // Step 2: Anomaly evaluation
      await new Promise((r) => setTimeout(r, 450));
      setSimulationStep(3); // Policy enforcement

      // Call API
      const res = await api.simulateAttack(scenario.id);
      await new Promise((r) => setTimeout(r, 300));

      setLastResult(res);
      onAttackIntercepted(res.interceptedTransaction);

      if (res.scenario.expectedDecision === 'BLOCK') {
        warning(
          `Attack Intercepted: ${res.scenario.name}`,
          `${res.mitigationAction}. Threat score ${res.scenario.expectedScore}/100.`
        );
      } else {
        success(
          `Simulation Evaluated: ${res.scenario.name}`,
          `Policy enforced: ${res.scenario.expectedDecision}`
        );
      }
    } catch (err: any) {
      toastError('Simulation harness encountered an execution fault.');
    } finally {
      setIsRunning(false);
      setSimulationStep(0);
    }
  };

  return (
    <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] relative overflow-hidden space-y-6">
      {/* Background Cyber Glow */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-[#E4201B]/10 via-[#0E6873]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(97,65,60,0.25)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E4201B] animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#E4201B] uppercase font-bold">
              PENETRATION TEST HARNESS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-black text-[#F8F9FA] tracking-tight mt-0.5">
            Fraud Attack Simulation Lab
          </h2>
          <p className="text-xs text-[#C5BDB7] mt-0.5">
            Test GuardianPay&apos;s ability to detect, classify, and contain financial threats in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#122023] border border-white/10 font-mono text-xs text-[#C5BDB7]">
          <Sparkles className="w-4 h-4 text-[#FE7E3C]" />
          <span>4 Deterministic Vector Scenarios</span>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === activeScenarioId;
          const icon = scenarioIcons[scenario.id] || <ShieldAlert className="w-5 h-5 text-[#FE7E3C]" />;

          return (
            <button
              key={scenario.id}
              onClick={() => {
                setActiveScenarioId(scenario.id);
                setLastResult(null);
              }}
              className={`p-4 rounded-xl text-left border transition-all relative ${
                isSelected
                  ? 'bg-gradient-to-br from-[#0E6873]/30 to-[#122023] border-[#FE7E3C] shadow-[0_0_20px_rgba(254,126,60,0.2)]'
                  : 'bg-[#122023]/60 border-white/5 hover:border-[rgba(97,65,60,0.35)] hover:bg-[#0E6873]/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-[#1A2C30]/80 border border-white/10">
                  {icon}
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    scenario.expectedDecision === 'BLOCK'
                      ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                      : scenario.expectedDecision === 'HOLD'
                      ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                      : 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                  }`}
                >
                  {scenario.expectedDecision}
                </span>
              </div>

              <h4 className="font-display font-bold text-xs text-[#F8F9FA] mb-1 line-clamp-1">
                {scenario.name}
              </h4>
              <p className="text-[11px] text-[#C5BDB7] line-clamp-2 leading-relaxed">
                {scenario.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Detail & Runner Card */}
      {currentScenario && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT: Scenario Brief & Trigger (6 cols) */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#122023]/80 border border-[rgba(97,65,60,0.35)] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#FE7E3C] uppercase font-bold">
                  ATTACK SPECIFICATION
                </span>
                <span className="text-xs font-mono text-[#C5BDB7]">
                  ID: {currentScenario.id}
                </span>
              </div>

              <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                {currentScenario.name}
              </h3>
              <p className="text-xs text-[#C5BDB7] leading-relaxed">
                {currentScenario.description}
              </p>

              <div className="p-3.5 rounded-xl bg-[#1A2C30] border border-white/5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#C5BDB7]">Synthetic Target Amount:</span>
                  <span className="text-[#F8F9FA] font-bold">
                    ₹{currentScenario.targetAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C5BDB7]">Expected Threat Score:</span>
                  <span className="text-[#E4201B] font-bold">
                    {currentScenario.expectedScore}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C5BDB7]">Expected Policy Decision:</span>
                  <span className="text-[#FE7E3C] font-bold">
                    {currentScenario.expectedDecision}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#C5BDB7] block mb-1">
                  SIMULATED ATTACK VECTORS
                </span>
                <div className="space-y-1.5">
                  {currentScenario.simulatedAnomalies.map((anomaly, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#C5BDB7]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E4201B] mt-1.5 shrink-0" />
                      <span>{anomaly}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-3 border-t border-[rgba(97,65,60,0.25)]">
              <GlowButton
                variant="danger"
                size="md"
                isLoading={isRunning}
                onClick={() => handleRunSimulation(currentScenario)}
                className="w-full"
                leftIcon={isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              >
                {isRunning ? 'Injecting Synthetic Threat Vector...' : 'Execute Attack Simulation'}
              </GlowButton>
            </div>
          </div>

          {/* RIGHT: Live Telemetry & Result Panel (6 cols) */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-[#122023]/80 border border-[rgba(97,65,60,0.35)] flex flex-col justify-between">
            {isRunning ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-[#E4201B]/30 animate-ping" />
                  <span className="absolute inset-2 rounded-full border-2 border-[#FE7E3C]/40 animate-spin" />
                  <Fingerprint className="w-8 h-8 text-[#FE7E3C]" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-display font-bold text-sm text-[#F8F9FA]">
                    {simulationStep === 1
                      ? 'Staging Synthetic Transfer Payload...'
                      : simulationStep === 2
                      ? 'Evaluating 6-Stage Neural Heuristics...'
                      : 'Enforcing Autonomous SecOps Policy...'}
                  </h4>
                  <p className="text-xs font-mono text-[#FE7E3C]">
                    Vector: {currentScenario.id} • Latency: ~350ms
                  </p>
                </div>
              </div>
            ) : lastResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.25)]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#E4201B]" />
                    <span className="text-xs font-mono text-[#F8F9FA] font-bold">
                      ATTACK INTERCEPTION VERIFIED
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                    REAL-TIME MITIGATED
                  </span>
                </div>

                {/* Score & Decision Block */}
                <div className="flex items-center gap-5 p-4 rounded-xl bg-[#1A2C30] border border-white/5">
                  <div className="shrink-0">
                    <RiskGauge score={lastResult.scenario.expectedScore} size="sm" showLabel={false} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-black text-[#F8F9FA]">
                        {lastResult.scenario.expectedScore}
                        <span className="text-xs text-[#C5BDB7]">/100</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          lastResult.scenario.expectedDecision === 'BLOCK'
                            ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                            : 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                        }`}
                      >
                        {lastResult.scenario.expectedDecision}
                      </span>
                    </div>
                    <p className="text-xs text-[#FE7E3C] font-mono font-semibold">
                      {lastResult.mitigationAction}
                    </p>
                  </div>
                </div>

                {/* Reasons Revealed */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-mono text-[#C5BDB7] block">
                    NEURAL ANOMALIES INTERCEPTED:
                  </span>
                  {lastResult.scenario.simulatedAnomalies.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[#C5BDB7]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] mt-0.5 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                {/* Minted Simulation Tx Reference */}
                <div className="p-3 rounded-xl bg-[#1A2C30]/80 border border-white/5 space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#C5BDB7]">Synthetic Incident Tx:</span>
                    <span className="text-[#FE7E3C]">{lastResult.interceptedTransaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#C5BDB7]">Sha-256 Ledger Anchor:</span>
                    <HashChip hash={lastResult.interceptedTransaction.blockHash} startLength={6} endLength={4} />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <GlowButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenInvestigation(lastResult.interceptedTransaction)}
                    className="w-full text-xs"
                    leftIcon={<Eye className="w-3.5 h-3.5 mr-1.5" />}
                  >
                    Open Investigation Dossier
                  </GlowButton>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-xs text-[#C5BDB7] space-y-2 font-mono">
                <Play className="w-8 h-8 text-[#C5BDB7]/40" />
                <p>Select any attack vector above and click execute to observe real-time containment.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export default AttackSimulatorPanel;
