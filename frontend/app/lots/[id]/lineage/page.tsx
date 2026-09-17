"use client";

import React, { use } from "react";
import Link from "next/link";
import { GitFork, ArrowLeft, ArrowRight, Boxes, Layers, Percent, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineageTree, DEFAULT_LINEAGE } from "@/components/common/lineage-tree";
import { useMockData } from "@/contexts/mock-data-context";

export default function LotLineagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lots, mixedLots } = useMockData();

  const lot = lots.find((l) => l.id === id) || lots[0];
  const mixedLot = mixedLots[0];

  return (
    <AppLayout title={`Lot Lineage & Traceability — ${lot.id}`}>
      <div className="max-w-4xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-farmly-muted">
          <Link href={`/lots/${lot.id}`} className="hover:text-farmly-primary flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Lot Overview
          </Link>
          <span>/</span>
          <span className="text-farmly-foreground font-medium">Chain of Custody &amp; Lineage Tree</span>
        </div>

        {/* Tree Section */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-farmly-primary" />
              <h3 className="text-base font-bold text-farmly-foreground">
                Parent-Child Lot Splitting Tree
              </h3>
            </div>
            <span className="text-xs font-mono text-farmly-muted">Traceability Engine</span>
          </div>

          <p className="text-xs text-farmly-muted leading-relaxed">
            When a distributor purchases a lot, splits it for retail fulfillment, or holds buffer stock, downstream lots are cryptographically linked back to the originating farmer intake receipt.
          </p>

          <div className="pt-2">
            <LineageTree data={DEFAULT_LINEAGE} />
          </div>
        </Card>

        {/* Mixed Lot Transparency Section (Prompt Requirement) */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-farmly-primary" />
              <div>
                <h3 className="text-base font-bold text-farmly-foreground">
                  Mixed Lot / Blend Transparency Protocol
                </h3>
                <span className="text-xs text-farmly-muted">Demonstration of multi-farmer milling batches</span>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-farmly-surface-elevated border border-farmly-border font-bold text-farmly-foreground">
              Batch: {mixedLot.id}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3">
            <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm">
              <span className="font-semibold text-farmly-foreground">{mixedLot.name}</span>
              <span className="text-farmly-muted font-mono">
                Total Output: <strong className="text-farmly-foreground">{mixedLot.outputQuantity} kg</strong> (Handling/Milling Loss: {mixedLot.loss} kg)
              </span>
            </div>

            {/* Visual ratio bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-farmly-border">
              <div
                style={{ width: `${mixedLot.components[0].percentage}%` }}
                className="bg-emerald-600 dark:bg-emerald-500"
                title={`${mixedLot.components[0].sourceFarmer}: ${mixedLot.components[0].percentage}%`}
              />
              <div
                style={{ width: `${mixedLot.components[1].percentage}%` }}
                className="bg-blue-600 dark:bg-blue-500"
                title={`${mixedLot.components[1].sourceFarmer}: ${mixedLot.components[1].percentage}%`}
              />
            </div>

            {/* Breakdown table */}
            <div className="divide-y divide-farmly-border text-xs">
              {mixedLot.components.map((c, idx) => (
                <div key={c.sourceLotId} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        idx === 0 ? "bg-emerald-600 dark:bg-emerald-500" : "bg-blue-600 dark:bg-blue-500"
                      }`}
                    />
                    <div>
                      <strong className="text-farmly-foreground">{c.sourceFarmer}</strong>
                      <span className="text-farmly-muted font-mono ml-2">({c.sourceLotId})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 font-mono">
                    <span className="text-farmly-foreground font-bold">{c.quantity} kg</span>
                    <span className="text-farmly-muted">{c.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
