"use client";

import React from "react";
import { motion } from "framer-motion";
import { FARMING_CATEGORIES } from "@/lib/constants";
import { SectionHeading } from "@/components/common/section-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

export function Ecosystem() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section
      id="ecosystem"
      className="py-24 md:py-32 relative"
      aria-labelledby="ecosystem-heading"
    >
      <div className="container mx-auto max-w-7xl">
        <SectionHeading
          badge="Unified Ecosystem"
          title="Everything Around Your Farm, Connected."
          description="Modern agriculture spans diverse production activities. Farmly's digital framework is crafted to integrate all of them under one roof."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FARMING_CATEGORIES.map((category, idx) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                initial={false}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <Card
                  hoverGlow
                  className="p-6 h-full flex flex-col justify-between group cursor-default border-farmly-border/70 hover:border-farmly-accent/50"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      {/* Emoji + Vector Icon Pairing */}
                      <span className="text-3xl select-none" role="img" aria-label={category.name}>
                        {category.emoji}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] tracking-wider uppercase font-semibold text-farmly-muted"
                      >
                        {category.tag}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-farmly-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                      <span>{category.name}</span>
                      <Icon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity text-farmly-accent" />
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-farmly-muted leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-farmly-border/30 flex items-center justify-between text-[11px] text-farmly-muted-dark">
                    <span>Ecosystem Module</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">Digital Ready</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Vision disclaimer note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-farmly-muted-dark max-w-xl mx-auto">
            * Modules represent Farmly&apos;s planned unified ecosystem architecture. Features will be rolled out progressively to ensure grower readiness and localized support.
          </p>
        </div>
      </div>
    </section>
  );
}
