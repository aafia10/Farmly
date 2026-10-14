import React from "react";
import { TRUST_ITEMS } from "@/lib/constants";

export function TrustStrip() {
  return (
    <section
      className="border-y border-farmly-border bg-farmly-surface/40 py-10"
      aria-label="Platform Principles"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-start gap-4 p-2 rounded-xl transition-colors"
              >
                <div className="p-2.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-farmly-accent shrink-0">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-farmly-foreground tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-farmly-muted leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
