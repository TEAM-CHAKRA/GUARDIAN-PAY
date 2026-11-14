'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function SectionDivider() {
  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-hidden pointer-events-none">
      {/* 1px Copper Baseline */}
      <div className="relative w-full h-[1px] bg-[rgba(97,65,60,0.35)]">
        {/* Short Burnt Orange Segment sliding in on scroll */}
        <motion.div
          initial={{ left: '-15%', width: '120px' }}
          whileInView={{ left: '105%', width: '160px' }}
          viewport={{ once: false, amount: 0.8 }}
          transition={{ duration: 2.2, ease: 'easeInOut' }}
          className="absolute top-0 h-[1.5px] -translate-y-[0.25px] bg-gradient-to-r from-transparent via-[#FE7E3C] to-transparent shadow-[0_0_8px_rgba(254,126,60,0.8)]"
        />
      </div>
    </div>
  );
}

export default SectionDivider;
