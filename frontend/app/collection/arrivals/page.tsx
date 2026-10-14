"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Scale, ArrowRight, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function CollectionArrivalsPage() {
  const { collectionArrivals } = useMockData();

  return (
    <AppLayout title="Produce Arrivals Log">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-farmly-foreground">Farmer Produce Gate Arrivals</h2>
            <p className="text-xs text-farmly-muted">
              Check-in queue and physical weighment tracking at Sinnar Hub #3.
            </p>
          </div>
          <Link href="/collection/weighment">
            <Button className="bg-farmly-primary text-white text-xs flex items-center gap-1.5">
              <Scale className="w-4 h-4" /> New Intake Weighment
            </Button>
          </Link>
        </div>

        <Card className="border border-farmly-border bg-farmly-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-farmly-table-header text-farmly-muted border-b border-farmly-border font-semibold">
                <tr>
                  <th className="p-3.5">Arrival ID</th>
                  <th className="p-3.5">Farmer</th>
                  <th className="p-3.5">Crop &amp; Variety</th>
                  <th className="p-3.5">Declared</th>
                  <th className="p-3.5">Scale Net</th>
                  <th className="p-3.5">Moisture</th>
                  <th className="p-3.5">Scale ID</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmly-border">
                {collectionArrivals.map((arr) => (
                  <tr key={arr.id} className="hover:bg-farmly-table-hover transition-colors">
                    <td className="p-3.5 font-mono font-bold text-farmly-primary dark:text-farmly-accent-light">{arr.id}</td>
                    <td className="p-3.5 font-semibold text-farmly-foreground">{arr.farmerName}</td>
                    <td className="p-3.5 text-farmly-muted">{arr.crop} ({arr.variety})</td>
                    <td className="p-3.5 font-mono text-farmly-muted">{arr.declaredQuantity} {arr.unit}</td>
                    <td className="p-3.5 font-mono font-bold text-farmly-foreground">{arr.measuredQuantity} {arr.unit}</td>
                    <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400">{arr.moisturePercent}%</td>
                    <td className="p-3.5 font-mono text-farmly-muted">{arr.scaleId}</td>
                    <td className="p-3.5"><StatusBadge status={arr.status} size="sm" /></td>
                    <td className="p-3.5">
                      <Link href="/lots/new" className="text-farmly-primary dark:text-farmly-accent-light font-medium hover:underline flex items-center gap-1">
                        Convert <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
