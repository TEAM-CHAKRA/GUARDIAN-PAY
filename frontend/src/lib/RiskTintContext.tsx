'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type RiskTintLevel = 'safe' | 'warn' | 'hold' | 'danger';

interface RiskTintContextType {
  riskTint: RiskTintLevel;
  setRiskTint: (tint: RiskTintLevel, autoRevertMs?: number) => void;
}

const RiskTintContext = createContext<RiskTintContextType>({
  riskTint: 'safe',
  setRiskTint: () => {},
});

export function RiskTintProvider({ children }: { children: React.ReactNode }) {
  const [riskTint, setRiskTintState] = useState<RiskTintLevel>('safe');
  const revertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setRiskTint = useCallback((tint: RiskTintLevel, autoRevertMs?: number) => {
    if (revertTimeoutRef.current) {
      clearTimeout(revertTimeoutRef.current);
      revertTimeoutRef.current = null;
    }
    setRiskTintState(tint);

    if (autoRevertMs && autoRevertMs > 0) {
      revertTimeoutRef.current = setTimeout(() => {
        setRiskTintState('safe');
      }, autoRevertMs);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (revertTimeoutRef.current) {
        clearTimeout(revertTimeoutRef.current);
      }
    };
  }, []);

  return (
    <RiskTintContext.Provider value={{ riskTint, setRiskTint }}>
      {children}
    </RiskTintContext.Provider>
  );
}

export function useRiskTint() {
  return useContext(RiskTintContext);
}
