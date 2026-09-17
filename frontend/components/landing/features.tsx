"use client";

import React from "react";
import { motion } from "framer-motion";
import { PLATFORM_FEATURES } from "@/lib/constants";
import { SectionHeading } from "@/components/common/section-heading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

export function Features() {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section
      id="features"
      className="py-24 md:py-32 bg-farmly-surface/30 relative"
      aria-labelledby="features-heading"
    >
      <div className="container mx-auto max-w-7xl">
        <SectionHeading
          badge="Platform Capabilities"
          title="Engineered for Every Agricultural Domain"
          description="A complete digital foundation that connects identity, production records, market linkages, and verifiable trust into one unified experience."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {PLATFORM_FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <Card
                  hoverGlow
                  className="h-full flex flex-col justify-between group p-6 lg:p-7 border-farmly-border/80"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-farmly-surface-elevated border border-farmly-accent/30 flex items-center justify-center text-farmly-accent group-hover:text-emerald-300 group-hover:bg-farmly-primary/30 transition-all duration-300">
                        <Icon className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <Badge variant="secondary" className="text-[11px] font-medium text-farmly-muted">
                        {feature.badge}
                      </Badge>
                    </div>

                    <CardTitle className="text-xl font-bold text-white group-hover:text-emerald-200 transition-colors mb-3">
                      {feature.title}
                    </CardTitle>

                    <CardContent className="p-0">
                      <p className="text-sm text-farmly-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </div>

                  <div className="mt-6 pt-4 border-t border-farmly-border/40 flex items-center justify-between text-xs text-farmly-accent/80 font-medium">
                    <span>Farmly Vision</span>
                    <span className="text-[11px] text-farmly-muted-dark">Readiness Grade A</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
