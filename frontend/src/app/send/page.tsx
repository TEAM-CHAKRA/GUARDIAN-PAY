'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Sparkles } from 'lucide-react';
import AnimatedGrid from '@/components/background/AnimatedGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Wallet, Transaction } from '@/lib/types';
import StepProgressIndicator, { PaymentStep } from '@/components/payments/StepProgressIndicator';
import PaymentSecurityPanel from '@/components/payments/PaymentSecurityPanel';
import RecipientStep, { RecipientInfo } from '@/components/payments/RecipientStep';
import AmountStep from '@/components/payments/AmountStep';
import RiskAnalysisStep, { RiskAnalysisData } from '@/components/payments/RiskAnalysisStep';
import AuthorizationStep from '@/components/payments/AuthorizationStep';
import PaymentResultStep from '@/components/payments/PaymentResultStep';
import { ScanQrModal } from '@/components/dashboard/DashboardModals';
import { useRiskTint } from '@/lib/RiskTintContext';

function SendPaymentWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, warning, error, info } = useToast();
  const { setRiskTint } = useRiskTint();

  useEffect(() => {
    return () => {
      setRiskTint('safe');
    };
  }, [setRiskTint]);

  const initialVpaParam = searchParams.get('vpa') || 'diya@aegis';
  const initialAmountParam = searchParams.get('amount') || '1450';

  const [step, setStep] = useState<PaymentStep>('RECIPIENT');
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Payment State
  const [recipient, setRecipient] = useState<RecipientInfo>({
    vpa: initialVpaParam,
    name: 'Diya Sharma',
    isVerified: true,
    isFlagged: false,
    trustScore: 98,
    category: 'TRUSTED',
  });
  const [amount, setAmount] = useState<number>(parseFloat(initialAmountParam) || 1450);
  const [note, setNote] = useState<string>('Infrastructure split');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => `IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  // Analysis State
  const [analysisData, setAnalysisData] = useState<RiskAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Result Transaction
  const [settledTx, setSettledTx] = useState<Transaction | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // QR Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Fetch Wallet state
  const loadWallet = async () => {
    try {
      const res = await api.getWallet();
      setWallet(res.wallet);
    } catch {
      //
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  // Handler for Recipient Selected (Step 1 -> Step 2)
  const handleRecipientSelected = (selected: RecipientInfo) => {
    setRecipient(selected);
    setStep('AMOUNT');
  };

  // Handler for Amount Entered (Step 2 -> Step 3)
  const handleProceedToAnalysis = async (enteredAmount: number, enteredNote: string, forceScore?: number) => {
    setAmount(enteredAmount);
    setNote(enteredNote);
    setIsAnalyzing(true);
    setStep('ANALYSIS');

    try {
      const analysis = await api.analyzeTransaction({
        receiverVpa: recipient.vpa,
        amount: enteredAmount,
        note: enteredNote,
        forceScore,
      });

      setAnalysisData(analysis);
      const score = analysis.score;
      if (score <= 30) setRiskTint('safe');
      else if (score <= 60) setRiskTint('warn');
      else if (score <= 80) setRiskTint('hold');
      else setRiskTint('danger');
    } catch {
      error('Analysis Failed', 'Could not run neural evaluation.');
      setStep('AMOUNT');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler to proceed from Analysis to Authorization (Step 3 -> Step 4)
  const handleCompleteAnalysis = () => {
    setStep('AUTHORIZE');
  };

  // Handler for Payment Cleared (Step 4 -> Step 5)
  const handlePaymentSuccess = (tx: Transaction) => {
    setSettledTx(tx);
    setPaymentError(null);
    loadWallet();
    setStep('RESULT');
  };

  const handlePaymentFailure = (errMsg: string) => {
    setPaymentError(errMsg);
    setSettledTx(null);
    setStep('RESULT');
  };

  // Preset Scenario Loader (Deterministic tests: 18, 47, 72, 94)
  const handleSelectPresetScenario = (sc: { vpa: string; amount: number; score: number; label: string }) => {
    if (sc.score <= 30) setRiskTint('safe');
    else if (sc.score <= 60) setRiskTint('warn');
    else if (sc.score <= 80) setRiskTint('hold');
    else setRiskTint('danger');
    const isDiya = sc.vpa === 'diya@aegis';
    const isDubious = sc.vpa.includes('dubious');
    const isBridge = sc.vpa.includes('bridge');

    const presetRecipient: RecipientInfo = {
      vpa: sc.vpa,
      name: isDiya
        ? 'Diya Sharma'
        : isDubious
        ? 'Dubious Merchant Services'
        : isBridge
        ? 'Darknet Crypto Bridge Node'
        : 'Ananya Verma',
      isVerified: !isDubious && !isBridge,
      isFlagged: isDubious || isBridge,
      trustScore: isBridge ? 6 : isDubious ? 32 : 98,
      category: isBridge || isDubious ? 'HIGH_RISK' : 'TRUSTED',
    };

    setRecipient(presetRecipient);
    setAmount(sc.amount);
    setNote(`Preset test: ${sc.label}`);
    setIdempotencyKey(`IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

    info(`Loaded Scenario: ${sc.label}`, `Target: ${sc.vpa} • ₹${sc.amount.toLocaleString('en-IN')}`);

    // Trigger analysis with forced score
    handleProceedToAnalysis(sc.amount, `Preset test: ${sc.label}`, sc.score);
  };

  const handleReset = () => {
    setIdempotencyKey(`IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    setSettledTx(null);
    setPaymentError(null);
    setAnalysisData(null);
    setStep('RECIPIENT');
  };

  return (
    <div className="relative min-h-screen bg-[#1A2C30] text-[#F8F9FA] overflow-x-hidden flex flex-col">
      <AnimatedGrid />

      {/* Top Header & Navigation */}
      <header className="sticky top-0 z-30 bg-[#1A2C30]/85 backdrop-blur-xl border-b border-[rgba(97,65,60,0.35)] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FE7E3C]/20 to-[#E4201B]/20 border border-[#FE7E3C]/40 flex items-center justify-center text-[#FE7E3C]">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-display font-black text-sm tracking-wider text-[#F8F9FA]">
              GUARDIAN<span className="text-[#FE7E3C]">PAY</span>
            </span>
          </div>

          <span className="font-mono text-xs text-[#10B981] px-2.5 py-1 rounded-md bg-[#122023] border border-[#10B981]/30 hidden sm:inline-block">
            ENCLAVE PROTECTED
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 flex flex-col justify-start relative z-10">
        {/* Step Progress Bar */}
        <div className="max-w-3xl mx-auto w-full mb-8">
          <StepProgressIndicator currentStep={step} />
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Payment Workflow Container (8 cols) */}
          <div className="lg:col-span-8 w-full">
            <GlassCard
              variant="elevated"
              padding="xl"
              className="border-[rgba(97,65,60,0.35)] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(254,126,60,0.08)] backdrop-blur-2xl relative"
            >
              {/* Step 1: Recipient Selection */}
              {step === 'RECIPIENT' && (
                <RecipientStep
                  initialVpa={recipient.vpa}
                  onSelectRecipient={handleRecipientSelected}
                  onOpenQrScanner={() => setIsQrModalOpen(true)}
                />
              )}

              {/* Step 2: Amount Entry & Pre-Analysis Review */}
              {step === 'AMOUNT' && (
                <AmountStep
                  recipient={recipient}
                  wallet={wallet}
                  initialAmount={String(amount)}
                  initialNote={note}
                  onBack={() => setStep('RECIPIENT')}
                  onProceedToAnalysis={(amt, n) => handleProceedToAnalysis(amt, n)}
                />
              )}

              {/* Step 3: Live 6-Stage Neural Risk Analysis */}
              {step === 'ANALYSIS' && analysisData && (
                <RiskAnalysisStep
                  recipient={recipient}
                  amount={amount}
                  analysisData={analysisData}
                  onCompleteAnalysis={handleCompleteAnalysis}
                />
              )}

              {/* Step 4: Decision Outcome & PIN / Step-Up Authorization */}
              {step === 'AUTHORIZE' && analysisData && (
                <AuthorizationStep
                  recipient={recipient}
                  amount={amount}
                  note={note}
                  analysisData={analysisData}
                  idempotencyKey={idempotencyKey}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFailure={handlePaymentFailure}
                  onCancel={handleReset}
                />
              )}

              {/* Step 5: Final Settlement Result */}
              {step === 'RESULT' && (
                <PaymentResultStep
                  transaction={settledTx}
                  errorMessage={paymentError}
                  onReset={handleReset}
                />
              )}
            </GlassCard>
          </div>

          {/* Supporting Desktop Security & Deterministic Scenario Panel (4 cols) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-20">
            <PaymentSecurityPanel
              wallet={wallet}
              idempotencyKey={idempotencyKey}
              onSelectPresetScenario={handleSelectPresetScenario}
            />
          </div>
        </div>
      </div>

      {/* QR Scanner Simulation Modal */}
      <ScanQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanned={(scannedVpa, scannedAmt) => {
          setRecipient({
            vpa: scannedVpa,
            name: scannedVpa.split('@')[0],
            isVerified: true,
            isFlagged: false,
            trustScore: 99,
            category: 'TRUSTED',
          });
          setAmount(scannedAmt);
          setStep('AMOUNT');
        }}
      />
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1A2C30] flex items-center justify-center text-[#FE7E3C] font-mono text-xs">
          Loading Security Workspace...
        </div>
      }
    >
      <SendPaymentWorkspace />
    </Suspense>
  );
}
