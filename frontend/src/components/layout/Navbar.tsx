'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, ArrowUpRight } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Strict public navigation items: ONLY 4 items
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Login', href: '/login' },
  ];

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled
          ? 'bg-[#1A2C30]/90 backdrop-blur-xl border-b border-[rgba(97,65,60,0.35)] shadow-[0_8px_30px_rgba(0,0,0,0.5)] py-3'
          : 'bg-transparent py-5 border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* GUARDIANPAY brand logo on the left */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#FE7E3C]/20 via-[#0E6873]/30 to-[#61413C]/20 border border-[#FE7E3C]/40 shadow-[0_0_15px_rgba(254,126,60,0.25)] group-hover:shadow-[0_0_25px_rgba(254,126,60,0.5)] group-hover:border-[#FE7E3C] transition-all duration-300">
              <Shield className="w-5 h-5 text-[#FE7E3C] transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute font-mono font-black text-xs text-[#F8F9FA] -mt-0.5">₹</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-wider text-[#F8F9FA] group-hover:text-white flex items-center">
                GUARDIAN<span className="text-[#FE7E3C]">PAY</span>
              </span>
              <span className="font-mono text-[9px] tracking-widest text-[#C5BDB7] uppercase -mt-1">
                EVERY RUPEE, PROTECTED
              </span>
            </div>
          </Link>

          {/* Navigation links on the right */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0E6873]/25 border border-[rgba(97,65,60,0.35)] backdrop-blur-md">
              {navItems.map((item) => {
                const active = isCurrent(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150',
                      active
                        ? 'text-[#F8F9FA] bg-[#FE7E3C]/20 text-[#FE7E3C] font-semibold shadow-[0_0_12px_rgba(254,126,60,0.25)]'
                        : 'text-[#C5BDB7] hover:text-[#FE7E3C] hover:bg-[#FE7E3C]/[0.08]'
                    )}
                  >
                    {item.name}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#FE7E3C] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Register is the primary highlighted CTA */}
            <Link href="/register">
              <GlowButton
                variant="primary"
                size="sm"
                rightIcon={<ArrowUpRight className="w-4 h-4 ml-0.5" />}
                className="font-semibold"
              >
                Register
              </GlowButton>
            </Link>
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#C5BDB7] hover:text-[#FE7E3C] hover:bg-[#0E6873]/40 border border-[rgba(97,65,60,0.35)] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-[rgba(97,65,60,0.35)] bg-[#1A2C30]/98 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-6 py-6 space-y-4">
              <div className="flex flex-col space-y-1">
                {navItems.map((item) => {
                  const active = isCurrent(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        active
                          ? 'bg-[#FE7E3C]/15 text-[#FE7E3C] font-semibold'
                          : 'text-[#F8F9FA] hover:bg-[#0E6873]/40 hover:text-[#FE7E3C]'
                      )}
                    >
                      <span>{item.name}</span>
                      {active && <span className="w-2 h-2 rounded-full bg-[#FE7E3C]" />}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-[rgba(97,65,60,0.35)]">
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <GlowButton variant="primary" size="md" className="w-full">
                    Register
                  </GlowButton>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
