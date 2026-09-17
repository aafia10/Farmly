import React from "react";
import { Navbar } from "@/components/navigation/navbar";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Ecosystem } from "@/components/landing/ecosystem";
import { WhyFarmly } from "@/components/landing/why-farmly";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/navigation/footer";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-farmly-bg flex flex-col justify-between">
      {/* Top Sticky Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-grow">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Features />
        <Ecosystem />
        <WhyFarmly />
        <CTASection />
      </main>

      {/* Bottom Global Footer */}
      <Footer />
    </div>
  );
}
