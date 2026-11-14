'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Stat } from '@/components/ui/Stat';
import { GlassCard } from '@/components/ui/GlassCard';
import { ShieldCheck, Zap, Lock, Cpu } from 'lucide-react';

export function TrustMetricsStrip() {
  const metrics = [
    {
      label: 'Secure Simulation Volume',
      value: 1248590,
      prefix: '',
      suffix: '+',
      detail: 'Cryptographically hashed on SHA-256 chain',
      icon: <ShieldCheck className="w-5 h-5 text-[#10B981]" />,
      delta: { value: 18.4, isPositive: true },
    },
    {
      label: 'Real-Time Risk Analysis',
      value: 14,
      prefix: '< ',
      suffix: 'ms',
      detail: 'Sub-millisecond dynamic neural scoring',
      icon: <Zap className="w-5 h-5 text-[#FE7E3C]" />,
    },
    {
      label: 'Ledger Chain Health',
      value: 100,
      prefix: '',
      suffix: '%',
      detail: 'Zero chain forks or ledger discrepancies',
      icon: <Lock className="w-5 h-5 text-[#0E6873]" />,
    },
    {
      label: 'Fraud Detection Rate',
      value: 99.94,
      decimals: 2,
      prefix: '',
      suffix: '%',
      detail: 'Trained on 42M simulated anomaly vectors',
      icon: <Cpu className="w-5 h-5 text-[#61413C]" />,
    },
  ];

  return (
    <section className="relative py-12 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard
          variant="elevated"
          padding="lg"
          className="border-[rgba(14,104,115,0.45)] shadow-[0_10px_35px_rgba(0,0,0,0.5),0_0_25px_rgba(14,104,115,0.12)]"
        >
          {/* Header row with simulation disclosure */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-[rgba(97,65,60,0.35)] gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-[#F8F9FA] font-semibold">
                Autonomous Security Telemetry
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#C5BDB7]">
              [SIMULATION ENGINE ACTIVE • ZERO DRIFT ENFORCED]
            </span>
          </div>

          {/* Grid of stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m, idx) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#C5BDB7]">
                    Metric 0{idx + 1}
                  </span>
                  <div className="p-2 rounded-lg bg-[#122023] border border-[rgba(97,65,60,0.35)]">
                    {m.icon}
                  </div>
                </div>

                <Stat
                  label={m.label}
                  value={m.value}
                  prefix={m.prefix}
                  suffix={m.suffix}
                  decimals={m.decimals}
                  delta={m.delta}
                  detail={m.detail}
                  size="md"
                />
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

export default TrustMetricsStrip;
