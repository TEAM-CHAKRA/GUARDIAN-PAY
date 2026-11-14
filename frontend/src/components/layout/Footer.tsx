'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="relative border-t border-[rgba(97,65,60,0.35)] bg-[#122023] pt-14 pb-10 overflow-hidden z-10">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 w-[50rem] h-[20rem] rounded-full bg-[#FE7E3C]/5 blur-[120px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[rgba(97,65,60,0.3)]">
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#FE7E3C]/20 to-[#0E6873]/30 border border-[#FE7E3C]/40 shadow-[0_0_12px_rgba(254,126,60,0.25)]">
                <Shield className="w-4 h-4 text-[#FE7E3C]" />
                <span className="absolute font-mono font-black text-[10px] text-[#F8F9FA]">₹</span>
              </div>
              <span className="font-display font-black text-lg tracking-wider text-[#F8F9FA]">
                GUARDIAN<span className="text-[#FE7E3C]">PAY</span>
              </span>
            </Link>

            <p className="text-sm text-[#C5BDB7] max-w-md leading-relaxed font-sans">
              Smart digital wallet platform featuring autonomous AI fraud detection, adaptive authentication, real-time transaction risk scoring, and tamper-evident SHA-256 cryptographic ledger verification.
            </p>

            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-[#C5BDB7]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Consensus Engine Online • Simulated Sandbox</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-mono text-xs uppercase tracking-widest text-[#FE7E3C] font-bold">
              Navigation
            </h5>
            <ul className="space-y-2 text-sm text-[#C5BDB7]">
              <li>
                <Link href="/" className="hover:text-[#FE7E3C] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#FE7E3C] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#FE7E3C] transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#FE7E3C] transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Project Information */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-mono text-xs uppercase tracking-widest text-[#FE7E3C] font-bold">
              Project Information
            </h5>
            <div className="space-y-1.5 text-xs font-mono text-[#C5BDB7]">
              <p>Platform: GUARDIANPAY Fintech Suite</p>
              <p>Architecture: Next.js Responsive Web</p>
              <p>Hashing: SHA-256 Dual-Entry Ledger</p>
              <p className="text-[#FE7E3C]/90 pt-1">Every rupee, protected intelligently.</p>
            </div>
          </div>
        </div>

        {/* Copyright strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#C5BDB7]">
          <p>© {currentYear} GUARDIANPAY. All rights reserved.</p>
          <p>Hackathon FinTech Innovation Showcase • Simulated Environment</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
