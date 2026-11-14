'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ExternalLink,
  Search,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { analyzeLink } from '@/lib/linkScanner';
import { api } from '@/lib/api';

interface Indicator {
  key: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  description: string;
}

interface VerificationResult {
  url: string;
  isValid: boolean;
  hostname?: string;
  protocol?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  action: 'allow' | 'warn' | 'block';
  indicators: Indicator[];
  explanation: string;
  safeMessage: string;
  analyzedAt: string;
  verificationToken: string | null;
}

function VerifyLinkContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || '';

  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ackWarning, setAckWarning] = useState(false);

  const analyzeUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAckWarning(false);

    try {
      // First attempt API route or backend
      const res = await fetch('/api/links/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResult(data);
          return;
        }
      }

      // If response not ok, analyze directly using universal threat scanner
      const clientResult = analyzeLink(targetUrl.trim());
      setResult(clientResult);
    } catch {
      // Offline / Network fallback: Run local client-side analysis
      const clientResult = analyzeLink(targetUrl.trim());
      setResult(clientResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (initialUrl) {
      analyzeUrl(initialUrl);
    }
  }, [initialUrl]);

  const quickScenarios = [
    {
      label: 'Verified Official',
      url: 'https://npci.org.in/what-we-do/upi',
      type: 'safe',
    },
    {
      label: 'Obscured Shortener',
      url: 'https://bit.ly/claim-refund-2026',
      type: 'warn',
    },
    {
      label: 'Brand Phishing (.top)',
      url: 'https://guardianpay-kyc-verify.top/claim',
      type: 'danger',
    },
    {
      label: 'Malware APK Download',
      url: 'https://bank-rewards.xyz/bonus.apk',
      type: 'danger',
    },
    {
      label: 'SSRF Localhost Exploit',
      url: 'http://127.0.0.1:4000/api/admin',
      type: 'danger',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#0E6873]/30 text-[#0E6873] border border-[#0E6873]/40">
              PHASE 6 SHIELD
            </span>
            <span className="text-xs text-[#C5BDB7]/60">Cryptographic Link Quarantine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8F9FA]">
            Payment Link Security Scanner
          </h1>
          <p className="text-sm text-[#C5BDB7] mt-1">
            Analyze untrusted payment links and external URLs before navigation. Prevents phishing, typosquatting, SSRF, and credential interception.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <GlassCard className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            analyzeUrl(inputUrl);
          }}
          className="space-y-4"
        >
          <label className="block text-xs font-mono uppercase tracking-wider text-[#C5BDB7]">
            Destination Payment URL / Protected Link
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C5BDB7]/50" />
              <input
                type="text"
                placeholder="Paste payment link (e.g. https://guardianpay-kyc-verify.top/claim)"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#122023] border border-[#61413C]/40 text-[#F8F9FA] text-sm focus:outline-none focus:border-[#FE7E3C] transition-colors font-mono"
              />
            </div>
            <GlowButton
              type="submit"
              disabled={isAnalyzing || !inputUrl.trim()}
              className="flex items-center justify-center gap-2 px-6"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Inspect Link</span>
                </>
              )}
            </GlowButton>
          </div>

          {/* Quick Demos */}
          <div className="pt-2">
            <span className="text-xs font-mono text-[#C5BDB7]/70 mr-2">Try Demo Scenarios:</span>
            <div className="inline-flex flex-wrap gap-2 mt-1">
              {quickScenarios.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputUrl(s.url);
                    analyzeUrl(s.url);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                    s.type === 'safe'
                      ? 'border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/10'
                      : s.type === 'warn'
                      ? 'border-[#FE7E3C]/40 text-[#FE7E3C] hover:bg-[#FE7E3C]/10'
                      : 'border-[#E4201B]/40 text-[#E4201B] hover:bg-[#E4201B]/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </GlassCard>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#E4201B]/15 border border-[#E4201B]/40 flex items-center gap-3 text-sm text-[#F8F9FA]">
          <AlertTriangle className="w-5 h-5 text-[#E4201B] flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Top Banner based on Action */}
          <div
            className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              result.action === 'block'
                ? 'bg-[#E4201B]/15 border-[#E4201B]/50'
                : result.action === 'warn'
                ? 'bg-[#FE7E3C]/15 border-[#FE7E3C]/50'
                : 'bg-[#10B981]/15 border-[#10B981]/50'
            }`}
          >
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`p-3 rounded-xl flex-shrink-0 ${
                  result.action === 'block'
                    ? 'bg-[#E4201B]/20 text-[#E4201B]'
                    : result.action === 'warn'
                    ? 'bg-[#FE7E3C]/20 text-[#FE7E3C]'
                    : 'bg-[#10B981]/20 text-[#10B981]'
                }`}
              >
                {result.action === 'block' ? (
                  <ShieldX className="w-8 h-8" />
                ) : result.action === 'warn' ? (
                  <ShieldAlert className="w-8 h-8" />
                ) : (
                  <ShieldCheck className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider opacity-80">
                    Policy Decision
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                      result.action === 'block'
                        ? 'bg-[#E4201B] text-white'
                        : result.action === 'warn'
                        ? 'bg-[#FE7E3C] text-black'
                        : 'bg-[#10B981] text-black'
                    }`}
                  >
                    {result.action}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#F8F9FA] mt-0.5">{result.safeMessage}</h3>
                <p className="text-xs text-[#C5BDB7] mt-0.5">{result.explanation}</p>
              </div>
            </div>

            {/* Score Pill */}
            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
              <span className="text-xs font-mono text-[#C5BDB7]">Risk Score</span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-3xl font-black font-mono ${
                    result.action === 'block'
                      ? 'text-[#E4201B]'
                      : result.action === 'warn'
                      ? 'text-[#FE7E3C]'
                      : 'text-[#10B981]'
                  }`}
                >
                  {result.riskScore}
                </span>
                <span className="text-xs font-mono text-[#C5BDB7]/60">/100</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Breakdown */}
            <GlassCard className="p-5 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#C5BDB7] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#0E6873]" />
                Technical Telemetry
              </h4>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-[#61413C]/20">
                  <span className="text-[#C5BDB7]/70">Target URL</span>
                  <span className="text-[#F8F9FA] truncate max-w-[220px]" title={result.url}>
                    {result.url}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#61413C]/20">
                  <span className="text-[#C5BDB7]/70">Resolved Host</span>
                  <span className="text-[#F8F9FA]">{result.hostname || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#61413C]/20">
                  <span className="text-[#C5BDB7]/70">Protocol</span>
                  <span className="text-[#F8F9FA]">{result.protocol || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#61413C]/20">
                  <span className="text-[#C5BDB7]/70">Risk Level</span>
                  <span className="uppercase text-[#FE7E3C] font-semibold">{result.riskLevel}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#C5BDB7]/70">Analyzed At</span>
                  <span className="text-[#F8F9FA]">{new Date(result.analyzedAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </GlassCard>

            {/* Threat Indicators */}
            <GlassCard className="p-5 space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#C5BDB7] flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FE7E3C]" />
                Detected Threat Indicators ({result.indicators.length})
              </h4>
              {result.indicators.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Zero structural threats or phishing indicators detected.</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {result.indicators.map((ind, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        ind.severity === 'critical'
                          ? 'bg-[#E4201B]/10 border-[#E4201B]/40 text-[#F8F9FA]'
                          : ind.severity === 'high'
                          ? 'bg-[#FE7E3C]/10 border-[#FE7E3C]/40 text-[#F8F9FA]'
                          : 'bg-[#0E6873]/10 border-[#0E6873]/40 text-[#F8F9FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F8F9FA]">{ind.label}</span>
                        <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40">
                          {ind.severity}
                        </span>
                      </div>
                      <p className="text-[#C5BDB7] text-[11px] leading-relaxed">{ind.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Action Footer */}
          <GlassCard className="p-5">
            {result.action === 'block' ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                <div className="text-[#E4201B] flex items-center gap-2">
                  <ShieldX className="w-4 h-4 flex-shrink-0" />
                  <span>Automated policy forbids redirecting to critical threat destinations.</span>
                </div>
                <button
                  disabled
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gray-700/50 text-gray-400 font-mono text-xs cursor-not-allowed opacity-60"
                >
                  Redirect Disabled
                </button>
              </div>
            ) : result.action === 'warn' ? (
              <div className="space-y-4">
                <label className="flex items-start gap-2.5 text-xs text-[#C5BDB7] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ackWarning}
                    onChange={(e) => setAckWarning(e.target.checked)}
                    className="mt-0.5 rounded bg-[#122023] border-[#61413C] text-[#FE7E3C] focus:ring-[#FE7E3C]"
                  />
                  <span>
                    I understand that this link exhibits deceptive characteristics and may attempt to intercept payments.
                  </span>
                </label>
                <div className="flex justify-end">
                  <a
                    href={
                      ackWarning && result.verificationToken
                        ? `/api/links/redirect?token=${encodeURIComponent(
                            result.verificationToken
                          )}&acknowledgeWarning=true`
                        : '#'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all ${
                      ackWarning
                        ? 'bg-[#FE7E3C] text-black hover:bg-[#FE7E3C]/90 shadow-lg shadow-[#FE7E3C]/20'
                        : 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    <span>Proceed Anyway</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-mono text-[#10B981] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Destination verified safe. Cryptographic token generated.</span>
                </span>
                <a
                  href={`/api/links/redirect?token=${encodeURIComponent(result.verificationToken || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#10B981] text-black font-mono text-xs font-bold hover:bg-[#10B981]/90 shadow-lg shadow-[#10B981]/20 transition-all"
                >
                  <span>Continue to Destination</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default function VerifyLinkPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center font-mono text-xs text-[#C5BDB7]">Loading Security Scanner...</div>}>
        <VerifyLinkContent />
      </Suspense>
    </AppShell>
  );
}
