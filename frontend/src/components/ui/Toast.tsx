'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: 'success', title, message }),
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: 'error', title, message }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: 'info', title, message }),
    [addToast]
  );

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />,
    error: <AlertCircle className="w-5 h-5 text-[#E4201B]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#FE7E3C]" />,
    info: <Info className="w-5 h-5 text-[#0E6873]" />,
  };

  const borders = {
    success: 'border-[#10B981]/50 bg-[#16363B]/95 shadow-[0_8px_32px_rgba(16,185,129,0.22)]',
    error: 'border-[#E4201B]/50 bg-[#16363B]/95 shadow-[0_8px_32px_rgba(228,32,27,0.25)]',
    warning: 'border-[#FE7E3C]/50 bg-[#16363B]/95 shadow-[0_8px_32px_rgba(254,126,60,0.25)]',
    info: 'border-[#0E6873]/60 bg-[#16363B]/95 shadow-[0_8px_32px_rgba(14,104,115,0.3)]',
  };

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {/* Toast viewport: slide in from bottom-right */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                'relative overflow-hidden pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl',
                borders[t.type]
              )}
            >
              <span className="shrink-0 mt-0.5">{icons[t.type]}</span>
              <div className="flex-1 min-w-0 pr-2">
                <h5 className="font-sans text-sm font-semibold text-[#F8F9FA] tracking-tight">
                  {t.title}
                </h5>
                {t.message && (
                  <p className="font-sans text-xs text-[#C5BDB7] mt-0.5 leading-relaxed">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-[#C5BDB7]/80 hover:text-[#F8F9FA] transition-colors p-1 -mr-1 -mt-1 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Auto-dismiss shrink-bar */}
              {t.duration && t.duration > 0 && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: t.duration / 1000, ease: 'linear' }}
                  className={cn(
                    'absolute bottom-0 left-0 h-[2.5px]',
                    t.type === 'success' && 'bg-[#10B981]',
                    t.type === 'error' && 'bg-[#E4201B]',
                    t.type === 'warning' && 'bg-[#FE7E3C]',
                    t.type === 'info' && 'bg-[#0E6873]'
                  )}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
