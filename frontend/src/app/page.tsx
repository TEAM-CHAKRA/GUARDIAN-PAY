'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/landing/HeroSection';
import AboutPreviewSection from '@/components/landing/AboutPreviewSection';
import FeatureGrid from '@/components/landing/FeatureGrid';
import HowItWorksPipeline from '@/components/landing/HowItWorksPipeline';
import FraudProtectionSection from '@/components/landing/FraudProtectionSection';
import SecurityTechSection from '@/components/landing/SecurityTechSection';
import WhyGuardianPaySection from '@/components/landing/WhyGuardianPaySection';
import FinalCtaSection from '@/components/landing/FinalCtaSection';
import SectionDivider from '@/components/landing/SectionDivider';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-transparent text-[#F8F9FA] overflow-x-hidden">
      {/* Sticky Navigation (Only 4 items: Home, About Us, Login, Register) */}
      <Navbar />

      {/* Main Content: 8 sections in strict order with dividers */}
      <main className="relative z-10 flex flex-col">
        {/* 1. Hero Section */}
        <HeroSection />

        <SectionDivider />

        {/* 2. About GUARDIANPAY Preview */}
        <AboutPreviewSection />

        <SectionDivider />

        {/* 3. Features Section */}
        <FeatureGrid />

        <SectionDivider />

        {/* 4. How It Works Section */}
        <HowItWorksPipeline />

        <SectionDivider />

        {/* 5. AI Fraud Protection Section */}
        <FraudProtectionSection />

        <SectionDivider />

        {/* 6. Security & Technology Section */}
        <SecurityTechSection />

        <SectionDivider />

        {/* 7. Why GUARDIANPAY Section */}
        <WhyGuardianPaySection />

        <SectionDivider />

        {/* 8. Final CTA Section */}
        <FinalCtaSection />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
