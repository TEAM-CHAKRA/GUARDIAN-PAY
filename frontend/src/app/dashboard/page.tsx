'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  History,
} from 'lucide-react';
import AnimatedGrid from '@/components/background/AnimatedGrid';
import Sidebar from '@/components/layout/Sidebar';
import DashboardTopBar from '@/components/layout/DashboardTopBar';
import MobileNav from '@/components/layout/MobileNav';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Stat } from '@/components/ui/Stat';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashChip } from '@/components/ui/HashChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { Wallet, User, Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import SpendingAnalytics from '@/components/dashboard/SpendingAnalytics';
import QuickActionCards from '@/components/dashboard/QuickActionCards';
import RoundUpSavingsCard from '@/components/dashboard/RoundUpSavingsCard';
import WalletProtectionWidget from '@/components/dashboard/WalletProtectionWidget';
import {
  SendMoneyModal,
  RequestMoneyModal,
  ScanQrModal,
  AddMoneyModal,
} from '@/components/dashboard/DashboardModals';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { success, warning, error } = useToast();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Quick Action Modals
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Security Centre & All Transactions Modals
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAllTxModalOpen, setIsAllTxModalOpen] = useState(false);
  const [txFilter, setTxFilter] = useState<'ALL' | 'SUSPICIOUS' | 'SAFE'>('ALL');
  const [isFreezing, setIsFreezing] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [walletRes, txRes] = await Promise.all([
        api.getWallet(),
        api.getTransactions({ limit: 40 }),
      ]);
      if (walletRes?.wallet) {
        setWallet(walletRes.wallet);
      }
      if (walletRes?.user) {
        setUser(walletRes.user);
      }
      setTransactions(Array.isArray(txRes?.transactions) ? txRes.transactions : []);
    } catch {
      setLoadError('Failed to synchronize with the cryptographic consensus engine.');
      error('Consensus Sync Error', 'Could not fetch current wallet ledger.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCopyVpa = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vpa = user?.vpa || 'aarav@aegis';
    navigator.clipboard.writeText(vpa);
    setCopiedVpa(true);
    success(t('vpaCopied'), vpa);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleToggleFreeze = async () => {
    if (!wallet) return;
    setIsFreezing(true);
    const targetState = !wallet.isFrozen;
    try {
      const res = await api.freezeWallet(wallet.id, targetState);
      setWallet(res.wallet);
      if (targetState) {
        warning(
          'Wallet Quarantined',
          'Autonomous freeze engaged. All outgoing debit authorizations halted.'
        );
      } else {
        success(
          'Wallet Restored',
          'Security quarantine released. Ledger settlements resumed.'
        );
      }
    } catch {
      error('Freeze Action Failed', 'Unable to update perimeter status.');
    } finally {
      setIsFreezing(false);
    }
  };

  const handleSimulateAttack = async (scenarioId: string) => {
    try {
      const res = await api.simulateAttack(scenarioId);
      warning(
        `Attack Intercepted: ${res.scenario.name}`,
        `${res.mitigationAction}. Threat score ${res.scenario.expectedScore}/100.`
      );
      fetchDashboardData();
    } catch {
      error('Simulation Failed', 'Could not dispatch synthetic attack.');
    }
  };

  const [greetingText, setGreetingText] = useState<string>(t('greetingMorning'));
  const [formattedToday, setFormattedToday] = useState<string>('Today');

  useEffect(() => {
    const currentHour = new Date().getHours();
    setGreetingText(
      currentHour < 12
        ? t('greetingMorning')
        : currentHour < 18
        ? t('greetingAfternoon')
        : t('greetingEvening')
    );
    setFormattedToday(
      new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date())
    );
  }, [t]);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const filteredTransactions = safeTransactions.filter((tx) => {
    if (txFilter === 'SUSPICIOUS') return tx.isSuspicious;
    if (txFilter === 'SAFE') return !tx.isSuspicious;
    return true;
  });

  return (
    <div className="relative min-h-screen bg-[#1A2C30] text-[#F8F9FA] flex flex-col lg:flex-row overflow-x-hidden">
      <AnimatedGrid />

      {/* Desktop Fixed Sidebar */}
      <Sidebar
        onActionClick={(actionId) => {
          if (actionId === 'send') setIsSendOpen(true);
          if (actionId === 'receive') setIsRequestOpen(true);
          if (actionId === 'transactions') setIsAllTxModalOpen(true);
          if (actionId === 'security') setIsSecurityModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10 pb-24 lg:pb-12">
        {/* Top Navigation Bar with Language Toggle & Profile */}
        <DashboardTopBar
          userName={user?.name || 'Aarav Mehta'}
          userVpa={user?.vpa || 'aarav@aegis'}
        />

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* 1. Header Greeting Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(97,65,60,0.35)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-[#10B981] font-semibold">
                  {t('walletProtected')} • {t('ledgerSynced')}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#F8F9FA]">
                {greetingText}, {user?.name?.split(' ')[0] || 'Aarav'}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#C5BDB7] mt-0.5">
                {t('securityOverviewSubtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs text-[#C5BDB7] px-3 py-1.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)]">
                {formattedToday}
              </span>

              <GlowButton
                variant="secondary"
                size="sm"
                onClick={fetchDashboardData}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              >
                Sync
              </GlowButton>
            </div>
          </div>

          {/* Error fallback state with retry button */}
          {loadError && (
            <div className="p-4 rounded-2xl bg-[#E4201B]/15 border border-[#E4201B]/40 text-[#E4201B] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-mono">{loadError}</span>
              </div>
              <GlowButton variant="secondary" size="sm" onClick={fetchDashboardData}>
                Retry Sync
              </GlowButton>
            </div>
          )}

          {/* Skeleton loading state */}
          {isLoading && !wallet ? (
            <div className="space-y-6">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* 2. Main Glass Wallet Card & Protection Widget */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Main Wallet Card (7 cols) */}
                <div className="lg:col-span-7">
                  <GlassCard
                    variant="accent"
                    padding="lg"
                    className="relative overflow-hidden h-full flex flex-col justify-between border-[rgba(254,126,60,0.35)] shadow-[0_15px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(254,126,60,0.12)]"
                  >
                    {/* Top ambient illumination line */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#FE7E3C] to-transparent shadow-[0_0_15px_#FE7E3C]"
                    />

                    <div>
                      {/* Top status & VPA row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs uppercase tracking-wider text-[#C5BDB7]">
                            {t('availableBalance')}
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 uppercase">
                            {wallet?.isFrozen ? 'FROZEN' : 'ACTIVE • ENCLAVE SECURED'}
                          </span>
                        </div>

                        {/* Copyable VPA Chip */}
                        <div
                          onClick={handleCopyVpa}
                          className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#122023] border border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C] text-xs font-mono text-[#FE7E3C] transition-all cursor-pointer shadow-sm"
                          title="Click to copy VPA"
                        >
                          <span className="text-[#C5BDB7] text-[10px] uppercase font-bold">VPA:</span>
                          <span className="font-semibold">{user?.vpa || 'aarav@aegis'}</span>
                          {copiedVpa ? (
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#C5BDB7] group-hover:text-[#FE7E3C]" />
                          )}
                        </div>
                      </div>

                      {/* Large Balance with Count-Up */}
                      <div className="my-2">
                        <Stat
                          label=""
                          value={wallet?.balance || 84250.0}
                          prefix="₹"
                          decimals={2}
                          size="lg"
                          className="font-black tracking-tight"
                        />
                      </div>

                      <p className="font-mono text-xs text-[#C5BDB7] mt-1">
                        {t('simulatedBalanceNotice')}
                      </p>
                    </div>

                    {/* Bottom Metadata & Activity Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 mt-6 border-t border-[rgba(97,65,60,0.35)] font-mono text-xs">
                      <div>
                        <span className="text-[#C5BDB7] block text-[10px] uppercase">
                          {t('dailySpent')}:
                        </span>
                        <span className="text-[#F8F9FA] font-semibold">
                          {formatCurrency(wallet?.spentToday || 12500)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#C5BDB7] block text-[10px] uppercase">
                          {t('dailyLimit')}:
                        </span>
                        <span className="text-[#C5BDB7]">
                          {formatCurrency(wallet?.dailyLimit || 200000)}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[#C5BDB7] block text-[10px] uppercase">
                          {t('accountStatus')}:
                        </span>
                        <span className="text-[#10B981] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {t('verifiedKyc')}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Wallet Protection Widget (5 cols) */}
                <div className="lg:col-span-5">
                  <WalletProtectionWidget
                    isFrozen={wallet?.isFrozen}
                    score={8}
                    onOpenSecurity={() => (window.location.href = '/security')}
                    onToggleFreeze={handleToggleFreeze}
                  />
                </div>
              </div>

              {/* 3. Quick Actions Cards */}
              <QuickActionCards
                onSendClick={() => (window.location.href = '/send')}
                onRequestClick={() => (window.location.href = '/receive')}
                onScanClick={() => setIsScanOpen(true)}
                onAddMoneyClick={() => setIsAddMoneyOpen(true)}
              />

              {/* 4. Spending Analytics (Area + Donut + Budget) */}
              <SpendingAnalytics />

              {/* 5. Round-Up Savings Banner Card */}
              <RoundUpSavingsCard />

              {/* 6. Recent Transactions Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-[#FE7E3C]" />
                    <h3 className="font-display font-bold text-lg text-[#F8F9FA]">
                      {t('recentTransactions')}
                    </h3>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded font-mono text-[10px] bg-[#0E6873]/30 text-[#FE7E3C] border border-[rgba(97,65,60,0.35)]">
                      Latest 6 Blocks
                    </span>
                  </div>

                  <Link
                    href="/transactions"
                    className="text-xs font-mono text-[#FE7E3C] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>{t('viewAllTransactions')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {safeTransactions.length === 0 ? (
                  <EmptyState
                    title={t('noTransactionsFound')}
                    description="Initiate your first secure simulated payment to record transactions on the ledger."
                    actionLabel={t('actionSend')}
                    onAction={() => setIsSendOpen(true)}
                  />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[rgba(97,65,60,0.35)] bg-[#0E6873]/15 backdrop-blur-xl">
                    <table className="w-full text-left text-sm text-[#F8F9FA] border-collapse">
                      <thead className="bg-[#122023]/90 text-[11px] font-mono uppercase tracking-wider text-[#C5BDB7] border-b border-[rgba(97,65,60,0.35)]">
                        <tr>
                          <th className="px-4 py-3.5 font-medium">Recipient / VPA</th>
                          <th className="px-4 py-3.5 font-medium">Tx ID / Date</th>
                          <th className="px-4 py-3.5 font-medium">Amount</th>
                          <th className="px-4 py-3.5 font-medium">Status</th>
                          <th className="px-4 py-3.5 font-medium">AI Risk Rating</th>
                          <th className="px-4 py-3.5 font-medium">SHA-256 Seal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(97,65,60,0.25)] font-sans">
                        {safeTransactions.slice(0, 6).map((tx) => (
                          <tr
                            key={tx.id}
                            className="hover:bg-[#0E6873]/25 transition-colors"
                          >
                            <td className="px-4 py-3.5">
                              <span className="font-sans font-semibold text-xs text-[#F8F9FA] block">
                                {tx.receiverName}
                              </span>
                              <span className="font-mono text-[10px] text-[#FE7E3C]">
                                {tx.receiverVpa}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs font-semibold text-[#C5BDB7] block">
                                {tx.id}
                              </span>
                              <span className="font-mono text-[10px] text-[#C5BDB7]">
                                {formatDate(tx.timestamp)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs font-bold text-[#F8F9FA]">
                                {formatCurrency(tx.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <StatusBadge status={tx.status} size="sm" />
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span
                                  className={`font-bold ${
                                    tx.riskAssessment.score > 80
                                      ? 'text-[#E4201B]'
                                      : tx.riskAssessment.score > 60
                                      ? 'text-[#D9531E]'
                                      : tx.riskAssessment.score > 30
                                      ? 'text-[#FE7E3C]'
                                      : 'text-[#10B981]'
                                  }`}
                                >
                                  {tx.riskAssessment.score}/100
                                </span>
                                <span className="text-[10px] text-[#C5BDB7]">
                                  ({tx.riskAssessment.decision})
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <HashChip hash={tx.blockHash} startLength={4} endLength={4} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Quick Action Modals */}
      <SendMoneyModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onSuccess={fetchDashboardData}
      />

      <RequestMoneyModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        myVpa={user?.vpa}
      />

      <ScanQrModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanned={() => {
          setIsSendOpen(true);
        }}
      />

      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        onSuccess={fetchDashboardData}
      />

      {/* Security Centre Modal */}
      <Modal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        title={t('securityCentre')}
        description="Autonomous fraud intelligence and emergency perimeter controls."
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Emergency Wallet Quarantine Switch */}
          <div className="p-4 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] flex items-center justify-between">
            <div>
              <h4 className="font-display font-bold text-sm text-[#F8F9FA]">
                Emergency Perimeter Freeze
              </h4>
              <p className="text-xs text-[#C5BDB7] mt-0.5">
                Instantly locks wallet against all outgoing transfers.
              </p>
            </div>
            <GlowButton
              variant={wallet?.isFrozen ? 'primary' : 'danger'}
              size="sm"
              isLoading={isFreezing}
              onClick={handleToggleFreeze}
            >
              {wallet?.isFrozen ? 'Release Freeze' : 'Freeze Wallet'}
            </GlowButton>
          </div>

          {/* Synthetic Threat Simulations */}
          <div>
            <h4 className="font-display font-bold text-sm text-[#F8F9FA] mb-2">
              Run Adversary Attack Simulation
            </h4>
            <div className="space-y-2.5">
              <button
                onClick={() => handleSimulateAttack('SCENARIO-1')}
                className="w-full p-3.5 rounded-xl text-left bg-[#122023] hover:bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)] hover:border-[#E4201B] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#F8F9FA] group-hover:text-[#E4201B]">
                  <span>Rapid-Drain Velocity Spike (5x ₹45k off-ramps)</span>
                  <span className="font-mono text-[10px] text-[#E4201B]">[HARD BLOCK]</span>
                </div>
                <p className="text-[11px] text-[#C5BDB7] mt-0.5">
                  Test autonomous quarantine when rapid bot off-ramps are triggered.
                </p>
              </button>

              <button
                onClick={() => handleSimulateAttack('SCENARIO-2')}
                className="w-full p-3.5 rounded-xl text-left bg-[#122023] hover:bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)] hover:border-[#FE7E3C] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#F8F9FA] group-hover:text-[#FE7E3C]">
                  <span>Impossible Geolocation Hop (Tokyo POS swipe)</span>
                  <span className="font-mono text-[10px] text-[#FE7E3C]">[STEP-UP MFA]</span>
                </div>
                <p className="text-[11px] text-[#C5BDB7] mt-0.5">
                  Test adaptive MFA challenge when geolocation jumps 6,000km in minutes.
                </p>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* All Transactions Modal */}
      <Modal
        isOpen={isAllTxModalOpen}
        onClose={() => setIsAllTxModalOpen(false)}
        title="Consensus Ledger Audit"
        description="Comprehensive immutable list of all signed transactions."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.35)]">
            <span className="font-mono text-xs text-[#C5BDB7]">
              Showing {filteredTransactions.length} recorded blocks
            </span>
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                onClick={() => setTxFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  txFilter === 'ALL'
                    ? 'bg-[#FE7E3C] text-[#1A2C30] font-bold'
                    : 'text-[#C5BDB7] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTxFilter('SAFE')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  txFilter === 'SAFE'
                    ? 'bg-[#10B981] text-[#1A2C30] font-bold'
                    : 'text-[#C5BDB7] hover:text-white'
                }`}
              >
                Safe
              </button>
              <button
                onClick={() => setTxFilter('SUSPICIOUS')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  txFilter === 'SUSPICIOUS'
                    ? 'bg-[#E4201B] text-white font-bold'
                    : 'text-[#C5BDB7] hover:text-white'
                }`}
              >
                Suspicious
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.3)] hover:border-[rgba(254,126,60,0.35)] transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F8F9FA]">{tx.receiverName}</span>
                    <span className="font-mono text-[10px] text-[#FE7E3C]">{tx.receiverVpa}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#C5BDB7]">
                    {tx.id} • {formatDate(tx.timestamp)}
                  </span>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className="font-mono font-bold text-sm text-[#F8F9FA] block">
                      {formatCurrency(tx.amount)}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        tx.riskAssessment.score > 70 ? 'text-[#E4201B]' : 'text-[#10B981]'
                      }`}
                    >
                      Score {tx.riskAssessment.score}/100
                    </span>
                  </div>
                  <StatusBadge status={tx.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
