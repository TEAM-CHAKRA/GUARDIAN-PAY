'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  SendHorizontal,
  QrCode,
  History,
  ShieldCheck,
  User,
  LogOut,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

export interface SidebarProps {
  onActionClick?: (actionId: string) => void;
}

export function Sidebar({ onActionClick }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { id: 'send', name: 'Send Money', href: '/send', icon: SendHorizontal },
    { id: 'receive', name: 'Receive Money', href: '/receive', icon: QrCode },
    { id: 'transactions', name: 'Transactions', href: '/transactions', icon: History },
    { id: 'security', name: 'Security Centre', href: '/security-centre', icon: ShieldCheck },
    { id: 'verify-link', name: 'Link Scanner', href: '/verify-link', icon: Shield },
    { id: 'profile', name: 'My Profile', href: '/profile', icon: User },
    { id: 'admin', name: 'SecOps Command', href: '/admin', icon: Terminal },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#1A2C30]/95 border-r border-[rgba(97,65,60,0.35)] backdrop-blur-2xl p-5 select-none z-30">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 mb-7 group px-1">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FE7E3C]/20 via-[#0E6873]/30 to-[#61413C]/20 border border-[#FE7E3C]/40 shadow-[0_0_15px_rgba(254,126,60,0.25)] group-hover:border-[#FE7E3C] transition-colors">
          <Shield className="w-5 h-5 text-[#FE7E3C]" />
          <span className="absolute font-mono font-black text-xs text-[#F8F9FA] -mt-0.5">₹</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-black text-base tracking-wider text-[#F8F9FA]">
            GUARDIAN<span className="text-[#FE7E3C]">PAY</span>
          </span>
          <span className="font-mono text-[8px] tracking-widest text-[#C5BDB7] uppercase">
            SECURE WALLET v4.2
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#C5BDB7] block mb-1">
          User Application
        </span>
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.id === 'security' && pathname === '/security');
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onActionClick && onActionClick(item.id)}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group',
                isActive
                  ? 'bg-gradient-to-r from-[#FE7E3C]/20 to-[#0E6873]/25 text-[#FE7E3C] border border-[#FE7E3C]/40 shadow-[0_0_15px_rgba(254,126,60,0.2)] font-semibold'
                  : 'text-[#C5BDB7] hover:text-[#F8F9FA] hover:bg-[#0E6873]/25 border border-transparent'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-[#FE7E3C]' : 'text-[#C5BDB7] group-hover:text-[#FE7E3C]'
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#FE7E3C] shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Security Health status box */}
      <div className="p-3.5 rounded-xl bg-[#0E6873]/20 border border-[rgba(97,65,60,0.35)] mt-auto mb-3">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-[#C5BDB7]">Ledger Consensus</span>
          <span className="text-[#10B981] flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            ONLINE
          </span>
        </div>
        <div className="w-full bg-[#122023] h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#10B981] h-full w-full" />
        </div>
        <p className="text-[10px] text-[#C5BDB7] font-mono mt-1.5 truncate">
          SHA-256 Chain • Dual-Entry Intact
        </p>
      </div>

      {/* Logout */}
      <Link
        href="/login"
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs text-[#C5BDB7] hover:text-[#E4201B] hover:bg-[#E4201B]/10 border border-transparent hover:border-[#E4201B]/25 transition-colors"
      >
        <LogOut className="w-4 h-4 text-[#E4201B]" />
        <span>{t('logout')}</span>
      </Link>
    </aside>
  );
}

export default Sidebar;
