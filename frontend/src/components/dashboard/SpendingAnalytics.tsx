'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { PieChart as PieIcon, TrendingUp, Target } from 'lucide-react';

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomAreaTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[#122023]/95 border border-[rgba(254,126,60,0.4)] shadow-[0_8px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(254,126,60,0.2)] backdrop-blur-md">
        <p className="font-mono text-[10px] text-[#C5BDB7] uppercase">{label}</p>
        <p className="font-mono text-sm font-bold text-[#FE7E3C]">
          {formatCurrency(payload[0].value)}
        </p>
        <span className="font-mono text-[9px] text-[#10B981] flex items-center gap-1 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          Settled on SHA-256 Ledger
        </span>
      </div>
    );
  }
  return null;
}

export function SpendingAnalytics() {
  const { t } = useLanguage();
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  const sevenDayData = [
    { day: 'Mon', amount: 3200, label: 'Monday' },
    { day: 'Tue', amount: 1450, label: 'Tuesday' },
    { day: 'Wed', amount: 8500, label: 'Wednesday' },
    { day: 'Thu', amount: 6200, label: 'Thursday' },
    { day: 'Fri', amount: 12000, label: 'Friday' },
    { day: 'Sat', amount: 4800, label: 'Saturday' },
    { day: 'Sun', amount: 2150, label: 'Sunday' },
  ];

  const categoryData = [
    { name: t('food'), value: 12450, color: '#FE7E3C' },
    { name: t('shopping'), value: 18200, color: '#0E6873' },
    { name: t('travel'), value: 6800, color: '#61413C' },
    { name: t('bills'), value: 9500, color: '#10B981' },
    { name: t('other'), value: 4350, color: '#D9531E' },
  ];

  const totalSpending = categoryData.reduce((acc, curr) => acc + curr.value, 0);

  const monthlyBudget = 75000;
  const currentSpent = 51300;
  const remainingBudget = monthlyBudget - currentSpent;
  const budgetPercent = Math.round((currentSpent / monthlyBudget) * 100);

  return (
    <div className="space-y-6">
      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* A. 7-Day Spending Area Chart (7 cols) */}
        <GlassCard
          variant="default"
          padding="lg"
          className="lg:col-span-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FE7E3C]/10 text-[#FE7E3C]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                  {t('sevenDaySpending')}
                </h3>
              </div>
              <span className="font-mono text-xs text-[#FE7E3C] font-bold">
                ₹38,300.00 Total
              </span>
            </div>
            <p className="text-xs text-[#C5BDB7] mb-6">
              Telemetry trend across the last 7 settlement cycles.
            </p>

            <div className="h-56 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sevenDayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FE7E3C" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0E6873" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="#C5BDB7"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(97, 65, 60, 0.35)' }}
                  />
                  <YAxis
                    stroke="#C5BDB7"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip content={<CustomAreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#FE7E3C"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyberAreaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(97,65,60,0.35)] flex items-center justify-between text-xs font-mono text-[#C5BDB7]">
            <span>Peak Day: Friday (₹12,000)</span>
            <span className="text-[#10B981]">Dual-Entry Verified</span>
          </div>
        </GlassCard>

        {/* B. Category Breakdown Donut (5 cols) */}
        <GlassCard
          variant="default"
          padding="lg"
          className="lg:col-span-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-[#0E6873]/20 text-[#0E6873]">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                {t('spendingByCategory')}
              </h3>
            </div>
            <p className="text-xs text-[#C5BDB7] mb-4">
              Real-time categorization of simulated transactions.
            </p>

            <div className="flex items-center justify-center h-44 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveCategoryIndex(index)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#1A2C30"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-xs text-[#C5BDB7] uppercase">Total</span>
                <span className="font-mono font-bold text-sm text-[#F8F9FA]">
                  {formatCurrency(totalSpending, false)}
                </span>
              </div>
            </div>

            {/* Category breakdown legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((cat, idx) => (
                <div
                  key={cat.name}
                  className={`p-1.5 rounded-lg flex items-center justify-between text-xs font-mono transition-colors ${
                    activeCategoryIndex === idx ? 'bg-[#122023]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[#C5BDB7] truncate">{cat.name}</span>
                  </div>
                  <span className="font-bold text-[#F8F9FA] shrink-0">
                    {formatCurrency(cat.value, false)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* C. Monthly Budget Progress Bar */}
      <GlassCard variant="default" padding="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FE7E3C]/10 text-[#FE7E3C]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[#F8F9FA]">
                {t('monthlyBudget')}
              </h4>
              <p className="font-sans text-xs text-[#C5BDB7]">
                {budgetPercent}% {t('budgetUsed')} • ₹{remainingBudget.toLocaleString('en-IN')}{' '}
                {t('budgetRemaining')}
              </p>
            </div>
          </div>
          <div className="font-mono text-sm font-bold text-[#F8F9FA]">
            <span className="text-[#FE7E3C]">₹{currentSpent.toLocaleString('en-IN')}</span> / ₹
            {monthlyBudget.toLocaleString('en-IN')}
          </div>
        </div>

        <ProgressBar value={budgetPercent} color="orange" height="lg" showLabel={false} />

        <div className="flex justify-between items-center mt-3 text-xs font-mono text-[#C5BDB7]">
          <span>Enclave Safe Margin: Optimal</span>
          <span className="text-[#10B981]">Under Projected Velocity Limit</span>
        </div>
      </GlassCard>
    </div>
  );
}

export default SpendingAnalytics;
