'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SendHorizontal, ArrowDownLeft, QrCode, PlusCircle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useLanguage } from '@/lib/LanguageContext';

export interface QuickActionCardsProps {
  onSendClick: () => void;
  onRequestClick: () => void;
  onScanClick: () => void;
  onAddMoneyClick: () => void;
}

export function QuickActionCards({
  onSendClick,
  onRequestClick,
  onScanClick,
  onAddMoneyClick,
}: QuickActionCardsProps) {
  const { t } = useLanguage();

  const actions = [
    {
      id: 'send',
      label: t('actionSend'),
      helper: t('actionSendDesc'),
      icon: <SendHorizontal className="w-5 h-5 text-[#FE7E3C]" />,
      glowColor: 'rgba(254, 126, 60, 0.4)',
      borderColor: 'border-[#FE7E3C]/30 hover:border-[#FE7E3C]',
      onClick: onSendClick,
    },
    {
      id: 'request',
      label: t('actionRequest'),
      helper: t('actionRequestDesc'),
      icon: <ArrowDownLeft className="w-5 h-5 text-[#0E6873]" />,
      glowColor: 'rgba(14, 104, 115, 0.4)',
      borderColor: 'border-[#0E6873]/40 hover:border-[#0E6873]',
      onClick: onRequestClick,
    },
    {
      id: 'scan',
      label: t('actionScan'),
      helper: t('actionScanDesc'),
      icon: <QrCode className="w-5 h-5 text-[#61413C]" />,
      glowColor: 'rgba(97, 65, 60, 0.4)',
      borderColor: 'border-[#61413C]/40 hover:border-[#61413C]',
      onClick: onScanClick,
    },
    {
      id: 'add',
      label: t('actionAdd'),
      helper: t('actionAddDesc'),
      icon: <PlusCircle className="w-5 h-5 text-[#10B981]" />,
      glowColor: 'rgba(16, 185, 129, 0.4)',
      borderColor: 'border-[#10B981]/30 hover:border-[#10B981]',
      onClick: onAddMoneyClick,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => (
        <motion.div
          key={act.id}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          <GlassCard
            variant="interactive"
            padding="md"
            onClick={act.onClick}
            className={`h-full flex flex-col justify-between group cursor-pointer border ${act.borderColor} transition-all duration-300`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                  style={{
                    boxShadow: `0 0 15px ${act.glowColor}`,
                  }}
                >
                  {act.icon}
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#C5BDB7] group-hover:text-[#F8F9FA] transition-colors">
                  [QUICK ACTION]
                </span>
              </div>

              <h4 className="font-display font-bold text-sm text-[#F8F9FA] group-hover:text-[#FE7E3C] transition-colors mb-1">
                {act.label}
              </h4>

              <p className="font-sans text-xs text-[#C5BDB7] leading-relaxed line-clamp-2">
                {act.helper}
              </p>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

export default QuickActionCards;
