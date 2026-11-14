'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, IndianRupee, BrainCircuit, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export function HowItWorksPipeline() {
  const steps = [
    {
      num: '01',
      title: 'Select Recipient',
      desc: 'Enter verified VPA handle, select a known contact, or scan an encrypted QR code.',
      icon: UserCheck,
    },
    {
      num: '02',
      title: 'Enter Amount',
      desc: 'Specify transfer value with daily limit verification and optional transfer notes.',
      icon: IndianRupee,
    },
    {
      num: '03',
      title: 'AI Risk Analysis',
      desc: 'Six-stage telemetry pipeline scores velocity, recipient age, and device consistency in <15ms.',
      icon: BrainCircuit,
    },
    {
      num: '04',
      title: 'Adaptive Authorization',
      desc: 'Dynamic challenge routes to Instant PIN, Step-Up SMS/Email OTP, or Security Hold.',
      icon: ShieldAlert,
    },
    {
      num: '05',
      title: 'Payment Confirmation',
      desc: 'Cryptographic SHA-256 block minted to ledger with verified UTR and downloadable receipt.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E6873]/30 border border-[rgba(97,65,60,0.45)] text-xs font-mono text-[#FE7E3C] uppercase tracking-[0.16em] font-semibold">
            <span>Deterministic Workflow</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-[#F8F9FA] tracking-tight leading-[1.1]">
            How It Works
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#C5BDB7] leading-relaxed max-w-[65ch] mx-auto">
            From initiation to cryptographic settlement: five seamless stages engineered for complete financial safety.
          </p>
        </div>

        {/* Workflow: Horizontal Circuit on Desktop */}
        <div className="relative">
          {/* Circuit line track with travelling orange pulse beam */}
          <div className="hidden lg:block absolute top-[68px] left-[6%] right-[6%] h-[2px] bg-[rgba(97,65,60,0.45)] pointer-events-none z-0">
            {/* Pulsing glow dots at 5 step anchor points */}
            {[0, 25, 50, 75, 100].map((pct, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#0E6873] border border-[#FE7E3C]/60"
                style={{ left: `${pct}%` }}
              />
            ))}

            {/* Moving orange pulse beam */}
            <motion.div
              aria-hidden="true"
              className="absolute top-1/2 -translate-y-1/2 h-1 w-28 rounded-full bg-gradient-to-r from-transparent via-[#FE7E3C] to-transparent shadow-[0_0_12px_#FE7E3C]"
              animate={{
                left: ['-5%', '105%'],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col"
                >
                  <GlassCard
                    variant="interactive"
                    className="p-6 h-full flex flex-col justify-between"
                  >
                    <div>
                      {/* Step Number & Icon */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#FE7E3C]/15 border border-[#FE7E3C]/35 text-[#FE7E3C]">
                          STEP {step.num}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E6873]/30 to-[#1A2C30] border border-[rgba(97,65,60,0.45)] flex items-center justify-center text-[#FE7E3C] shadow-[0_0_15px_rgba(254,126,60,0.12)]">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      <h3 className="font-display font-bold text-base text-[#F8F9FA] mb-2">
                        {step.title}
                      </h3>

                      <p className="text-xs text-[#C5BDB7] leading-relaxed font-sans">
                        {step.desc}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[rgba(97,65,60,0.25)] flex items-center justify-between text-[11px] font-mono text-[#C5BDB7]">
                      <span className="text-[#C5BDB7]/80">Stage {index + 1} of 5</span>
                      {index < 4 ? (
                        <ArrowRight className="w-3.5 h-3.5 text-[#FE7E3C]/70 lg:hidden" />
                      ) : (
                        <span className="text-[#10B981] font-semibold">Minted</span>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksPipeline;
