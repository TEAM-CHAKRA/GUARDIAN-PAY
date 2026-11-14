import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { LanguageProvider } from '@/lib/LanguageContext';
import { RiskTintProvider } from '@/lib/RiskTintContext';
import { SiteBackground } from '@/components/background/SiteBackground';
import { TopProgressBar } from '@/components/layout/TopProgressBar';

export const metadata: Metadata = {
  title: 'GUARDIANPAY — Every rupee, protected intelligently.',
  description:
    'Smart digital wallet with AI-powered fraud detection, transaction risk scoring, secure payment simulation, and cryptographic ledger verification.',
  keywords: [
    'fintech',
    'fraud detection',
    'AI security',
    'digital wallet',
    'SHA-256 ledger',
    'UPI simulation',
    'cyber security',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#1A2C30] text-[#F8F9FA] antialiased selection:bg-[#FE7E3C]/20 selection:text-white relative">
        <RiskTintProvider>
          <LanguageProvider>
            <ToastProvider>
              {/* Global Top Progress Bar on route changes */}
              <TopProgressBar />

              {/* 5-Layered Master Site Background */}
              <SiteBackground />

              {children}
            </ToastProvider>
          </LanguageProvider>
        </RiskTintProvider>
      </body>
    </html>
  );
}
