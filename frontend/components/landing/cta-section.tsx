"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden" aria-labelledby="cta-heading">
      <div className="container mx-auto max-w-5xl">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-farmly-dark-green via-farmly-surface-elevated to-farmly-surface border border-farmly-accent/40 p-8 sm:p-12 md:p-16 text-center shadow-2xl">
          {/* Subtle Background Glow */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-farmly-primary/30 blur-[90px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-farmly-accent/20 blur-[90px]"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-farmly-primary/40 border border-farmly-accent/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-6 shadow-inner">
              <Sprout className="w-7 h-7" aria-hidden="true" />
            </div>

            <h2
              id="cta-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-farmly-foreground tracking-tight leading-tight"
            >
              Build the Future of Farming With Farmly.
            </h2>

            <p className="mt-5 text-base sm:text-lg text-farmly-muted leading-relaxed">
              Bring your farming activities, opportunities and connections together in
              one simple digital platform.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" fullWidth className="group gap-2 px-8 text-base shadow-xl shadow-farmly-primary/40">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" fullWidth className="text-base border-white/20 hover:border-farmly-accent/50">
                  <span>Sign In to Existing Account</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
