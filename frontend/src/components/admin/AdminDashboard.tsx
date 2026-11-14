'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Terminal,
  Activity,
  AlertTriangle,
  Radio,
  History,
  TrendingUp,
  Layers,
  Flame,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  ArrowUpRight,
  LogOut,
  Users,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import AnimatedGrid from '@/components/background/AnimatedGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { HashChip } from '@/components/ui/HashChip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { Transaction, FraudScenario, AuditEntry, RiskLevel } from '@/lib/types';

import { AttackSimulatorPanel } from '@/components/admin/AttackSimulatorPanel';
import { RiskHeatmap } from '@/components/admin/RiskHeatmap';
import { InvestigationDrawer } from '@/components/admin/InvestigationDrawer';
import { LedgerIntegrityPanel } from '@/components/admin/LedgerIntegrityPanel';
import { useRiskTint } from '@/lib/RiskTintContext';

interface AdminDashboardProps {
  initialTab?: 'overview' | 'feed' | 'simulator' | 'users' | 'queue' | 'audit' | 'ledger' | 'analytics';
}

export function AdminDashboard({ initialTab = 'overview' }: AdminDashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { success, warning, error: toastError } = useToast();
  const { setRiskTint } = useRiskTint();

  // Authentication check (Demonstration role simulation)
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (pathname.includes('/fraud-monitoring')) return 'feed';
    if (pathname.includes('/attack-simulator')) return 'simulator';
    if (pathname.includes('/users')) return 'users';
    if (pathname.includes('/transactions')) return 'queue';
    if (pathname.includes('/audit')) return 'audit';
    return initialTab;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scenarios, setScenarios] = useState<FraudScenario[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  // Simulated Enrolled Users for User Management
  const [managedUsers, setManagedUsers] = useState([
    {
      id: 'USR-8901',
      name: 'Aarav Mehta',
      vpa: 'aarav@aegis',
      kyc: 'VERIFIED',
      riskTier: 'LOW',
      balance: 84250,
      status: 'ACTIVE',
      device: 'MacBook Pro (Apple Silicon)',
    },
    {
      id: 'USR-8902',
      name: 'Priya Sharma',
      vpa: 'priya.s@guardianpay',
      kyc: 'VERIFIED',
      riskTier: 'LOW',
      balance: 31200,
      status: 'ACTIVE',
      device: 'iPhone 15 Pro (iOS 18.2)',
    },
    {
      id: 'USR-8903',
      name: 'Vikram Singh',
      vpa: 'vikram.singh@bank',
      kyc: 'PENDING',
      riskTier: 'MEDIUM',
      balance: 14500,
      status: 'ACTIVE',
      device: 'Samsung Galaxy S24 (Android 14)',
    },
    {
      id: 'USR-8904',
      name: 'Devraj Kapoor (Flagged)',
      vpa: 'devraj.k@unverified',
      kyc: 'REJECTED',
      riskTier: 'CRITICAL',
      balance: 4200,
      status: 'FROZEN',
      device: 'Unknown Linux Proxy',
    },
  ]);

  // Live Stream Feed Simulation
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(true);
  const [feedRiskFilter, setFeedRiskFilter] = useState<string>('ALL');
  const [feedDecisionFilter, setFeedDecisionFilter] = useState<string>('ALL');

  // Drawer
  const [investigatingTx, setInvestigatingTx] = useState<Transaction | null>(null);

  // Admin Analytics & KPIs
  const [analytics, setAnalytics] = useState<{
    kpis: {
      totalTransactions: number;
      flaggedTransactions: number;
      blockedTransactions: number;
      averageRiskScore: number;
      ledgerIntegrity: 'VERIFIED' | 'TAMPERED';
    };
    riskDistribution: Array<{
      name: string;
      level: RiskLevel;
      count: number;
      percentage: number;
      color: string;
    }>;
    hourlyHeatmap: Array<{
      day: string;
      hour: number;
      intensity: number;
      count: number;
    }>;
  }>({
    kpis: {
      totalTransactions: 40,
      flaggedTransactions: 6,
      blockedTransactions: 3,
      averageRiskScore: 32,
      ledgerIntegrity: 'VERIFIED',
    },
    riskDistribution: [
      { name: 'Low Risk', level: 'LOW', count: 28, percentage: 70, color: '#10B981' },
      { name: 'Medium Risk', level: 'MEDIUM', count: 7, percentage: 17, color: '#FE7E3C' },
      { name: 'High Risk', level: 'HIGH', count: 3, percentage: 8, color: '#D9531E' },
      { name: 'Critical Risk', level: 'CRITICAL', count: 2, percentage: 5, color: '#E4201B' },
    ],
    hourlyHeatmap: [],
  });

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [txRes, feedRes, analyticsRes] = await Promise.all([
        api.getTransactions({ limit: 40 }),
        api.getAdminFeed(),
        api.getAdminAnalytics(),
      ]);

      setTransactions(Array.isArray(txRes?.transactions) ? txRes.transactions : []);
      setScenarios(Array.isArray(feedRes?.scenarios) ? feedRes.scenarios : []);
      setAuditLogs(Array.isArray(feedRes?.auditLogs) ? feedRes.auditLogs : []);
      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }
    } catch {
      toastError('SecOps connection fault. Retrying handshake.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Sync tab with route if route changes
  useEffect(() => {
    if (pathname.includes('/fraud-monitoring')) setActiveTab('feed');
    else if (pathname.includes('/attack-simulator')) setActiveTab('simulator');
    else if (pathname.includes('/users')) setActiveTab('users');
    else if (pathname.includes('/transactions')) setActiveTab('queue');
    else if (pathname.includes('/audit')) setActiveTab('audit');
    else if (pathname === '/admin') setActiveTab('overview');
  }, [pathname]);

  // Filtered Live Feed
  const filteredFeed = useMemo(() => {
    return transactions.filter((t) => {
      if (feedRiskFilter !== 'ALL' && t.riskAssessment.level !== feedRiskFilter) return false;
      if (feedDecisionFilter !== 'ALL' && t.riskAssessment.decision !== feedDecisionFilter) return false;
      return true;
    });
  }, [transactions, feedRiskFilter, feedDecisionFilter]);

  // Flagged queue
  const flaggedQueue = useMemo(() => {
    return transactions.filter(
      (t) => t.isSuspicious || t.riskAssessment.score > 50 || t.status === 'AUTHORIZED'
    );
  }, [transactions]);

  // Callback when attack simulator intercepts a transaction
  const handleAttackIntercepted = (tx: Transaction) => {
    // Cross-fade background glow to danger/red briefly
    setRiskTint('danger', 4000);

    // Toast whenever a BLOCK event arrives
    if (tx.riskAssessment.decision === 'BLOCK') {
      warning('THREAT BLOCKED: Immediate Neutralization', `Interception on ${tx.id} (${tx.receiverVpa}). Defensive restrictions engaged.`);
    }

    setTransactions((prev) => [tx, ...prev]);
    setAnalytics((prev) => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        totalTransactions: prev.kpis.totalTransactions + 1,
        flaggedTransactions: prev.kpis.flaggedTransactions + 1,
        blockedTransactions:
          tx.riskAssessment.decision === 'BLOCK'
            ? prev.kpis.blockedTransactions + 1
            : prev.kpis.blockedTransactions,
      },
    }));
  };

  const handleTransactionUpdated = (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    fetchAdminData();
  };

  const handleToggleUserStatus = (userId: string) => {
    setManagedUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
          if (newStatus === 'FROZEN') {
            warning('Account Locked', `Defensive restrictions applied to ${u.name}`);
          } else {
            success('Account Re-activated', `Access restored for ${u.name}`);
          }
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  // Unauthorized Screen
  if (!isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-[#1A2C30] text-[#F8F9FA] flex items-center justify-center p-6 relative">
        <AnimatedGrid />
        <GlassCard className="max-w-md p-8 text-center border-[#E4201B]/40 space-y-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#E4201B]/15 border border-[#E4201B]/40 flex items-center justify-center mx-auto text-[#E4201B]">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-display font-black tracking-tight text-[#F8F9FA]">
            Access Restricted: Role Unauthorized
          </h2>
          <p className="text-xs text-[#C5BDB7] leading-relaxed">
            The SecOps Control Centre requires elevated Security Officer credentials. Your active session does not possess <span className="font-mono text-[#FE7E3C]">ROLE_SECOPS_ADMIN</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <GlowButton
              variant="primary"
              size="sm"
              onClick={() => setIsAdminAuthorized(true)}
              className="w-full"
            >
              Simulate Authorized SecOps Login
            </GlowButton>
            <Link href="/dashboard" className="text-xs font-mono text-[#C5BDB7] hover:underline">
              Return to User Dashboard
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Admin Navigation Items in strict accordance with PART 7:
  // - Admin Overview
  // - Fraud Monitoring
  // - Attack Simulator
  // - User Management
  // - Transaction Investigation
  // - Audit & Ledger Explorer
  const adminNavItems = [
    { id: 'overview', name: 'Admin Overview', href: '/admin', icon: Activity },
    { id: 'feed', name: 'Fraud Monitoring', href: '/admin/fraud-monitoring', icon: Radio },
    { id: 'simulator', name: 'Attack Simulator', href: '/admin/attack-simulator', icon: Flame },
    { id: 'users', name: 'User Management', href: '/admin/users', icon: Users },
    { id: 'queue', name: 'Transaction Investigation', href: '/admin/transactions', icon: AlertTriangle, count: flaggedQueue.length },
    { id: 'audit', name: 'Audit & Ledger Explorer', href: '/admin/audit', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#1A2C30] text-[#F8F9FA] flex flex-col lg:flex-row relative">
      <AnimatedGrid />

      {/* Dedicated SecOps Admin Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#122023]/95 border-r border-[rgba(97,65,60,0.35)] backdrop-blur-2xl p-5 select-none z-30">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6 px-1">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#E4201B]/15 border border-[#E4201B]/40 shadow-[0_0_15px_rgba(228,32,27,0.3)]">
            <Terminal className="w-5 h-5 text-[#E4201B]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-sm tracking-wider text-[#F8F9FA]">
              SECOPS<span className="text-[#FE7E3C]">COMMAND</span>
            </span>
            <span className="font-mono text-[8px] tracking-widest text-[#E4201B] uppercase font-bold">
              FRAUD RADAR v4.2
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#C5BDB7] block mb-1">
            Admin Navigation
          </span>

          {adminNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FE7E3C]/20 to-[#E4201B]/10 text-[#FE7E3C] border border-[#FE7E3C]/40 shadow-[0_0_15px_rgba(254,126,60,0.2)] font-semibold'
                    : 'text-[#C5BDB7] hover:text-[#F8F9FA] hover:bg-[#0E6873]/20 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#FE7E3C]' : 'text-[#C5BDB7]'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E4201B]/20 text-[#E4201B] border border-[#E4201B]/30">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Role Status Card */}
        <div className="p-3 rounded-xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] mb-3 space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Auth Clearance:</span>
            <span className="text-[#10B981] font-bold">SECOPS-L3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#C5BDB7]">Harness Mode:</span>
            <span className="text-[#FE7E3C]">SANDBOX</span>
          </div>
        </div>

        {/* Return to User Wallet */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs text-[#C5BDB7] hover:text-[#FE7E3C] hover:bg-[#0E6873]/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit to User Wallet</span>
        </Link>
      </aside>

      {/* Main Operations Area */}
      <main className="flex-1 min-w-0 relative z-10 pb-16">
        {/* Top Control Bar */}
        <header className="sticky top-0 z-20 bg-[#1A2C30]/85 backdrop-blur-2xl border-b border-[rgba(97,65,60,0.35)] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono text-xs font-bold text-[#F8F9FA] tracking-wider uppercase">
                ADMIN CONTROL CENTRE
              </span>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded font-mono text-[9px] font-bold text-[#FE7E3C] bg-[#FE7E3C]/10 border border-[#FE7E3C]/30">
              DEMO SIMULATION ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Lock / Test Unauthorized toggle */}
            <button
              onClick={() => setIsAdminAuthorized(false)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#122023] border border-white/10 text-[10px] font-mono text-[#C5BDB7] hover:text-[#E4201B] transition-colors"
              title="Test role gate enforcement"
            >
              <Lock className="w-3 h-3" />
              <span>Simulate Unauthorized</span>
            </button>

            {/* Officer Profile Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FE7E3C] to-[#E4201B] flex items-center justify-center text-[10px] font-black text-[#1A2C30]">
                OP
              </div>
              <div className="hidden sm:block text-left text-xs font-mono">
                <span className="text-[#F8F9FA] font-bold block leading-none">SecOps Lead</span>
                <span className="text-[9px] text-[#FE7E3C]">SEC-0941</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* 1. Five Major KPIs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
              <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
                Total Transactions
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-[#F8F9FA]">
                  {analytics.kpis.totalTransactions}
                </span>
                <span className="text-[10px] font-mono text-[#FE7E3C]">Live blocks</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
              <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
                Flagged Anomalies
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-[#FE7E3C]">
                  {analytics.kpis.flaggedTransactions}
                </span>
                <span className="text-[10px] font-mono text-[#FE7E3C]">Quarantined</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
              <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
                Threats Blocked
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-[#E4201B]">
                  {analytics.kpis.blockedTransactions}
                </span>
                <span className="text-[10px] font-mono text-[#E4201B]">Neutralized</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
              <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
                Average Risk Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-[#F8F9FA]">
                  {analytics.kpis.averageRiskScore}
                </span>
                <span className="text-[10px] font-mono text-[#C5BDB7]">/100</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4 border-[rgba(97,65,60,0.35)] col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
                Ledger Integrity
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span
                  className={`text-base font-mono font-bold flex items-center gap-1 ${
                    analytics.kpis.ledgerIntegrity === 'TAMPERED'
                      ? 'text-[#E4201B]'
                      : 'text-[#10B981]'
                  }`}
                >
                  {analytics.kpis.ledgerIntegrity === 'TAMPERED' ? (
                    <>
                      <XCircle className="w-4 h-4 text-[#E4201B]" />
                      COMPROMISED
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      VERIFIED
                    </>
                  )}
                </span>
              </div>
            </GlassCard>
          </div>

          {/* VIEW: ATTACK SIMULATOR */}
          {(activeTab === 'simulator' || activeTab === 'overview') && (
            <div id="simulator">
              <AttackSimulatorPanel
                scenarios={scenarios}
                onAttackIntercepted={handleAttackIntercepted}
                onOpenInvestigation={(tx) => setInvestigatingTx(tx)}
              />
            </div>
          )}

          {/* VIEW: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div id="users">
              <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(97,65,60,0.3)]">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#FE7E3C]" />
                    <div>
                      <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                        User Management &amp; Wallet Custody
                      </h3>
                      <p className="text-xs text-[#C5BDB7]">
                        Monitor enrolled simulation wallets, KYC standings, and administrative restrictions.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30 font-semibold">
                    {managedUsers.length} WALLETS ENROLLED
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[rgba(97,65,60,0.3)]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#122023] border-b border-[rgba(97,65,60,0.3)] text-[10px] uppercase text-[#C5BDB7]">
                      <tr>
                        <th className="py-3 px-3.5">User ID</th>
                        <th className="py-3 px-3.5">Account Name</th>
                        <th className="py-3 px-3.5">VPA Handle</th>
                        <th className="py-3 px-3.5">KYC Tier</th>
                        <th className="py-3 px-3.5">Risk Rating</th>
                        <th className="py-3 px-3.5">Balance</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5 text-right">Custodian Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {managedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-[#FE7E3C]/5 transition-colors">
                          <td className="py-3 px-3.5 font-bold text-[#FE7E3C]">{user.id}</td>
                          <td className="py-3 px-3.5 text-[#F8F9FA]">{user.name}</td>
                          <td className="py-3 px-3.5 text-[#C5BDB7]">{user.vpa}</td>
                          <td className="py-3 px-3.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                              {user.kyc}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                user.riskTier === 'CRITICAL'
                                  ? 'bg-[#E4201B]/20 text-[#E4201B] border border-[#E4201B]/30'
                                  : user.riskTier === 'MEDIUM'
                                  ? 'bg-[#FE7E3C]/20 text-[#FE7E3C] border border-[#FE7E3C]/30'
                                  : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                              }`}
                            >
                              {user.riskTier}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 font-bold text-[#F8F9FA]">
                            ₹{user.balance.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                user.status === 'FROZEN'
                                  ? 'text-[#E4201B] bg-[#E4201B]/15 border border-[#E4201B]/30'
                                  : 'text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30'
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(user.id)}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ml-auto ${
                                user.status === 'ACTIVE'
                                  ? 'bg-[#E4201B]/10 border-[#E4201B]/30 text-[#E4201B] hover:bg-[#E4201B]/20'
                                  : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20'
                              }`}
                            >
                              {user.status === 'ACTIVE' ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Lock Wallet</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Unlock</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}

          {/* VIEW: LIVE FEED & RISK DISTRIBUTION */}
          {(activeTab === 'feed' || activeTab === 'overview') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="feed">
              {/* Live Feed (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <GlassCard className="p-5 border-[rgba(97,65,60,0.35)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(97,65,60,0.3)]">
                    <div className="flex items-center gap-2">
                      <Radio className={`w-4 h-4 ${isLiveStreamActive ? 'text-[#10B981] animate-pulse' : 'text-[#C5BDB7]'}`} />
                      <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                        Fraud Monitoring Live Stream
                      </h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-mono text-[9px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                        <span>LIVE</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
                        className="px-2.5 py-1 rounded-lg bg-[#122023] border border-white/10 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors flex items-center gap-1.5"
                      >
                        {isLiveStreamActive ? (
                          <>
                            <Pause className="w-3 h-3 text-[#FE7E3C]" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 text-[#10B981]" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Filter selectors */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-[#C5BDB7]">Filter:</span>
                    <select
                      value={feedRiskFilter}
                      onChange={(e) => setFeedRiskFilter(e.target.value)}
                      className="px-2 py-1 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-lg text-xs text-[#F8F9FA] focus:outline-none"
                    >
                      <option value="ALL">All Risk Tiers</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>

                    <select
                      value={feedDecisionFilter}
                      onChange={(e) => setFeedDecisionFilter(e.target.value)}
                      className="px-2 py-1 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-lg text-xs text-[#F8F9FA] focus:outline-none"
                    >
                      <option value="ALL">All Decisions</option>
                      <option value="ALLOW">Allow</option>
                      <option value="STEP_UP">Step-Up</option>
                      <option value="HOLD">Hold</option>
                      <option value="BLOCK">Block</option>
                    </select>
                  </div>

                  {/* Feed Rows with Slide-in & Highlight */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {filteredFeed.slice(0, 8).map((tx) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -12, backgroundColor: 'rgba(254,126,60,0.2)' }}
                        animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(18,32,35,0.6)' }}
                        transition={{ duration: 0.4 }}
                        onClick={() => setInvestigatingTx(tx)}
                        className="p-3 rounded-xl border border-[rgba(97,65,60,0.25)] hover:border-[#FE7E3C]/40 hover:bg-[#0E6873]/20 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              tx.riskAssessment.score > 80
                                ? 'bg-[#E4201B]'
                                : tx.riskAssessment.score > 60
                                ? 'bg-[#FE7E3C]'
                                : 'bg-[#10B981]'
                            }`}
                          />
                          <div>
                            <span className="font-mono font-bold text-[#F8F9FA] block">
                              {tx.id}
                            </span>
                            <span className="text-[10px] text-[#C5BDB7] font-mono">
                              {tx.senderVpa} → {tx.receiverVpa}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="font-bold text-[#F8F9FA] block">
                            ₹{tx.amount.toLocaleString('en-IN')}
                          </span>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-[10px] text-[#C5BDB7]">
                              Score: <strong className="text-[#FE7E3C]">{tx.riskAssessment.score}</strong>
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                tx.riskAssessment.decision === 'BLOCK'
                                  ? 'text-[#E4201B] bg-[#E4201B]/15'
                                  : tx.riskAssessment.decision === 'HOLD'
                                  ? 'text-[#FE7E3C] bg-[#FE7E3C]/15'
                                  : 'text-[#10B981] bg-[#10B981]/15'
                              }`}
                            >
                              {tx.riskAssessment.decision}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </div>

              {/* Risk Distribution Chart (5 cols) */}
              <div className="lg:col-span-5 space-y-4" id="analytics">
                <GlassCard className="p-5 border-[rgba(97,65,60,0.35)] space-y-4">
                  <div className="pb-3 border-b border-[rgba(97,65,60,0.3)]">
                    <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                      Neural Risk Tier Distribution
                    </h3>
                    <p className="text-xs text-[#C5BDB7] mt-0.5">
                      Categorized transactions by calibrated threat rating.
                    </p>
                  </div>

                  {/* Recharts Donut */}
                  <div className="h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.riskDistribution}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                        >
                          {analytics.riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#1A2C30" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#122023',
                            borderColor: 'rgba(97,65,60,0.35)',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Breakdown Legend Bars */}
                  <div className="space-y-2 text-xs font-mono">
                    {analytics.riskDistribution.map((tier) => (
                      <div key={tier.level} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: tier.color }} />
                          <span className="text-[#C5BDB7]">{tier.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#F8F9FA] font-bold">{tier.count} txns</span>
                          <span className="text-[10px] text-[#C5BDB7]">({tier.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* Hourly Risk Heatmap */}
          {(activeTab === 'overview' || activeTab === 'feed') && (
            <RiskHeatmap data={analytics.hourlyHeatmap} />
          )}

          {/* VIEW: TRANSACTION INVESTIGATION / FLAGGED QUEUE */}
          {(activeTab === 'queue' || activeTab === 'overview') && (
            <div id="queue">
              <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(97,65,60,0.3)]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#FE7E3C]" />
                    <div>
                      <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                        Transaction Investigation Queue ({flaggedQueue.length})
                      </h3>
                      <p className="text-xs text-[#C5BDB7]">
                        Payments triggering autonomous threshold alerts requiring SecOps review.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-[#FE7E3C] bg-[#FE7E3C]/10 px-2 py-0.5 rounded border border-[#FE7E3C]/30 font-semibold">
                    TRIAGE REQUIRED
                  </span>
                </div>

                {flaggedQueue.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#C5BDB7] font-mono">
                    Zero flagged transactions pending triage. All payments operating within baseline.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[rgba(97,65,60,0.3)]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#122023] border-b border-[rgba(97,65,60,0.3)] text-[10px] uppercase text-[#C5BDB7]">
                        <tr>
                          <th className="py-3 px-3.5">Tx ID</th>
                          <th className="py-3 px-3.5">Sender</th>
                          <th className="py-3 px-3.5">Recipient</th>
                          <th className="py-3 px-3.5">Amount</th>
                          <th className="py-3 px-3.5">Score</th>
                          <th className="py-3 px-3.5">Top Anomaly</th>
                          <th className="py-3 px-3.5">Policy</th>
                          <th className="py-3 px-3.5 text-right">SecOps Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {flaggedQueue.map((tx) => (
                          <tr
                            key={tx.id}
                            className="hover:bg-[#FE7E3C]/5 transition-colors cursor-pointer"
                            onClick={() => setInvestigatingTx(tx)}
                          >
                            <td className="py-3 px-3.5 font-bold text-[#FE7E3C]">
                              {tx.id}
                            </td>
                            <td className="py-3 px-3.5 text-[#F8F9FA] truncate max-w-[120px]">
                              {tx.senderVpa}
                            </td>
                            <td className="py-3 px-3.5 text-[#C5BDB7] truncate max-w-[120px]">
                              {tx.receiverVpa}
                            </td>
                            <td className="py-3 px-3.5 font-bold text-[#F8F9FA]">
                              ₹{tx.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="text-[#E4201B] font-bold">
                                {tx.riskAssessment.score}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-[#C5BDB7] truncate max-w-[180px]">
                              {tx.riskAssessment.reasons[0] || 'Velocity anomaly'}
                            </td>
                            <td className="py-3 px-3.5">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  tx.riskAssessment.decision === 'BLOCK'
                                    ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                                    : 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                                }`}
                              >
                                {tx.riskAssessment.decision}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInvestigatingTx(tx);
                                }}
                                className="px-2 py-1 rounded bg-[#122023] border border-[#FE7E3C]/30 text-[#FE7E3C] hover:bg-[#FE7E3C]/10 text-[10px]"
                              >
                                Investigate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </GlassCard>
            </div>
          )}

          {/* VIEW: CRYPTOGRAPHIC LEDGER VERIFICATION & AUDIT TRAIL */}
          {(activeTab === 'audit' || activeTab === 'overview') && (
            <>
              <div id="ledger">
                <LedgerIntegrityPanel
                  initialStatus={analytics.kpis.ledgerIntegrity}
                  onLedgerUpdated={(status) => {
                    setAnalytics((prev) => ({
                      ...prev,
                      kpis: { ...prev.kpis, ledgerIntegrity: status },
                    }));
                  }}
                />
              </div>

              <div id="audit">
                <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.3)]">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-[#FE7E3C]" />
                      <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                        Audit &amp; Ledger Explorer
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#10B981]">
                      CRYPTOGRAPHIC LOG RECORD
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#122023] border-b border-white/10 text-[10px] text-[#C5BDB7]">
                        <tr>
                          <th className="py-2.5 px-3">Event Action</th>
                          <th className="py-2.5 px-3">Actor</th>
                          <th className="py-2.5 px-3">Target ID</th>
                          <th className="py-2.5 px-3">Details</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3 text-right">Integrity Seal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5">
                            <td className="py-2.5 px-3 font-bold text-[#FE7E3C]">
                              {log.action}
                            </td>
                            <td className="py-2.5 px-3 text-[#F8F9FA]">{log.actor}</td>
                            <td className="py-2.5 px-3 text-[#C5BDB7]">{log.targetId}</td>
                            <td className="py-2.5 px-3 text-[#C5BDB7] truncate max-w-[240px]">
                              {log.details}
                            </td>
                            <td className="py-2.5 px-3 text-[#C5BDB7]">
                              {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <HashChip hash={log.integrityHash} startLength={6} endLength={4} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Investigation Dossier Drawer */}
      <InvestigationDrawer
        transaction={investigatingTx}
        onClose={() => setInvestigatingTx(null)}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </div>
  );
}

export default AdminDashboard;
