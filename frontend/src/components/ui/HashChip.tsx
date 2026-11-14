'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { truncateHash, cn } from '@/lib/utils';

export interface HashChipProps {
  hash: string;
  startLength?: number;
  endLength?: number;
  label?: string;
  className?: string;
  truncate?: boolean;
}

export function HashChip({
  hash,
  startLength = 6,
  endLength = 4,
  label,
  className,
  truncate = true,
}: HashChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const truncated = truncate ? truncateHash(hash, startLength, endLength) : hash;

  return (
    <div
      title={hash}
      onClick={handleCopy}
      className={cn(
        'group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono tabular-nums text-xs bg-[#0E6873]/25 hover:bg-[#0E6873]/45 border border-[rgba(97,65,60,0.35)] hover:border-[rgba(254,126,60,0.5)] text-[#C5BDB7] hover:text-[#FE7E3C] transition-all duration-200 cursor-pointer select-none shadow-sm',
        copied && 'border-[#10B981]/50 text-[#10B981]',
        className
      )}
    >
      {label && (
        <span className="text-[10px] uppercase font-bold text-[#C5BDB7] border-r border-[rgba(97,65,60,0.3)] pr-1.5 mr-0.5">
          {label}
        </span>
      )}
      <span className="tracking-wider">{truncated}</span>
      <button
        type="button"
        className="text-[#C5BDB7] group-hover:text-[#FE7E3C] transition-colors p-0.5"
        aria-label={copied ? 'Copied to clipboard' : 'Copy hash to clipboard'}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-[#10B981]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Mini popup tooltip on copy */}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#16363B] border border-[#10B981] text-[#10B981] text-[10px] rounded shadow-lg whitespace-nowrap animate-in fade-in">
          Copied!
        </span>
      )}
    </div>
  );
}

export default HashChip;
