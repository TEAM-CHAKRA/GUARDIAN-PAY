'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, SendHorizontal, QrCode, History, ShieldCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Send', href: '/send', icon: SendHorizontal },
    { name: 'Receive', href: '/receive', icon: QrCode },
    { name: 'History', href: '/transactions', icon: History },
    { name: 'Security', href: '/security-centre', icon: ShieldCheck },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1A2C30]/95 backdrop-blur-2xl border-t border-[rgba(97,65,60,0.35)] py-2 px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
      <nav className="flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.name === 'Security' && pathname === '/security');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-1.5 rounded-lg text-[9px] font-medium transition-colors select-none',
                isActive
                  ? 'text-[#FE7E3C] font-semibold'
                  : 'text-[#C5BDB7] hover:text-[#F8F9FA]'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  isActive ? 'bg-[#FE7E3C]/15 text-[#FE7E3C] shadow-[0_0_10px_rgba(254,126,60,0.3)]' : ''
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[48px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default MobileNav;
