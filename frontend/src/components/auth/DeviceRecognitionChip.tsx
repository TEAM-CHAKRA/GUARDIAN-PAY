'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Laptop, Smartphone, Clock, MapPin, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DeviceInfo {
  deviceName: string;
  browser: string;
  os: string;
  location: string;
  approxTime: string;
  isRecognized: boolean;
}

export interface DeviceRecognitionChipProps {
  device: DeviceInfo;
  onToggleSimulated?: () => void;
  className?: string;
}

export function DeviceRecognitionChip({
  device,
  onToggleSimulated,
  className,
}: DeviceRecognitionChipProps) {
  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200',
        device.isRecognized
          ? 'bg-[#0E6873]/20 border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
          : 'bg-[#61413C]/25 border-[#FE7E3C]/40 shadow-[0_0_20px_rgba(254,126,60,0.12)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {device.isRecognized ? (
            <div className="p-1 rounded-md bg-[#10B981]/15 text-[#10B981]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1 rounded-md bg-[#FE7E3C]/15 text-[#FE7E3C]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          )}

          <span
            className={cn(
              'font-mono text-xs font-bold uppercase tracking-wider',
              device.isRecognized ? 'text-[#10B981]' : 'text-[#FE7E3C]'
            )}
          >
            {device.isRecognized ? 'Recognized Device' : 'New Device Warning'}
          </span>
        </div>

        {onToggleSimulated && (
          <button
            type="button"
            onClick={onToggleSimulated}
            className="text-[10px] font-mono text-[#FE7E3C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Toggle Test Device</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#C5BDB7]">
        <div className="flex items-center gap-1.5 truncate">
          <Smartphone className="w-3.5 h-3.5 text-[#C5BDB7] shrink-0" />
          <span className="truncate">{device.deviceName}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <Laptop className="w-3.5 h-3.5 text-[#C5BDB7] shrink-0" />
          <span className="truncate">{device.browser}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#C5BDB7] shrink-0" />
          <span className="truncate">{device.location}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <Clock className="w-3.5 h-3.5 text-[#C5BDB7] shrink-0" />
          <span className="truncate">{device.approxTime}</span>
        </div>
      </div>

      {!device.isRecognized && (
        <p className="mt-2 pt-2 border-t border-[rgba(254,126,60,0.25)] text-[10px] text-[#FE7E3C] font-sans">
          Notice: This device has not been previously paired with your hardware enclave.
          Step-up OTP verification will be required.
        </p>
      )}
    </div>
  );
}

export default DeviceRecognitionChip;
