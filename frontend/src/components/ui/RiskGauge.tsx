'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getRiskColor, cn } from '@/lib/utils';

export interface RiskGaugeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

export function RiskGauge({
  score,
  size = 'md',
  showLabel = true,
  className,
  animate = true,
}: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const { color, level, glow } = getRiskColor(clampedScore);

  const dimensions = {
    sm: { size: 76, stroke: 6, fontSize: 'text-lg', labelSize: 'text-[9px]' },
    md: { size: 110, stroke: 8, fontSize: 'text-2xl', labelSize: 'text-[11px]' },
    lg: { size: 150, stroke: 10, fontSize: 'text-4xl', labelSize: 'text-xs' },
  };

  const { size: svgSize, stroke, fontSize, labelSize } = dimensions[size];
  const radius = (svgSize - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className={cn('relative inline-flex flex-col items-center justify-center', className)}>
      <div className="relative flex items-center justify-center" style={{ width: svgSize, height: svgSize }}>
        <svg
          width={svgSize}
          height={svgSize}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(14, 104, 115, 0.25)"
            strokeWidth={stroke}
          />

          {/* Animated active stroke */}
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: animate ? strokeDashoffset : strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${glow})`,
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn('font-mono font-bold tracking-tight text-[#F8F9FA]', fontSize)}>
            {clampedScore.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#C5BDB7] font-mono -mt-0.5">
            /100
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <span
            className={cn('font-mono font-semibold uppercase tracking-widest px-2 py-0.5 rounded border', labelSize)}
            style={{
              color: color,
              borderColor: `${color}40`,
              backgroundColor: `${color}15`,
            }}
          >
            {level} RISK
          </span>
        </div>
      )}
    </div>
  );
}

export default RiskGauge;
