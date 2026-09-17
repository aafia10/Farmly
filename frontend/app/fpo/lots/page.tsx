"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Boxes, Filter, ArrowRight, Eye, Scale } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function FPOLotsPage() {
  const { lots } = useMockData();
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredLots = lots.filter(
    (l) => filterStatus === "All" || l.status === filterStatus
  );

  return (
    <AppLayout title="FPO Aggregated Produce Lots">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-farmly-foreground">Aggregated Member Batches</h2>
            <p className="text-xs text-farmly-muted">
              Collective physical lots stored at Sinnar Hub and linked to FPO buyer master contracts.
            </p>
          </div>
          <Link href="/lots/new">
            <Button className="bg-farmly-primary text-white text-xs">
              Mint New Collective Lot
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {["All", "Active", "Under Offer", "In Transit", "Delivered"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterStatus === st
                  ? "bg-farmly-primary text-white"
                  : "bg-farmly-surface-elevated text-farmly-muted border border-farmly-border hover:text-farmly-foreground"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Lots List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map((lot) => (
            <Card key={lot.id} hoverGlow className="p-5 border border-farmly-border bg-farmly-surface flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-farmly-primary">{lot.id}</span>
                  <StatusBadge status={lot.status} size="sm" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-farmly-foreground">{lot.crop}</h3>
                  <p className="text-xs text-farmly-muted">{lot.variety}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-farmly-muted block">Measured Net</span>
                    <strong className="text-farmly-foreground font-mono text-sm">
                      {lot.quantity} {lot.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-farmly-muted block">Quality Grade</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {lot.qualityGrade}
                    </strong>
                  </div>
                </div>

                <div className="text-xs text-farmly-muted">
                  Farmer: <strong className="text-farmly-foreground">{lot.farmerName}</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-farmly-border flex items-center justify-between text-xs">
                <span className="text-farmly-muted font-mono">{lot.createdDate}</span>
                <Link
                  href={`/lots/${lot.id}`}
                  className="text-farmly-primary font-medium hover:underline flex items-center gap-1"
                >
                  Inspect Lot <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
