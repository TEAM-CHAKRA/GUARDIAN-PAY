'use client';

import React from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import AnimatedGrid from '../background/AnimatedGrid';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#1A2C30] text-[#F8F9FA] flex flex-col lg:flex-row">
      <AnimatedGrid />
      <Sidebar />
      <main className="flex-1 min-w-0 relative z-10 pb-20 lg:pb-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

export default AppShell;
