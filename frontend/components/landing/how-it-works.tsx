"use client";

import React from "react";
import { motion } from "framer-motion";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";
import { SectionHeading } from "@/components/common/section-heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

export function HowItWorks() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 relative overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      <div className="container mx-auto max-w-7xl">
        <SectionHeading
          badge="Simple 4-Step Process"
          title="Farming, Connected Simply."
          description="Farmly removes complexity so you can focus on growing. Get started in minutes with zero paperwork."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {HOW_IT_WORKS_STEPS.map((stepItem, idx) => {
            const Icon = stepItem.icon;
            return (
              <motion.div
                key={stepItem.step}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card
                  hoverGlow
                  className="h-full flex flex-col justify-between relative group overflow-hidden border-farmly-border/70"
                >
                  {/* Subtle top indicator bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-farmly-primary to-farmly-accent opacity-40 group-hover:opacity-100 transition-opacity duration-300" />

                  <CardHeader className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      {/* Numbered Indicator */}
                      <span className="font-mono text-3xl font-extrabold text-farmly-primary dark:text-farmly-accent-light group-hover:text-farmly-accent transition-colors">
                        {stepItem.step}
                      </span>
                      <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-farmly-muted group-hover:text-emerald-700 dark:group-hover:text-emerald-300 group-hover:border-farmly-accent/40 transition-colors">
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>

                    <CardTitle className="text-lg font-bold text-farmly-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-100 transition-colors">
                      {stepItem.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-3">
                    <p className="text-sm font-medium text-farmly-muted leading-relaxed">
                      {stepItem.description}
                    </p>
                    <p className="text-xs text-farmly-muted-dark leading-relaxed">
                      {stepItem.detail}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
