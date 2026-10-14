"use client";

import React from "react";
import { motion } from "framer-motion";
import { WHY_FARMLY_POINTS } from "@/lib/constants";
import { SectionHeading } from "@/components/common/section-heading";
import { Card } from "@/components/ui/card";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

export function WhyFarmly() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section
      id="about"
      className="py-24 md:py-32 bg-farmly-surface/20 relative"
      aria-labelledby="why-farmly-heading"
    >
      <div className="container mx-auto max-w-7xl">
        <SectionHeading
          badge="Why Farmly"
          title="One Platform. Many Possibilities."
          description="Modern farming is more than growing crops. Today's agricultural enterprises handle diverse production, complex logistics, scattered buyers, and vital paper ledgers."
        />

        {/* Narrative Visual Banner */}
        <div className="mb-14 rounded-3xl bg-gradient-to-r from-farmly-surface-elevated via-farmly-surface to-farmly-surface-elevated border border-farmly-border p-8 md:p-12">
          <div className="max-w-3xl">
            <span className="text-xs uppercase font-bold tracking-widest text-farmly-accent mb-2 block">
              The Agricultural Transformation
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-farmly-foreground leading-snug">
              Bridging the gap between traditional field mastery and modern digital trust.
            </h3>
            <p className="mt-4 text-farmly-muted text-sm sm:text-base leading-relaxed">
              Instead of struggling with multiple incompatible apps, paper notebooks, and intermediaries, Farmly brings your entire agricultural existence into one simple, sovereign platform.
            </p>
          </div>
        </div>

        {/* Core Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {WHY_FARMLY_POINTS.map((point, idx) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.07 }}
              >
                <Card
                  hoverGlow
                  className="p-6 md:p-8 h-full flex flex-col justify-start border-farmly-border/70 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-center text-farmly-accent group-hover:bg-farmly-primary/30 group-hover:border-farmly-accent/40 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors mb-5">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>

                  <h4 className="text-lg font-bold text-farmly-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-200 transition-colors mb-2.5">
                    {point.title}
                  </h4>

                  <p className="text-sm text-farmly-muted leading-relaxed">
                    {point.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
