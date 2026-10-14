"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sprout,
  Milk,
  Egg,
  Fish,
  Beef,
  Truck,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

export function Hero() {
  const shouldReduceMotion = usePrefersReducedMotion();

  const floatingBadges = [
    { label: "Crops", icon: Sprout, color: "text-emerald-700 dark:text-emerald-400", pos: "top-4 left-6" },
    { label: "Dairy", icon: Milk, color: "text-sky-700 dark:text-sky-300", pos: "top-10 right-8" },
    { label: "Poultry", icon: Egg, color: "text-amber-700 dark:text-amber-300", pos: "bottom-14 left-8" },
    { label: "Fisheries", icon: Fish, color: "text-teal-700 dark:text-teal-300", pos: "bottom-8 right-12" },
    { label: "Livestock", icon: Beef, color: "text-orange-700 dark:text-orange-300", pos: "top-1/2 -left-3 -translate-y-1/2" },
    { label: "Supply Chain", icon: Truck, color: "text-emerald-700 dark:text-emerald-300", pos: "top-1/2 -right-4 -translate-y-1/2" },
  ];

  return (
    <section
      id="top"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background Ambient Glows */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[400px] rounded-full bg-farmly-primary/15 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-farmly-dark-green/20 blur-[100px]"
        aria-hidden="true"
      />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Core Value Proposition */}
          <motion.div
            className="lg:col-span-7 flex flex-col items-start text-left"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Live Indicator Pill */}
            <Badge
              variant="default"
              className="mb-6 py-1.5 px-3.5 bg-farmly-surface-elevated border-farmly-accent/40 text-emerald-700 dark:text-emerald-300 gap-2"
            >
              <span className="flex h-2 w-2 rounded-full bg-farmly-accent animate-pulse" />
              <span>The Digital Infrastructure for Modern Farming</span>
            </Badge>

            {/* Main Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl md:text-6xl lg:text-6.5xl font-extrabold text-farmly-foreground tracking-tight leading-[1.1]"
            >
              One Digital Platform for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-farmly-accent to-emerald-200">
                Every Farm.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 text-lg sm:text-xl text-farmly-muted leading-relaxed max-w-2xl">
              Farmly connects farmers, buyers, and agricultural services through a
              simple digital infrastructure built for modern farming.
            </p>

            {/* CTA Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" fullWidth className="group gap-2 text-base shadow-lg shadow-farmly-primary/30">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" fullWidth className="text-base border-white/20 hover:border-farmly-accent/60">
                  <span>Explore Farmly</span>
                </Button>
              </Link>
            </div>

            {/* High-level Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-farmly-border/70 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-farmly-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-farmly-accent" />
                <span>Zero technical jargon</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-farmly-accent" />
                <span>Farmer data privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-farmly-accent" />
                <span>Unified digital identity</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Agricultural Abstract Illustration */}
          <motion.div
            className="lg:col-span-5 flex justify-center items-center"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
              {/* Concentric Modern Farming Digital Rings */}
              <div className="absolute inset-0 rounded-full border border-farmly-accent/20 animate-[spin_60s_linear_infinite]" />
              <div className="absolute inset-8 rounded-full border border-dashed border-farmly-border/40" />
              <div className="absolute inset-16 rounded-full border border-farmly-primary/30 bg-farmly-surface/30 backdrop-blur-xs" />

              {/* Central Farmly Hub Card */}
              <div className="relative z-10 w-48 h-48 rounded-3xl bg-gradient-to-br from-farmly-surface-elevated to-farmly-surface border border-farmly-accent/50 p-5 flex flex-col items-center justify-center text-center shadow-2xl shadow-farmly-dark-green/40">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-farmly-primary to-farmly-dark-green flex items-center justify-center mb-3 shadow-inner border border-farmly-accent/30">
                  <Sprout className="w-8 h-8 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="font-bold text-farmly-foreground text-base">Farmly Core</div>
                <div className="text-[11px] text-farmly-accent mt-0.5 font-medium">
                  Unified Agriculture
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-farmly-primary/20 border border-farmly-accent/30 text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Ecosystem Hub
                </div>
              </div>

              {/* Floating badges around the hub */}
              {floatingBadges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={badge.label}
                    className={`absolute ${badge.pos} z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-farmly-surface-elevated/95 border border-farmly-border shadow-lg backdrop-blur-sm`}
                    animate={
                      shouldReduceMotion
                        ? {}
                        : {
                            y: [0, idx % 2 === 0 ? -6 : 6, 0],
                          }
                    }
                    transition={{
                      duration: 4 + (idx % 3),
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Icon className={`w-4 h-4 ${badge.color}`} />
                    <span className="text-xs font-semibold text-farmly-foreground tracking-wide">
                      {badge.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
