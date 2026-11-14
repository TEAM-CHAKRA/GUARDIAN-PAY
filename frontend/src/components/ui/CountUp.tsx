'use client';

import React, { useEffect, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatIndian?: boolean;
}

export function CountUp({
  value,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  formatIndian = true,
}: CountUpProps) {
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });

  const [displayVal, setDisplayVal] = useState('0');

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on('change', (latest) => {
      const fixed = Number(latest.toFixed(decimals));
      if (formatIndian) {
        if (decimals > 0) {
          const parts = fixed.toFixed(decimals).split('.');
          const intPart = Number(parts[0]).toLocaleString('en-IN');
          setDisplayVal(`${intPart}.${parts[1]}`);
        } else {
          setDisplayVal(Math.round(fixed).toLocaleString('en-IN'));
        }
      } else {
        setDisplayVal(
          fixed.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        );
      }
    });

    return () => unsubscribe();
  }, [springVal, decimals, formatIndian]);

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {displayVal}
      {suffix}
    </span>
  );
}

export default CountUp;
