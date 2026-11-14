'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardTopBar } from '@/components/layout/DashboardTopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Transaction, TransactionStatus, RiskLevel } from '@/lib/types';
import { api } from '@/lib/api';
import { TransactionDetailDrawer } from '@/components/transactions/TransactionDetailDrawer';

export default function TransactionsPage() {
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('all');
  const [referenceTime, setReferenceTime] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setReferenceTime(Date.now());
  }, []);

  // Drawer state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.getTransactions({ limit: 100 });
      setTransactions(Array.isArray(res?.transactions) ? res.transactions : []);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to retrieve transaction stream from consensus ledger.');
      toastError('Could not load transactions. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter computation
  const filteredTransactions = useMemo(() => {
    const list = Array.isArray(transactions) ? transactions : [];
    return list.filter((tx) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = tx.id.toLowerCase().includes(q);
        const matchesUtr = tx.utr.toLowerCase().includes(q);
        const matchesReceiverName = tx.receiverName.toLowerCase().includes(q);
        const matchesReceiverVpa = tx.receiverVpa.toLowerCase().includes(q);
        const matchesSenderName = tx.senderName.toLowerCase().includes(q);
        const matchesSenderVpa = tx.senderVpa.toLowerCase().includes(q);
        const matchesNote = tx.note?.toLowerCase().includes(q);

        if (
          !matchesId &&
          !matchesUtr &&
          !matchesReceiverName &&
          !matchesReceiverVpa &&
          !matchesSenderName &&
          !matchesSenderVpa &&
          !matchesNote
        ) {
          return false;
        }
      }

      // Status match
      if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
        return false;
      }

      // Risk match
      if (riskFilter !== 'ALL' && tx.riskAssessment.level !== riskFilter) {
        return false;
      }

      // Date range match
      if (dateRange !== 'all' && referenceTime > 0) {
        const txDate = new Date(tx.timestamp).getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (dateRange === 'today' && referenceTime - txDate > oneDay) return false;
        if (dateRange === '7d' && referenceTime - txDate > 7 * oneDay) return false;
        if (dateRange === '30d' && referenceTime - txDate > 30 * oneDay) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, statusFilter, riskFilter, dateRange, referenceTime]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage]);

  // Aggregate stats
  const stats = useMemo(() => {
    let sent = 0;
    let received = 0;
    let flagged = 0;

    transactions.forEach((tx) => {
      if (tx.senderVpa === 'aarav@aegis' && tx.status === 'SUCCESS') {
        sent += tx.amount;
      } else if (tx.receiverVpa === 'aarav@aegis' && tx.status === 'SUCCESS') {
        received += tx.amount;
      }
      if (tx.isSuspicious || tx.riskAssessment.score > 60) {
        flagged += 1;
      }
    });

    return {
      totalCount: transactions.length,
      totalSent: sent,
      totalReceived: received,
      flaggedCount: flagged,
    };
  }, [transactions]);

  // CSV Export with Formula Injection Sanitization
  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) {
      toastError('No transactions available to export with current filters.');
      return;
    }

    // Security Sanitizer: Prevent CSV injection
    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=\+\-@]/.test(str)) {
        str = `'${str}`; // Prefix quote to neutralize spreadsheet execution
      }
      return `"${str}"`;
    };

    const headers = [
      'Transaction ID',
      'Date Time (ISO)',
      'Recipient Name',
      'Recipient VPA',
      'Sender Name',
      'Sender VPA',
      'Amount (INR)',
      'Status',
      'Risk Score',
      'Risk Level',
      'Decision',
      'UTR',
      'Block Hash',
    ];

    const rows = filteredTransactions.map((tx) => [
      sanitize(tx.id),
      sanitize(tx.timestamp),
      sanitize(tx.receiverName),
      sanitize(tx.receiverVpa),
      sanitize(tx.senderName),
      sanitize(tx.senderVpa),
      sanitize(tx.amount),
      sanitize(tx.status),
      sanitize(tx.riskAssessment.score),
      sanitize(tx.riskAssessment.level),
      sanitize(tx.riskAssessment.decision),
      sanitize(tx.utr),
      sanitize(tx.blockHash),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `guardianpay-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success(`Exported ${filteredTransactions.length} transactions cleanly to CSV.`);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setRiskFilter('ALL');
    setDateRange('all');
    setCurrentPage(1);
  };

  const isFiltered = searchQuery !== '' || statusFilter !== 'ALL' || riskFilter !== 'ALL' || dateRange !== 'all';

  return (
    <AppShell>
      <DashboardTopBar userName="Aarav Mehta" userVpa="aarav@aegis" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FE7E3C]/10 border border-[#FE7E3C]/25 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FE7E3C] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#FE7E3C] uppercase font-bold">
                AUDITED LEDGER LOGS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-[#F8F9FA]">
              Transaction Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#C5BDB7] mt-1">
              Track every payment. Understand every decision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={fetchTransactions}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </GlowButton>
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5 mr-1.5" />}
            >
              Export CSV
            </GlowButton>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
            <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
              Total Transactions
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-black text-[#F8F9FA]">
                {isLoading ? '...' : stats.totalCount}
              </span>
              <span className="text-[10px] font-mono text-[#FE7E3C]">Ledger entries</span>
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
            <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
              Total Outflows
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-black text-[#F8F9FA]">
                ₹{isLoading ? '...' : stats.totalSent.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-mono text-[#E4201B]">Debits</span>
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
            <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
              Total Inflows
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-black text-[#F8F9FA]">
                ₹{isLoading ? '...' : stats.totalReceived.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-mono text-[#10B981]">Credits</span>
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-[rgba(97,65,60,0.35)]">
            <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
              Flagged Anomalies
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-black text-[#FE7E3C]">
                {isLoading ? '...' : stats.flaggedCount}
              </span>
              <span className="text-[10px] font-mono text-[#FE7E3C]">Quarantined</span>
            </div>
          </GlassCard>
        </div>

        {/* Filter Bar */}
        <GlassCard className="p-4 sm:p-5 border-[rgba(97,65,60,0.35)] space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#C5BDB7] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transaction ID, UTR, recipient, or VPA..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs text-[#F8F9FA] placeholder-[#C5BDB7] focus:outline-none focus:border-[#FE7E3C] focus:ring-1 focus:ring-[#FE7E3C]/40 font-mono"
              />
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C] font-mono cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="AUTHORIZED">Authorized / Held</option>
                <option value="FAILED">Blocked / Failed</option>
                <option value="REVERSED">Reversed</option>
              </select>

              {/* Risk Level */}
              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C] font-mono cursor-pointer"
              >
                <option value="ALL">All Risk</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical</option>
              </select>

              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C] font-mono cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Clear */}
              {isFiltered && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-[#FF3B5C] hover:bg-[#FF3B5C]/10 border border-[#FF3B5C]/20 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Content Section: Table / Cards */}
        {isLoading ? (
          <GlassCard className="p-6 border-[rgba(0,229,255,0.12)] space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </GlassCard>
        ) : loadError ? (
          <GlassCard className="p-8 text-center border-[#FF3B5C]/30 bg-[#FF3B5C]/5">
            <AlertTriangle className="w-10 h-10 text-[#FF3B5C] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#F2FAFF] mb-1">Ledger Stream Error</h3>
            <p className="text-xs text-[#9BB3C9] mb-4 max-w-md mx-auto">{loadError}</p>
            <GlowButton variant="secondary" size="sm" onClick={fetchTransactions}>
              Retry Connection
            </GlowButton>
          </GlassCard>
        ) : filteredTransactions.length === 0 ? (
          <GlassCard className="p-12 text-center border-[rgba(0,229,255,0.1)]">
            <EmptyState
              title={isFiltered ? 'No matching transactions' : 'No transactions recorded'}
              description={
                isFiltered
                  ? 'Try widening your search terms or clearing active filters.'
                  : 'Start by making a simulated transfer or requesting funds.'
              }
              actionLabel={isFiltered ? 'Clear Filters' : 'Send Money'}
              onAction={isFiltered ? handleClearFilters : () => (window.location.href = '/send')}
            />
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-[rgba(97,65,60,0.35)] bg-[#0E6873]/15 backdrop-blur-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#122023] border-b border-[rgba(97,65,60,0.35)] text-[10px] font-mono uppercase text-[#C5BDB7]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Tx ID</th>
                    <th className="py-3.5 px-4 font-semibold">Counterparty</th>
                    <th className="py-3.5 px-4 font-semibold">Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold">Risk Score</th>
                    <th className="py-3.5 px-4 font-semibold">Policy Decision</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(97,65,60,0.2)]">
                  {paginatedTransactions.map((tx) => {
                    const isOutgoing = tx.senderVpa === 'aarav@aegis';
                    const score = tx.riskAssessment.score;

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="group hover:bg-[#FE7E3C]/5 transition-colors cursor-pointer"
                      >
                        {/* ID */}
                        <td className="py-3.5 px-4 font-mono font-medium text-[#F8F9FA]">
                          <span className="text-[#FE7E3C] group-hover:underline">{tx.id}</span>
                          <span className="block text-[10px] text-[#C5BDB7] font-mono">
                            UTR {tx.utr.slice(-6)}
                          </span>
                        </td>

                        {/* Counterparty */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isOutgoing
                                  ? 'bg-[#E4201B]/10 text-[#E4201B]'
                                  : 'bg-[#10B981]/10 text-[#10B981]'
                              }`}
                            >
                              {isOutgoing ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-[#F8F9FA] block truncate">
                                {isOutgoing ? tx.receiverName : tx.senderName}
                              </span>
                              <span className="text-[10px] font-mono text-[#C5BDB7] block truncate">
                                {isOutgoing ? tx.receiverVpa : tx.senderVpa}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          <span className={isOutgoing ? 'text-[#F8F9FA]' : 'text-[#10B981]'}>
                            {isOutgoing ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-[#C5BDB7] font-mono text-[11px]">
                          {new Date(tx.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          <span className="text-[#C5BDB7]">
                            {new Date(tx.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={tx.status} size="sm" />
                        </td>

                        {/* Risk Score */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                score > 80
                                  ? 'bg-[#E4201B]'
                                  : score > 60
                                  ? 'bg-[#FE7E3C]'
                                  : score > 30
                                  ? 'bg-[#FE7E3C]'
                                  : 'bg-[#10B981]'
                              }`}
                            />
                            <span className="text-xs font-semibold text-[#F8F9FA]">{score}</span>
                            <span className="text-[10px] text-[#C5BDB7]">/100</span>
                          </div>
                        </td>

                        {/* Decision */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              tx.riskAssessment.decision === 'BLOCK'
                                ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                                : tx.riskAssessment.decision === 'HOLD'
                                ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                                : tx.riskAssessment.decision === 'STEP_UP'
                                ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                                : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                            }`}
                          >
                            {tx.riskAssessment.decision}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(tx);
                            }}
                            className="p-1.5 rounded-lg text-[#C5BDB7] hover:text-[#FE7E3C] hover:bg-[#FE7E3C]/10 transition-colors"
                            title="Inspect Block & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {paginatedTransactions.map((tx) => {
                const isOutgoing = tx.senderVpa === 'aarav@aegis';
                const score = tx.riskAssessment.score;

                return (
                  <GlassCard
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="p-4 border-[rgba(97,65,60,0.35)] active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isOutgoing
                              ? 'bg-[#E4201B]/10 text-[#E4201B]'
                              : 'bg-[#10B981]/10 text-[#10B981]'
                          }`}
                        >
                          {isOutgoing ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-[#F2FAFF]">
                            {isOutgoing ? tx.receiverName : tx.senderName}
                          </p>
                          <p className="font-mono text-[10px] text-[#9BB3C9]">
                            {isOutgoing ? tx.receiverVpa : tx.senderVpa}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-mono font-bold text-sm ${isOutgoing ? 'text-[#F2FAFF]' : 'text-[#00FF9C]'}`}>
                          {isOutgoing ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="font-mono text-[10px] text-[#607C98]">
                          {new Date(tx.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[rgba(97,65,60,0.2)] text-[11px]">
                      <StatusBadge status={tx.status} size="sm" />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#C5BDB7]">
                          Risk: <strong className="text-[#F8F9FA]">{score}</strong>
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            tx.riskAssessment.decision === 'BLOCK'
                              ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                              : tx.riskAssessment.decision === 'HOLD'
                              ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                              : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                          }`}
                        >
                          {tx.riskAssessment.decision}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-3 px-1 text-xs font-mono text-[#C5BDB7]">
              <div>
                Showing{' '}
                <strong className="text-[#F8F9FA]">
                  {Math.min(filteredTransactions.length, (currentPage - 1) * pageSize + 1)}
                </strong>{' '}
                to{' '}
                <strong className="text-[#F8F9FA]">
                  {Math.min(filteredTransactions.length, currentPage * pageSize)}
                </strong>{' '}
                of <strong className="text-[#FE7E3C]">{filteredTransactions.length}</strong> transactions
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#FE7E3C] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#FE7E3C] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Slide-Over Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </AppShell>
  );
}
