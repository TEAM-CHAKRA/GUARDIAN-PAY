'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ChevronLeft,
  QrCode,
  Copy,
  Check,
  Download,
  Share2,
  ShieldCheck,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardTopBar } from '@/components/layout/DashboardTopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { CollectRequest } from '@/lib/types';
import { api } from '@/lib/api';

export default function ReceivePage() {
  const { success, error: toastError, info } = useToast();

  const userVpa = 'aarav@aegis';
  const userName = 'Aarav Mehta';
  const qrRef = useRef<HTMLDivElement>(null);

  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);

  // Dynamic QR amount customization (optional)
  const [customQrAmount, setCustomQrAmount] = useState<string>('');

  // Collect Request Form state
  const [payerVpa, setPayerVpa] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectNote, setCollectNote] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [isSubmittingCollect, setIsSubmittingCollect] = useState(false);

  // Collect requests list
  const [collectRequests, setCollectRequests] = useState<CollectRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Payload for QR
  const qrPayload = customQrAmount && parseFloat(customQrAmount) > 0
    ? `upi://pay?pa=${userVpa}&pn=${encodeURIComponent(userName)}&am=${parseFloat(customQrAmount).toFixed(2)}&cu=INR&orgid=GUARDIANPAY_SANDBOX`
    : `upi://pay?pa=${userVpa}&pn=${encodeURIComponent(userName)}&cu=INR&orgid=GUARDIANPAY_SANDBOX`;

  const fetchCollectRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const list = await api.getCollectRequests();
      setCollectRequests(list);
    } catch (err: any) {
      toastError('Could not refresh collect requests.');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchCollectRequests();
  }, []);

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(userVpa);
    setCopiedVpa(true);
    success(`VPA "${userVpa}" copied to clipboard.`);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleCopyPaymentDetails = () => {
    const details = `Pay to: ${userName}\nUPI ID: ${userVpa}\nRouting Network: GUARDIANPAY Consensus Vault\nPayload: ${qrPayload}`;
    navigator.clipboard.writeText(details);
    setCopiedDetails(true);
    success('Payment details copied to clipboard.');
    setTimeout(() => setCopiedDetails(false), 2000);
  };

  const handleDownloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) {
      toastError('Unable to generate QR image.');
      return;
    }

    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `guardianpay-qr-${userVpa.replace('@', '-')}.png`;
    a.click();
    success('QR Code downloaded as PNG image.');
  };

  const handleShareQr = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pay ${userName} on GUARDIANPAY`,
          text: `Scan or pay to ${userVpa} using GUARDIANPAY secure simulated gateway.`,
          url: window.location.href,
        });
        success('Shared successfully.');
        return;
      } catch (e) {
        // Fallback to copy
      }
    }
    handleCopyPaymentDetails();
  };

  const handleCreateCollectRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerVpa.trim()) {
      toastError('Please specify the payer UPI ID.');
      return;
    }

    const amt = parseFloat(collectAmount);
    if (isNaN(amt) || amt <= 0) {
      toastError('Please enter a valid amount to collect.');
      return;
    }

    setIsSubmittingCollect(true);
    try {
      const newReq = await api.createCollectRequest({
        payerVpa: payerVpa.trim(),
        amount: amt,
        note: collectNote.trim() || undefined,
        expiryHours,
      });

      success(`Collect request for ₹${amt.toLocaleString('en-IN')} sent to ${payerVpa.trim()}`);
      setPayerVpa('');
      setCollectAmount('');
      setCollectNote('');
      fetchCollectRequests();
    } catch (err: any) {
      toastError(err.message || 'Failed to dispatch collect request.');
    } finally {
      setIsSubmittingCollect(false);
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    try {
      await api.cancelCollectRequest(reqId);
      success('Collect request cancelled.');
      fetchCollectRequests();
    } catch (err: any) {
      toastError('Failed to cancel request.');
    }
  };

  return (
    <AppShell>
      <DashboardTopBar userName="Aarav Mehta" userVpa="aarav@aegis" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FE7E3C]/10 border border-[#FE7E3C]/25 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#FE7E3C] uppercase font-bold">
                INBOUND SETTLEMENT HUB
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-[#F8F9FA]">
              Receive Money & QR
            </h1>
            <p className="text-xs sm:text-sm text-[#C5BDB7] mt-1">
              Share your verifiable payment identifier or issue structured collect requests.
            </p>
          </div>

          {/* Simulation disclaimer pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FE7E3C]/10 border border-[#FE7E3C]/25 text-[#FE7E3C] text-xs font-mono">
            <Info className="w-4 h-4 shrink-0" />
            <span>Sandbox Mode: Zero real bank debits occur</span>
          </div>
        </div>

        {/* Main Grid: Left = QR & VPA Card, Right = Collect Request System */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: QR Code & Payment ID Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] text-center relative overflow-hidden">
              {/* Corner Cyber Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FE7E3C] rounded-tl-xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FE7E3C] rounded-tr-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FE7E3C] rounded-bl-xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FE7E3C] rounded-br-xl pointer-events-none" />

              {/* Title & Brand */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(97,65,60,0.25)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FE7E3C]/20 border border-[#FE7E3C]/40 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-[#FE7E3C]">₹</span>
                  </div>
                  <span className="text-xs font-mono tracking-wider font-bold text-[#F8F9FA]">
                    GUARDIAN<span className="text-[#FE7E3C]">PAY</span> QR
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED KYC
                </span>
              </div>

              {/* User Identity Details */}
              <div className="mb-5">
                <h3 className="text-lg font-display font-bold text-[#F8F9FA]">{userName}</h3>
                <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-lg bg-[#122023] border border-[rgba(97,65,60,0.35)]">
                  <span className="font-mono text-xs text-[#FE7E3C] font-semibold">{userVpa}</span>
                  <button
                    onClick={handleCopyVpa}
                    className="text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors p-0.5"
                    title="Copy UPI ID"
                  >
                    {copiedVpa ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* QR Container */}
              <div
                ref={qrRef}
                className="inline-block p-4 rounded-2xl bg-white shadow-[0_0_30px_rgba(254,126,60,0.25)] border-2 border-[#FE7E3C]/50 mx-auto transition-transform hover:scale-[1.02]"
              >
                <QRCodeCanvas
                  value={qrPayload}
                  size={200}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#1A2C30"
                  marginSize={1}
                />
              </div>

              {/* Dynamic QR optional amount preset */}
              <div className="mt-4 pt-3 border-t border-[rgba(97,65,60,0.25)]">
                <label className="text-[11px] font-mono text-[#C5BDB7] block mb-1.5">
                  Embed Specific Amount into QR (Optional)
                </label>
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#FE7E3C]">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={customQrAmount}
                      onChange={(e) => setCustomQrAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-lg text-xs font-mono text-[#F8F9FA] placeholder-[#C5BDB7] focus:outline-none focus:border-[#FE7E3C]"
                    />
                  </div>
                  {customQrAmount && (
                    <button
                      onClick={() => setCustomQrAmount('')}
                      className="text-[10px] font-mono text-[#E4201B] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <GlowButton
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadQr}
                  leftIcon={<Download className="w-3.5 h-3.5 mr-1.5" />}
                >
                  Download QR
                </GlowButton>
                <GlowButton
                  variant="secondary"
                  size="sm"
                  onClick={handleShareQr}
                  leftIcon={<Share2 className="w-3.5 h-3.5 mr-1.5" />}
                >
                  Share QR
                </GlowButton>
              </div>

              <div className="mt-3">
                <button
                  onClick={handleCopyPaymentDetails}
                  className="w-full py-2 text-xs font-mono text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiedDetails ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-[#10B981]">Payment Details Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Payment Details</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-[#C5BDB7] font-mono mt-3">
                Scannable by any UPI app simulator in the Aegis testnet envelope.
              </p>
            </GlassCard>

            {/* Quick Tips */}
            <GlassCard className="p-4 border-[rgba(97,65,60,0.35)] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#FE7E3C] font-mono font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Instant Inbound Verification</span>
              </div>
              <p className="text-[#C5BDB7] leading-relaxed">
                When another user sends funds to your VPA or scans this QR, GUARDIANPAY runs real-time SHA-256 dual-entry ledger reconciliation within 400ms.
              </p>
            </GlassCard>
          </div>

          {/* RIGHT: Collect Request Creation & Live Collects (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Create Collect Request Form */}
            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)]">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(97,65,60,0.25)]">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#FE7E3C]" />
                  <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                    Request Money (UPI Collect)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#FE7E3C] bg-[#FE7E3C]/10 px-2 py-0.5 rounded border border-[#FE7E3C]/20">
                  PEER PULL
                </span>
              </div>

              <form onSubmit={handleCreateCollectRequest} className="space-y-4">
                {/* Payer VPA */}
                <div>
                  <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                    Payer UPI ID (VPA) <span className="text-[#E4201B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. diya@aegis, vikram@aegis"
                    value={payerVpa}
                    onChange={(e) => setPayerVpa(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs font-mono text-[#F8F9FA] placeholder-[#C5BDB7] focus:outline-none focus:border-[#FE7E3C] focus:ring-1 focus:ring-[#FE7E3C]/40"
                  />
                  {/* Preset quick fills */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-[#C5BDB7]">Quick Pick:</span>
                    {['diya@aegis', 'vikram@aegis', 'ananya@aegis'].map((vpa) => (
                      <button
                        key={vpa}
                        type="button"
                        onClick={() => setPayerVpa(vpa)}
                        className="text-[10px] font-mono text-[#FE7E3C] hover:underline"
                      >
                        {vpa.split('@')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount and Expiry Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount */}
                  <div>
                    <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                      Requested Amount (INR) <span className="text-[#E4201B]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-[#FE7E3C]">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        placeholder="0.00"
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        className="w-full pl-8 pr-3.5 py-2.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs font-mono text-[#F8F9FA] placeholder-[#C5BDB7] focus:outline-none focus:border-[#FE7E3C] focus:ring-1 focus:ring-[#FE7E3C]/40"
                      />
                    </div>
                  </div>

                  {/* Expiry */}
                  <div>
                    <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                      Request Expiration Window
                    </label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs font-mono text-[#F8F9FA] focus:outline-none focus:border-[#FE7E3C] cursor-pointer"
                    >
                      <option value={1}>Expires in 1 Hour</option>
                      <option value={6}>Expires in 6 Hours</option>
                      <option value={24}>Expires in 24 Hours</option>
                      <option value={72}>Expires in 3 Days</option>
                    </select>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="text-xs font-mono text-[#C5BDB7] block mb-1.5">
                    Purpose / Split Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner split, Freelance invoice, Cab fare"
                    value={collectNote}
                    onChange={(e) => setCollectNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#122023] border border-[rgba(97,65,60,0.35)] rounded-xl text-xs text-[#F8F9FA] placeholder-[#C5BDB7] focus:outline-none focus:border-[#FE7E3C]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <GlowButton
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={isSubmittingCollect}
                    rightIcon={<ArrowRight className="w-4 h-4 ml-1.5" />}
                  >
                    Issue Collect Request
                  </GlowButton>
                </div>
              </form>
            </GlassCard>

            {/* Active & Historical Collect Requests */}
            <GlassCard className="p-6 border-[rgba(97,65,60,0.35)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(97,65,60,0.25)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FE7E3C]" />
                  <h3 className="font-display font-bold text-base text-[#F8F9FA]">
                    Collect Request Portfolio
                  </h3>
                </div>
                <button
                  onClick={fetchCollectRequests}
                  className="p-1 rounded-lg text-[#C5BDB7] hover:text-[#FE7E3C] transition-colors"
                  title="Refresh List"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingRequests ? (
                <div className="space-y-3 py-4">
                  <div className="h-14 bg-[#122023] rounded-xl animate-pulse" />
                  <div className="h-14 bg-[#122023] rounded-xl animate-pulse" />
                </div>
              ) : collectRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#C5BDB7] font-mono">
                  No active or past collect requests found.
                </div>
              ) : (
                <div className="space-y-3">
                  {collectRequests.map((req) => {
                    const isPending = req.status === 'PENDING';
                    const isApproved = req.status === 'APPROVED';
                    const isDeclined = req.status === 'DECLINED' || req.status === 'EXPIRED';

                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl bg-[#122023]/60 border border-[rgba(97,65,60,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#FE7E3C]">
                              {req.id}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                isPending
                                  ? 'text-[#FE7E3C] bg-[#FE7E3C]/10 border-[#FE7E3C]/30'
                                  : isApproved
                                  ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                                  : 'text-[#C5BDB7] bg-[#C5BDB7]/10 border-[#C5BDB7]/30'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="text-xs">
                            <span className="text-[#C5BDB7]">To: </span>
                            <span className="font-mono text-[#F8F9FA] font-semibold">
                              {req.payerVpa}
                            </span>
                          </div>

                          {req.note && (
                            <p className="text-[11px] text-[#C5BDB7]">{req.note}</p>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                          <span className="font-mono font-black text-sm text-[#F8F9FA]">
                            ₹{req.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>

                          {isPending && (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              className="text-[10px] font-mono text-[#E4201B] hover:underline"
                            >
                              Cancel Request
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
