'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { GlowButton } from '@/components/ui/GlowButton';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

export interface SendMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SendMoneyModal({ isOpen, onClose, onSuccess }: SendMoneyModalProps) {
  const { t } = useLanguage();
  const { success, warning, error } = useToast();
  const [receiverVpa, setReceiverVpa] = useState('diya@aegis');
  const [amount, setAmount] = useState('1450');
  const [note, setNote] = useState('Design consultancy fee');
  const [isLoading, setIsLoading] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const simulatedScore = parsedAmount > 100000 ? 92 : parsedAmount > 30000 ? 58 : 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverVpa.trim()) {
      error('Missing VPA', 'Please enter a valid @aegis VPA handle.');
      return;
    }
    if (parsedAmount <= 0) {
      error('Invalid Amount', 'Please specify a positive payment amount.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.sendTransaction({
        receiverVpa,
        amount: parsedAmount,
        note,
      });

      if (res.decision === 'BLOCK') {
        error(
          'Transaction Blocked by Autonomous Shield',
          `Risk score ${res.transaction.riskAssessment.score}/100 breached defense threshold.`
        );
      } else if (res.requiresStepUp) {
        warning(
          'Step-Up MFA Required',
          `Elevated ticket size required step-up authorization code.`
        );
      } else {
        success(
          'Payment Cleared & Sealed!',
          `${formatCurrency(parsedAmount)} transferred to ${receiverVpa}. Block committed.`
        );
      }

      onSuccess();
      onClose();
    } catch {
      error('Payment Error', 'Transaction could not be cleared.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('actionSend')}
      description={t('actionSendDesc')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-xs text-[#C5BDB7] mb-1 uppercase tracking-wider">
            {t('enterRecipientVpa')}
          </label>
          <input
            type="text"
            value={receiverVpa}
            onChange={(e) => setReceiverVpa(e.target.value)}
            placeholder="recipient@aegis"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#FE7E3C] font-mono text-sm focus:border-[#FE7E3C] outline-none"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-[#C5BDB7] mb-1 uppercase tracking-wider">
            {t('transferAmount')}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 font-mono text-sm text-[#FE7E3C]">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-sm focus:border-[#FE7E3C] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs text-[#C5BDB7] mb-1 uppercase tracking-wider">
            {t('noteOptional')}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Dinner split, invoice, etc."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-sans text-xs focus:border-[#FE7E3C] outline-none"
          />
        </div>

        {/* AI Risk Score Preview Pill */}
        <div className="p-3 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FE7E3C]" />
            <span className="text-[#C5BDB7]">Neural Risk Rating:</span>
          </div>
          <span
            className={`font-bold ${
              simulatedScore > 80
                ? 'text-[#E4201B]'
                : simulatedScore > 50
                ? 'text-[#FE7E3C]'
                : 'text-[#10B981]'
            }`}
          >
            {simulatedScore}/100 ({simulatedScore > 80 ? 'BLOCK' : simulatedScore > 50 ? 'STEP_UP' : 'ALLOW'})
          </span>
        </div>

        <div className="pt-2 flex justify-end gap-2.5">
          <GlowButton type="button" variant="ghost" size="sm" onClick={onClose}>
            {t('cancel')}
          </GlowButton>
          <GlowButton type="submit" variant="primary" size="md" isLoading={isLoading}>
            {t('confirm')} &amp; Sign
          </GlowButton>
        </div>
      </form>
    </Modal>
  );
}

export interface RequestMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  myVpa?: string;
}

export function RequestMoneyModal({ isOpen, onClose, myVpa = 'aarav@aegis' }: RequestMoneyModalProps) {
  const { t } = useLanguage();
  const { success } = useToast();
  const [payerVpa, setPayerVpa] = useState('vikram@aegis');
  const [requestAmount, setRequestAmount] = useState('2400');
  const [isGenerated, setIsGenerated] = useState(false);

  const qrPayload = `upi://pay?pa=${myVpa}&pn=Aarav%20Mehta&am=${requestAmount}&cu=INR&tn=GUARDIANPAY%20Collect`;

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerated(true);
    success('Collect Link Generated', `Collect request dispatched to ${payerVpa} for ₹${requestAmount}.`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setIsGenerated(false);
        onClose();
      }}
      title={t('actionRequest')}
      description={t('actionRequestDesc')}
    >
      {isGenerated ? (
        <div className="text-center space-y-4 py-2">
          <div className="p-4 rounded-2xl bg-white w-48 h-48 mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(254,126,60,0.3)]">
            <QRCodeSVG value={qrPayload} size={160} level="M" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase text-[#FE7E3C] font-bold">
              Dynamic Collect QR Active
            </span>
            <p className="font-mono text-sm font-bold text-[#F8F9FA] mt-1">
              ₹{parseFloat(requestAmount || '0').toLocaleString('en-IN')}.00
            </p>
            <p className="font-mono text-xs text-[#C5BDB7]">{myVpa}</p>
          </div>
          <GlowButton variant="secondary" size="sm" onClick={onClose} className="w-full">
            Done
          </GlowButton>
        </div>
      ) : (
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block font-mono text-xs text-[#C5BDB7] mb-1 uppercase">
              Payer VPA (@aegis)
            </label>
            <input
              type="text"
              value={payerVpa}
              onChange={(e) => setPayerVpa(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-sm focus:border-[#FE7E3C] outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-[#C5BDB7] mb-1 uppercase">
              Requested Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-mono text-sm text-[#FE7E3C]">₹</span>
              <input
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#122023] border border-[rgba(97,65,60,0.35)] text-[#F8F9FA] font-mono text-sm focus:border-[#FE7E3C] outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <GlowButton type="button" variant="ghost" size="sm" onClick={onClose}>
              {t('cancel')}
            </GlowButton>
            <GlowButton type="submit" variant="primary" size="md">
              Generate Encrypted QR
            </GlowButton>
          </div>
        </form>
      )}
    </Modal>
  );
}

export interface ScanQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned: (vpa: string, amount: number) => void;
}

export function ScanQrModal({ isOpen, onClose, onScanned }: ScanQrModalProps) {
  const { t } = useLanguage();
  const { success } = useToast();
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      success('QR Decrypted', 'Merchant: Blue Tokai Coffee Roasters (bluetokai@aegis) • ₹320.00');
      onScanned('bluetokai@aegis', 320);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('actionScan')}
      description={t('actionScanDesc')}
    >
      <div className="space-y-4 text-center py-2">
        {/* Animated Scanner Viewport */}
        <div className="relative w-64 h-64 mx-auto rounded-2xl bg-[#122023] border-2 border-[rgba(97,65,60,0.4)] overflow-hidden flex items-center justify-center shadow-[0_0_25px_rgba(254,126,60,0.15)]">
          {/* Scanning sweep line */}
          <div className="absolute inset-x-0 h-1 bg-[#FE7E3C] shadow-[0_0_15px_#FE7E3C] animate-[bounce_2s_infinite]" />

          {/* Target reticle corners */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#FE7E3C]" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#FE7E3C]" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#FE7E3C]" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#FE7E3C]" />

          <div className="p-3 bg-[#1A2C30]/80 rounded-xl border border-[rgba(97,65,60,0.3)] text-center">
            <QrCode className="w-12 h-12 text-[#FE7E3C] mx-auto mb-1 opacity-70" />
            <span className="font-mono text-[10px] text-[#C5BDB7]">ALIGN QR MANIFEST</span>
          </div>
        </div>

        <p className="text-xs text-[#C5BDB7] font-sans">
          Simulated hardware camera feeds decode zero-knowledge signed payment payloads.
        </p>

        <GlowButton
          variant="primary"
          size="md"
          isLoading={isScanning}
          onClick={handleSimulateScan}
          className="w-full"
        >
          Simulate Camera Scan (Blue Tokai ₹320)
        </GlowButton>
      </div>
    </Modal>
  );
}

export interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMoneyModal({ isOpen, onClose, onSuccess }: AddMoneyModalProps) {
  const { t } = useLanguage();
  const { success } = useToast();
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);

  const presets = [5000, 10000, 25000, 50000];

  const handleDeposit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      success(
        'Simulated Funds Credited',
        `₹${selectedAmount.toLocaleString('en-IN')} added from simulated partner bank node.`
      );
      onSuccess();
      onClose();
    }, 800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('actionAdd')}
      description="Clearly labeled simulation deposit to test high-volume ledger transfers."
    >
      <div className="space-y-4 py-2">
        {/* Hackathon Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-[#122023] border border-[#FE7E3C]/35 text-[#FE7E3C] text-xs font-mono">
          <span className="font-bold uppercase block mb-0.5">[HACKATHON SIMULATION ONLY]</span>
          No real fiat money is charged or moved. This instantly grants simulated test funds.
        </div>

        <div>
          <label className="block font-mono text-xs text-[#C5BDB7] mb-2 uppercase">
            {t('depositAmount')}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {presets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setSelectedAmount(amt)}
                className={`p-3 rounded-xl font-mono text-sm font-bold border transition-all cursor-pointer ${
                  selectedAmount === amt
                    ? 'border-[#FE7E3C] bg-[#FE7E3C]/15 text-[#FE7E3C] shadow-[0_0_15px_rgba(254,126,60,0.2)]'
                    : 'border-[rgba(97,65,60,0.35)] bg-[#122023] text-[#F8F9FA] hover:border-[rgba(254,126,60,0.4)]'
                }`}
              >
                +₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2.5">
          <GlowButton type="button" variant="ghost" size="sm" onClick={onClose}>
            {t('cancel')}
          </GlowButton>
          <GlowButton
            type="button"
            variant="primary"
            size="md"
            isLoading={isLoading}
            onClick={handleDeposit}
          >
            Credit ₹{selectedAmount.toLocaleString('en-IN')} Now
          </GlowButton>
        </div>
      </div>
    </Modal>
  );
}
