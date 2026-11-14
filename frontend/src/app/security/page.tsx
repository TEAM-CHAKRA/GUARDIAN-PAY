'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Globe,
  KeyRound,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
  Clock,
  History,
  Trash2,
  RefreshCw,
  Info,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardTopBar } from '@/components/layout/DashboardTopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { RiskGauge } from '@/components/ui/RiskGauge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashChip } from '@/components/ui/HashChip';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Device, AuditEntry, AdminAlert, Wallet, User } from '@/lib/types';
import { api } from '@/lib/api';

export default function SecurityPage() {
  const { success, error: toastError, warning } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [securityScore, setSecurityScore] = useState(96);
  const [lastLogin, setLastLogin] = useState('Today, 09:14 AM');

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [showPinFields, setShowPinFields] = useState(false);

  // Freeze Modal State
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState('Suspected unauthorized access');
  const [isFreezingAction, setIsFreezingAction] = useState(false);

  // Daily Limit State
  const [dailyLimitInput, setDailyLimitInput] = useState<number>(100000);
  const [isUpdatingLimit, setIsUpdatingLimit] = useState(false);

  const fetchSecurityData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSecurityOverview();
      setWallet(data.wallet);
      setUser(data.user);
      setDevices(data.devices);
      setAuditLogs(data.auditLogs);
      setAlerts(data.alerts);
      setSecurityScore(data.securityScore);
      setLastLogin(data.lastLogin);
      if (data.wallet) {
        setDailyLimitInput(data.wallet.dailyLimit || 100000);
      }
    } catch (err: any) {
      toastError('Failed to load security telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  // Handle Revoke Device
  const handleRevokeDevice = async (deviceId: string, deviceName: string) => {
    try {
      await api.revokeDevice(deviceId);
      success(`Session revoked for ${deviceName}.`);
      fetchSecurityData();
    } catch (err: any) {
      toastError('Could not revoke device session.');
    }
  };

  // Handle PIN Change
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin || !newPin || !confirmPin) {
      toastError('All PIN fields are required.');
      return;
    }

    if (newPin !== confirmPin) {
      toastError('New PIN and confirmation PIN do not match.');
      return;
    }

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      toastError('New UPI PIN must be exactly 6 digits.');
      return;
    }

    setIsChangingPin(true);
    try {
      await api.changePin({ currentPin, newPin, confirmPin });
      success('UPI PIN rotated successfully! Staged into hardware enclave.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      fetchSecurityData();
    } catch (err: any) {
      toastError(err.message || 'Failed to rotate PIN. Check current PIN.');
    } finally {
      setIsChangingPin(false);
    }
  };

  // Handle Wallet Freeze / Unfreeze
  const handleToggleFreeze = async () => {
    if (!wallet) return;
    const targetState = !wallet.isFrozen;
    setIsFreezingAction(true);
    try {
      await api.freezeWallet(wallet.id, targetState);
      if (targetState) {
        warning('Emergency lockdown activated. Outgoing transfers suspended.');
      } else {
        success('Wallet unlocked. Outgoing payment capability restored.');
      }
      setIsFreezeModalOpen(false);
      fetchSecurityData();
    } catch (err: any) {
      toastError('Could not execute wallet state modification.');
    } finally {
      setIsFreezingAction(false);
    }
  };

  // Handle Daily Limit Update
  const handleUpdateLimit = async () => {
    if (!dailyLimitInput || dailyLimitInput < 1000) {
      toastError('Daily limit must be at least ₹1,000.');
      return;
    }

    setIsUpdatingLimit(true);
    try {
      await api.updateDailyLimit(dailyLimitInput);
      success(`Daily spending ceiling updated to ₹${dailyLimitInput.toLocaleString('en-IN')}`);
      fetchSecurityData();
    } catch (err: any) {
      toastError('Failed to update daily velocity limit.');
    } finally {
      setIsUpdatingLimit(false);
    }
  };

  // Resolve Alert
  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveSecurityAlert(alertId);
      success('Security alert acknowledged and resolved.');
      fetchSecurityData();
    } catch (err: any) {
      toastError('Failed to update alert state.');
    }
  };

  const isFrozen = wallet?.isFrozen ?? false;

  return (
    <AppShell>
      <DashboardTopBar userName="Aarav Mehta" userVpa="aarav@aegis" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FE7E3C]/10 border border-[#FE7E3C]/25 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-[#E4201B]' : 'bg-[#10B981]'} animate-pulse`} />
              <span className="text-[10px] font-mono tracking-widest text-[#FE7E3C] uppercase font-bold">
                SECOPS DEFENSE COMMAND
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-[#F8F9FA]">
              Security Centre
            </h1>
            <p className="text-xs sm:text-sm text-[#C5BDB7] mt-1">
              Autonomous wallet protection, biometric enclaves, and cryptographic incident telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={fetchSecurityData}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh SecOps
            </GlowButton>
          </div>
        </div>

        {/* Severe Frozen Banner (if wallet is locked) */}
        {isFrozen && (
          <div className="p-4 rounded-2xl bg-[#E4201B]/15 border-2 border-[#E4201B]/60 shadow-[0_0_30px_rgba(228,32,27,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-[#E4201B] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-sm text-[#F8F9FA] tracking-wide">
                  EMERGENCY WALLET LOCKDOWN ENFORCED
                </h3>
                <p className="text-xs text-[#E4201B] mt-0.5 leading-relaxed">
                  Outgoing transfers and payment simulations are restricted. Inbound deposits remain securely staged.
                </p>
              </div>
            </div>
            <GlowButton
              variant="danger"
              size="sm"
              onClick={() => setIsFreezeModalOpen(true)}
              className="shrink-0"
            >
              Lift Lockdown
            </GlowButton>
          </div>
        )}

        {/* 1. Security Overview Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Security Score Widget */}
          <GlassCard className="p-5 border-[rgba(97,65,60,0.35)] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
                Security Posture
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-mono font-black text-[#F8F9FA]">
                  {securityScore}
                </span>
                <span className="text-xs font-mono text-[#C5BDB7]">/100</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${isFrozen ? 'text-[#E4201B]' : 'text-[#10B981]'}`}>
                {isFrozen ? 'QUARANTINED' : 'OPTIMAL ENCLAVE'}
              </span>
            </div>
            <div className="shrink-0">
              <RiskGauge score={securityScore} size="sm" showLabel={false} />
            </div>
          </GlassCard>

          {/* Protection State */}
          <GlassCard className="p-5 border-[rgba(97,65,60,0.35)]">
            <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
              Wallet Shield
            </span>
            <div className="flex items-center gap-2 mt-1">
              {isFrozen ? (
                <Lock className="w-5 h-5 text-[#E4201B]" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              )}
              <span className={`text-xl font-display font-bold ${isFrozen ? 'text-[#E4201B]' : 'text-[#10B981]'}`}>
                {isFrozen ? 'LOCKED' : 'ACTIVE'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#C5BDB7] mt-2 block">
              {isFrozen ? 'Zero outgoing debit policy' : 'Neural heuristics online'}
            </span>
          </GlassCard>

          {/* Active Devices */}
          <GlassCard className="p-5 border-[rgba(97,65,60,0.35)]">
            <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
              Authorized Enclaves
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-black text-[#FE7E3C]">
                {devices.length}
              </span>
              <span className="text-xs font-mono text-[#C5BDB7]">Active</span>
            </div>
            <span className="text-[10px] font-mono text-[#C5BDB7] mt-2 block">
              {lastLogin}
            </span>
          </GlassCard>

          {/* Incident Alerts */}
          <GlassCard className="p-5 border-[rgba(97,65,60,0.35)]">
            <span className="text-[10px] font-mono uppercase text-[#C5BDB7] block mb-1">
              Security Alerts
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-black text-[#FE7E3C]">
                {alerts.filter((a) => !a.resolved).length}
              </span>
              <span className="text-xs font-mono text-[#C5BDB7]">Unresolved</span>
            </div>
            <span className="text-[10px] font-mono text-[#C5BDB7] mt-2 block">
              0 failed attempts recorded
            </span>
          </GlassCard>
        </div>

        {/* 2 & 5: Two Column Row: Left = Wallet Freeze & Adaptive Limit, Right = PIN Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Emergency Lockdown & Daily Limits */}
          <div className="space-y-6">
            {/* Wallet Freeze Control */}
            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(97,65,60,0.25)]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#FE7E3C]" />
                  <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                    Wallet Quarantine Control
                  </h3>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isFrozen
                    ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                    : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                }`}>
                  {isFrozen ? 'FROZEN' : 'OPERATIONAL'}
                </span>
              </div>

              <p className="text-xs text-[#C5BDB7] leading-relaxed mb-4">
                In case of suspicious SMS codes, lost device, or anomalous activity, you can immediately enforce a cryptographic freeze across all local payment routing.
              </p>

              <div className="p-3.5 rounded-xl bg-[#122023] border border-white/5 space-y-2 text-xs mb-5 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#C5BDB7]">Ledger State:</span>
                  <span className={isFrozen ? 'text-[#E4201B]' : 'text-[#10B981]'}>
                    {isFrozen ? 'Quarantine Active' : 'Consensus Normal'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C5BDB7]">Inbound Credits:</span>
                  <span className="text-[#10B981]">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C5BDB7]">Outbound Transfers:</span>
                  <span className={isFrozen ? 'text-[#E4201B]' : 'text-[#10B981]'}>
                    {isFrozen ? 'BLOCKED' : 'Allowed'}
                  </span>
                </div>
              </div>

              <GlowButton
                variant={isFrozen ? 'secondary' : 'danger'}
                size="md"
                onClick={() => setIsFreezeModalOpen(true)}
                className="w-full"
                leftIcon={isFrozen ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              >
                {isFrozen ? 'Restore Wallet Operations' : 'Emergency Freeze Wallet'}
              </GlowButton>
            </GlassCard>

            {/* Adaptive Daily Spending Limit */}
            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.25)]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FE7E3C]" />
                  <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                    Adaptive Daily Velocity Limit
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#FE7E3C]">
                  AI CALIBRATED
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-mono text-[#C5BDB7]">Current Limit:</span>
                  <span className="text-xl font-mono font-bold text-[#F8F9FA]">
                    ₹{wallet?.dailyLimit?.toLocaleString('en-IN') || '1,00,000'}
                  </span>
                </div>

                {/* Progress of spent today */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-[#C5BDB7] mb-1">
                    <span>Spent Today: ₹{(wallet?.spentToday || 18450).toLocaleString('en-IN')}</span>
                    <span>Remaining: ₹{Math.max(0, (wallet?.dailyLimit || 100000) - (wallet?.spentToday || 18450)).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-[#122023] h-2 rounded-full overflow-hidden border border-[rgba(97,65,60,0.35)]">
                    <div
                      className="bg-gradient-to-r from-[#FE7E3C] to-[#E4201B] h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (((wallet?.spentToday || 18450) / (wallet?.dailyLimit || 100000)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Adjust Limit */}
                <div className="pt-2">
                  <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                    Adjust Daily Threshold (₹)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="5000"
                      min="5000"
                      max="500000"
                      value={dailyLimitInput}
                      onChange={(e) => setDailyLimitInput(Number(e.target.value))}
                      className="flex-1 px-3 py-2 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs font-mono text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C]"
                    />
                    <GlowButton
                      variant="primary"
                      size="sm"
                      isLoading={isUpdatingLimit}
                      onClick={handleUpdateLimit}
                    >
                      Update
                    </GlowButton>
                  </div>
                </div>

                <p className="text-[10px] text-[#C5BDB7] leading-relaxed">
                  GUARDIANPAY autonomously lowers this threshold by 75% if 3 consecutive high-risk transfers are initiated within a 2-hour window.
                </p>
              </div>
            </GlassCard>
          </div>

          {/* RIGHT: Change UPI PIN Interface */}
          <GlassCard className="p-6 border-[rgba(97,65,60,0.35)]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(97,65,60,0.25)]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#FE7E3C]" />
                <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                  Secure UPI PIN Rotation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25">
                ENCLAVE KEY
              </span>
            </div>

            <p className="text-xs text-[#C5BDB7] leading-relaxed mb-4">
              Your 6-digit PIN authorizes high-value transfers. Rotation re-encrypts your local cryptographic credential.
            </p>

            <form onSubmit={handleChangePin} className="space-y-4">
              {/* Current PIN */}
              <div>
                <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                  Current 6-Digit PIN <span className="text-[#E4201B]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPinFields ? 'text' : 'password'}
                    maxLength={6}
                    required
                    placeholder="••••••"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-center text-sm font-mono tracking-widest text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C] focus:ring-1 focus:ring-[#FE7E3C]/40"
                  />
                </div>
                <span className="text-[10px] font-mono text-[#C5BDB7] mt-1 block">
                  Demo Default: 123456
                </span>
              </div>

              {/* New PIN */}
              <div>
                <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                  New 6-Digit PIN <span className="text-[#E4201B]">*</span>
                </label>
                <input
                  type={showPinFields ? 'text' : 'password'}
                  maxLength={6}
                  required
                  placeholder="••••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-center text-sm font-mono tracking-widest text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C]"
                />
              </div>

              {/* Confirm PIN */}
              <div>
                <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                  Confirm New PIN <span className="text-[#E4201B]">*</span>
                </label>
                <input
                  type={showPinFields ? 'text' : 'password'}
                  maxLength={6}
                  required
                  placeholder="••••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-center text-sm font-mono tracking-widest text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C]"
                />
              </div>

              {/* Toggle visibility */}
              <div className="flex items-center justify-between text-xs text-[#C5BDB7]">
                <button
                  type="button"
                  onClick={() => setShowPinFields(!showPinFields)}
                  className="flex items-center gap-1.5 hover:text-[#FE7E3C] transition-colors"
                >
                  {showPinFields ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPinFields ? 'Mask PIN Input' : 'Reveal PIN Input'}</span>
                </button>

                {newPin && confirmPin && (
                  <span
                    className={`font-mono text-[10px] ${
                      newPin === confirmPin ? 'text-[#10B981]' : 'text-[#E4201B]'
                    }`}
                  >
                    {newPin === confirmPin ? '✓ PINs Match' : '✕ PINs Mismatch'}
                  </span>
                )}
              </div>

              <div className="pt-2">
                <GlowButton
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={isChangingPin}
                  className="w-full"
                >
                  Commit New PIN to Enclave
                </GlowButton>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* 2. Device Management Section */}
        <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.25)]">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#FE7E3C]" />
              <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                Recognized Devices & Session Tokens
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#FE7E3C]">
              {devices.length} TRUSTED ENCLAVES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device, idx) => {
              const isCurrent = idx === 0;

              return (
                <div
                  key={device.id}
                  className={`p-4 rounded-xl bg-[#122023]/70 border transition-all ${
                    isCurrent
                      ? 'border-[#FE7E3C]/40 shadow-[0_0_15px_rgba(254,126,60,0.1)]'
                      : 'border-[rgba(97,65,60,0.35)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {device.deviceType === 'MOBILE' ? (
                        <Smartphone className="w-4 h-4 text-[#FE7E3C]" />
                      ) : (
                        <Laptop className="w-4 h-4 text-[#0E6873]" />
                      )}
                      <span className="font-semibold text-xs text-[#F8F9FA] truncate max-w-[150px]">
                        {device.deviceName}
                      </span>
                    </div>

                    {isCurrent ? (
                      <span className="text-[9px] font-mono font-bold text-[#FE7E3C] bg-[#FE7E3C]/10 px-1.5 py-0.5 rounded border border-[#FE7E3C]/30">
                        THIS DEVICE
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-[#C5BDB7]">
                        TRUSTED
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] font-mono text-[#C5BDB7]">
                    <p>OS: <span className="text-[#F8F9FA]">{device.os}</span></p>
                    <p>Location: <span className="text-[#F8F9FA]">{device.location}</span></p>
                    <p>IP: <span className="text-[#C5BDB7]">{device.ipAddress}</span></p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#C5BDB7]">
                      Active: {device.lastActive.slice(0, 10)}
                    </span>

                    {!isCurrent && (
                      <button
                        onClick={() => handleRevokeDevice(device.id, device.deviceName)}
                        className="text-[#E4201B] hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 3 & 7: Security Alerts & Audit Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Security Alerts */}
          <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.25)]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FE7E3C]" />
                <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                  Security Alerts Feed
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#FE7E3C]">
                REAL-TIME INCIDENTS
              </span>
            </div>

            {alerts.length === 0 ? (
              <p className="text-xs text-[#C5BDB7] font-mono py-4 text-center">
                Zero security alerts reported in this epoch.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      alert.resolved
                        ? 'bg-[#122023]/40 border-white/5 opacity-50'
                        : 'bg-[#0E6873]/20 border-[rgba(254,126,60,0.3)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            alert.severity === 'CRITICAL'
                              ? 'text-[#E4201B] bg-[#E4201B]/10 border-[#E4201B]/30'
                              : 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-semibold text-[#F8F9FA]">
                          {alert.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#C5BDB7]">
                        {new Date(alert.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#C5BDB7] mb-2">{alert.description}</p>

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#C5BDB7]">ID: {alert.id}</span>
                      {!alert.resolved ? (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="text-[#FE7E3C] hover:underline"
                        >
                          Acknowledge & Dismiss
                        </button>
                      ) : (
                        <span className="text-[#10B981] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Cryptographic Audit Trail */}
          <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.25)]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#FE7E3C]" />
                <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                  Immutable Audit Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#10B981]">
                DUAL-HASH VERIFIED
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#122023]/60 border border-white/5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#FE7E3C] font-bold">{log.action}</span>
                    <span className="text-[#C5BDB7]">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[#C5BDB7] text-[11px]">{log.details}</p>
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#C5BDB7] pt-1 border-t border-white/5">
                    <span>IP: {log.ipAddress}</span>
                    <HashChip hash={log.integrityHash} startLength={6} endLength={4} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Freeze Confirmation Modal */}
      <Modal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        title={isFrozen ? 'Lift Wallet Quarantine' : 'Confirm Wallet Emergency Freeze'}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#E4201B]/10 border border-[#E4201B]/30 text-xs text-[#E4201B] flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              {isFrozen
                ? 'Lifting quarantine restores full transfer authorization. Ensure your credentials are secure.'
                : 'Enforcing a freeze immediately halts all outbound debits and revokes volatile session tokens.'}
            </p>
          </div>

          {!isFrozen && (
            <div>
              <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                Quarantine Reason (Audit Trail Record)
              </label>
              <select
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs font-mono text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C]"
              >
                <option value="Suspected unauthorized access">Suspected unauthorized access</option>
                <option value="Device misplaced or stolen">Device misplaced or stolen</option>
                <option value="Precautionary travel quarantine">Precautionary travel quarantine</option>
                <option value="Suspicious payment received">Suspicious payment received</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <GlowButton
              variant="secondary"
              size="sm"
              onClick={() => setIsFreezeModalOpen(false)}
            >
              Cancel
            </GlowButton>
            <GlowButton
              variant={isFrozen ? 'secondary' : 'danger'}
              size="sm"
              isLoading={isFreezingAction}
              onClick={handleToggleFreeze}
            >
              {isFrozen ? 'Confirm Unlock' : 'Confirm Freeze'}
            </GlowButton>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
