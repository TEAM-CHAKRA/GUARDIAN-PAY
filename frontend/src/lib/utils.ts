import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel, TransactionStatus, PaymentDecision } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, showDecimals = true): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function truncateHash(hash: string, startLength = 6, endLength = 4): string {
  if (!hash) return '';
  if (hash.length <= startLength + endLength) return hash;
  return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
}

export function formatUtr(utr: string): string {
  if (!utr) return '';
  // Format as 4-4-4
  return utr.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
}

export function formatDate(dateString?: string | number | Date | null): string {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'Recently';
  }
}

export function getRiskColor(score: number): {
  color: string;
  level: RiskLevel;
  glow: string;
  bg: string;
  border: string;
} {
  if (score <= 30) {
    return {
      color: '#10B981',
      level: 'LOW',
      glow: 'rgba(16, 185, 129, 0.4)',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.25)',
    };
  }
  if (score <= 60) {
    return {
      color: '#FE7E3C',
      level: 'MEDIUM',
      glow: 'rgba(254, 126, 60, 0.4)',
      bg: 'rgba(254, 126, 60, 0.08)',
      border: 'rgba(254, 126, 60, 0.25)',
    };
  }
  if (score <= 80) {
    return {
      color: '#D9531E',
      level: 'HIGH',
      glow: 'rgba(217, 83, 30, 0.4)',
      bg: 'rgba(217, 83, 30, 0.08)',
      border: 'rgba(217, 83, 30, 0.25)',
    };
  }
  return {
    color: '#E4201B',
    level: 'CRITICAL',
    glow: 'rgba(228, 32, 27, 0.4)',
    bg: 'rgba(228, 32, 27, 0.08)',
    border: 'rgba(228, 32, 27, 0.25)',
  };
}

export function getStatusConfig(status: TransactionStatus): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  pulse?: boolean;
} {
  switch (status) {
    case 'INITIATED':
      return {
        label: 'Initiated',
        color: '#C5BDB7',
        bgColor: 'rgba(197, 189, 183, 0.1)',
        borderColor: 'rgba(197, 189, 183, 0.25)',
      };
    case 'RISK_CHECK':
      return {
        label: 'Risk Check',
        color: '#0E6873',
        bgColor: 'rgba(14, 104, 115, 0.2)',
        borderColor: 'rgba(14, 104, 115, 0.45)',
        pulse: true,
      };
    case 'AUTHORIZED':
      return {
        label: 'Authorized',
        color: '#FE7E3C',
        bgColor: 'rgba(254, 126, 60, 0.12)',
        borderColor: 'rgba(254, 126, 60, 0.35)',
      };
    case 'DEBITED':
      return {
        label: 'Debited',
        color: '#61413C',
        bgColor: 'rgba(97, 65, 60, 0.15)',
        borderColor: 'rgba(97, 65, 60, 0.35)',
      };
    case 'CREDITED':
      return {
        label: 'Credited',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
      };
    case 'SUCCESS':
      return {
        label: 'Success',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
      };
    case 'FAILED':
      return {
        label: 'Failed',
        color: '#E4201B',
        bgColor: 'rgba(228, 32, 27, 0.12)',
        borderColor: 'rgba(228, 32, 27, 0.35)',
      };
    case 'REVERSED':
      return {
        label: 'Reversed',
        color: '#FE7E3C',
        bgColor: 'rgba(254, 126, 60, 0.12)',
        borderColor: 'rgba(254, 126, 60, 0.35)',
      };
    case 'HELD':
      return {
        label: 'Held in Escrow',
        color: '#FE7E3C',
        bgColor: 'rgba(254, 126, 60, 0.12)',
        borderColor: 'rgba(254, 126, 60, 0.35)',
        pulse: true,
      };
    case 'BLOCKED':
      return {
        label: 'Shield Blocked',
        color: '#E4201B',
        bgColor: 'rgba(228, 32, 27, 0.12)',
        borderColor: 'rgba(228, 32, 27, 0.35)',
      };
    case 'PENDING':
      return {
        label: 'Step-Up Required',
        color: '#0E6873',
        bgColor: 'rgba(14, 104, 115, 0.2)',
        borderColor: 'rgba(14, 104, 115, 0.45)',
        pulse: true,
      };
    default:
      return {
        label: String(status),
        color: '#C5BDB7',
        bgColor: 'rgba(197, 189, 183, 0.1)',
        borderColor: 'rgba(197, 189, 183, 0.25)',
      };
  }
}

export function getDecisionConfig(decision: PaymentDecision): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  switch (decision) {
    case 'ALLOW':
      return {
        label: 'ALLOW',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        description: 'Payment verified and cleared instantly',
      };
    case 'STEP_UP':
      return {
        label: 'STEP UP',
        color: '#FE7E3C',
        bgColor: 'rgba(254, 126, 60, 0.12)',
        description: 'Requires multi-factor authentication check',
      };
    case 'HOLD':
      return {
        label: 'HOLD',
        color: '#61413C',
        bgColor: 'rgba(97, 65, 60, 0.2)',
        description: 'Held in quarantine for manual fraud analyst review',
      };
    case 'BLOCK':
      return {
        label: 'BLOCK',
        color: '#E4201B',
        bgColor: 'rgba(228, 32, 27, 0.12)',
        description: 'High-risk anomaly detected; transaction rejected',
      };
  }
}
