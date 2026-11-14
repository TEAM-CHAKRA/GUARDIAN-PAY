'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Shield,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/components/ui/Toast';

export interface DashboardTopBarProps {
  userName?: string;
  userVpa?: string;
  onNotificationClick?: () => void;
}

export function DashboardTopBar({
  userName = 'Aarav Mehta',
  userVpa = 'aarav@aegis',
}: DashboardTopBarProps) {
  const { language, setLanguage, t } = useLanguage();
  const { info } = useToast();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);

  const notifications = [
    {
      id: '1',
      title: 'Ledger Block #40 Committed',
      time: '2m ago',
      unread: true,
      desc: '₹1,450.00 transfer to diya@aegis signed with 0 anomaly score.',
    },
    {
      id: '2',
      title: 'Autonomous Perimeter Check Passed',
      time: '1h ago',
      unread: false,
      desc: 'Hardware biometric token successfully verified.',
    },
    {
      id: '3',
      title: 'Round-Up Savings Credited',
      time: '3h ago',
      unread: false,
      desc: '₹50.00 auto-transferred to vault balance.',
    },
  ];

  return (
    <header className="sticky top-0 z-20 bg-[#1A2C30]/85 backdrop-blur-xl border-b border-[rgba(97,65,60,0.35)] px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Mobile Logo Brand */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#FE7E3C]/20 to-[#0E6873]/30 border border-[#FE7E3C]/40 shadow-[0_0_12px_rgba(254,126,60,0.3)]">
            <Shield className="w-4 h-4 text-[#FE7E3C]" />
            <span className="absolute font-mono font-black text-[9px] text-[#F8F9FA]">₹</span>
          </div>
          <span className="font-display font-black text-sm tracking-wider text-[#F8F9FA]">
            GUARDIAN<span className="text-[#FE7E3C]">PAY</span>
          </span>
        </div>

        {/* Desktop Status Chip */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.35)]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#10B981] font-semibold">{t('walletProtected')}</span>
          </div>
          <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold text-[#FE7E3C] bg-[#FE7E3C]/10 border border-[#FE7E3C]/30 uppercase">
            SANDBOX SIMULATION
          </span>
          <span className="text-[#C5BDB7]">|</span>
          <span className="text-[#C5BDB7]">Dual-Entry Consensus Online</span>
        </div>

        {/* Right Action Icons: Language, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Language Toggle English / हिन्दी */}
          <div className="flex items-center rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] p-1 text-xs font-mono">
            <button
              onClick={() => {
                setLanguage('en');
                info('Language Switched', 'Interface set to English.');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                language === 'en'
                  ? 'bg-[#FE7E3C] text-[#1A2C30] font-bold shadow-[0_0_10px_rgba(254,126,60,0.4)]'
                  : 'text-[#C5BDB7] hover:text-[#F8F9FA]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                setLanguage('hi');
                info('भाषा बदली गई', 'इंटरफ़ेस अब हिन्दी में है।');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                language === 'hi'
                  ? 'bg-[#FE7E3C] text-[#1A2C30] font-bold shadow-[0_0_10px_rgba(254,126,60,0.4)]'
                  : 'text-[#C5BDB7] hover:text-[#F8F9FA]'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifMenuOpen(!isNotifMenuOpen);
                setIsProfileMenuOpen(false);
              }}
              className="relative p-2 rounded-xl text-[#C5BDB7] hover:text-[#FE7E3C] bg-[#0E6873]/25 hover:bg-[#0E6873]/50 border border-[rgba(97,65,60,0.35)] transition-colors cursor-pointer"
              aria-label="View security notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FE7E3C] animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FE7E3C]" />
            </button>

            {isNotifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#16363B]/95 border border-[rgba(14,104,115,0.45)] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(14,104,115,0.15)] p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-[rgba(97,65,60,0.3)]">
                  <span className="font-display text-sm font-bold text-[#F8F9FA]">
                    Security Notifications
                  </span>
                  <span className="font-mono text-[10px] text-[#10B981] px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30">
                    3 New
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-[#122023]/60 border border-[rgba(97,65,60,0.25)] hover:border-[rgba(254,126,60,0.35)] transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-[#F8F9FA] mb-1">
                        <span className="truncate">{n.title}</span>
                        <span className="font-mono text-[10px] text-[#C5BDB7] shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#C5BDB7] leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotifMenuOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-[#0E6873]/30 hover:bg-[#0E6873]/50 border border-[rgba(97,65,60,0.35)] transition-colors cursor-pointer select-none"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FE7E3C]/20 to-[#0E6873]/40 border border-[#FE7E3C]/40 flex items-center justify-center font-display font-bold text-xs text-[#FE7E3C]">
                {userName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold text-[#F8F9FA] leading-tight truncate max-w-[100px]">
                  {userName}
                </span>
                <span className="text-[10px] font-mono text-[#FE7E3C] leading-tight">{userVpa}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#C5BDB7]" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#16363B]/95 border border-[rgba(14,104,115,0.45)] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(14,104,115,0.15)] p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
                <div className="pb-3 border-b border-[rgba(97,65,60,0.3)]">
                  <p className="font-display font-bold text-sm text-[#F8F9FA]">{userName}</p>
                  <p className="font-mono text-xs text-[#FE7E3C] mt-0.5">{userVpa}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="font-mono text-[10px] text-[#10B981] uppercase font-bold">
                      {t('verifiedKyc')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#C5BDB7] hover:text-[#FE7E3C] hover:bg-[#122023] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Wallet Profile</span>
                  </Link>
                  <Link
                    href="/set-pin"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#C5BDB7] hover:text-[#FE7E3C] hover:bg-[#122023] transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Change Security PIN</span>
                  </Link>
                  <Link
                    href="/admin"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#E4201B] bg-[#E4201B]/10 border border-[#E4201B]/20 hover:bg-[#E4201B]/20 transition-colors"
                  >
                    <Shield className="w-4 h-4 text-[#E4201B]" />
                    <span>SecOps Admin Command</span>
                  </Link>
                </div>

                <div className="pt-2 border-t border-[rgba(97,65,60,0.3)]">
                  <Link
                    href="/login"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#E4201B] hover:bg-[#E4201B]/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardTopBar;
