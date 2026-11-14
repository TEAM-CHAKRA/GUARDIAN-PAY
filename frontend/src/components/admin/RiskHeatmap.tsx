'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface HeatmapDataPoint {
  day: string;
  hour: number;
  intensity: number; // 0 to 100
  count: number;
}

interface RiskHeatmapProps {
  data: HeatmapDataPoint[];
}

export function RiskHeatmap({ data }: RiskHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getCellColor = (intensity: number) => {
    if (intensity < 25) return 'bg-[#10B981]/15 hover:bg-[#10B981]/30 border-[rgba(16,185,129,0.2)]';
    if (intensity < 50) return 'bg-[#FE7E3C]/20 hover:bg-[#FE7E3C]/35 border-[rgba(254,126,60,0.3)]';
    if (intensity < 75) return 'bg-[#FE7E3C]/40 hover:bg-[#FE7E3C]/60 border-[rgba(254,126,60,0.5)]';
    return 'bg-[#E4201B]/60 hover:bg-[#E4201B]/80 border-[rgba(228,32,27,0.6)] shadow-[0_0_8px_rgba(228,32,27,0.4)]';
  };

  return (
    <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(97,65,60,0.25)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FE7E3C] animate-pulse" />
            <h3 className="font-display font-bold text-base text-[#F8F9FA]">
              Hourly Threat Velocity Heatmap
            </h3>
          </div>
          <p className="text-xs text-[#C5BDB7] mt-0.5">
            24-hour temporal anomaly distribution across standard 7-day rolling cycle.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#C5BDB7]">
          <span className="text-[#C5BDB7]">Low Risk</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[#10B981]/20 border border-[#10B981]/30" />
            <span className="w-3 h-3 rounded bg-[#FE7E3C]/30 border border-[#FE7E3C]/40" />
            <span className="w-3 h-3 rounded bg-[#FE7E3C]/60 border border-[#FE7E3C]/70" />
            <span className="w-3 h-3 rounded bg-[#E4201B]/70 border border-[#E4201B]/80 shadow-[0_0_6px_#E4201B]" />
          </div>
          <span className="text-[#E4201B] font-semibold">Critical Threat</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[680px]">
          {/* Hour Labels */}
          <div className="grid grid-cols-[48px_repeat(24,1fr)] gap-1 mb-1.5 text-[9px] font-mono text-[#C5BDB7] text-center">
            <div />
            {hours.map((h) => (
              <div key={h}>{h % 3 === 0 ? `${h}h` : ''}</div>
            ))}
          </div>

          {/* Days Rows */}
          <div className="space-y-1">
            {days.map((day) => (
              <div
                key={day}
                className="grid grid-cols-[48px_repeat(24,1fr)] gap-1 items-center"
              >
                <span className="text-[10px] font-mono font-medium text-[#C5BDB7]">
                  {day}
                </span>

                {hours.map((hour) => {
                  const cell = data.find((d) => d.day === day && d.hour === hour) || {
                    day,
                    hour,
                    intensity: 15,
                    count: 12,
                  };

                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={cn(
                        'h-5 rounded-[4px] border transition-all cursor-pointer relative',
                        getCellColor(cell.intensity)
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip Bar */}
      <div className="min-h-[28px] pt-2 border-t border-[rgba(97,65,60,0.2)] flex items-center justify-between text-xs font-mono">
        {hoveredCell ? (
          <div className="flex items-center gap-3">
            <span className="text-[#FE7E3C] font-bold">
              {hoveredCell.day} at {String(hoveredCell.hour).padStart(2, '0')}:00 UTC
            </span>
            <span className="text-[#C5BDB7]">
              Threat Index:{' '}
              <strong
                className={
                  hoveredCell.intensity > 70
                    ? 'text-[#E4201B]'
                    : hoveredCell.intensity > 40
                    ? 'text-[#FE7E3C]'
                    : 'text-[#10B981]'
                }
              >
                {hoveredCell.intensity}/100
              </strong>
            </span>
            <span className="text-[#C5BDB7]">
              Volume: {hoveredCell.count} txns
            </span>
          </div>
        ) : (
          <span className="text-[#C5BDB7] text-[11px]">
            Hover over any cell in the 24×7 matrix to inspect temporal threat intensity.
          </span>
        )}

        <span className="text-[10px] text-[#C5BDB7]">
          Circadian baseline model: Active
        </span>
      </div>
    </GlassCard>
  );
}

export default RiskHeatmap;
