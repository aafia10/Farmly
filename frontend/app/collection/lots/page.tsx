"use client";

import React from "react";
import Link from "next/link";
import { Boxes, ArrowRight, Eye, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function CollectionLotsPage() {
  const { lots } = useMockData();

  return (
    <AppLayout title="Collection Hub Stored Lots">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-farmly-foreground">Verified Warehouse Inventory</h2>
            <p className="text-xs text-farmly-muted">
              Physical bagged lots stored in Sinnar Hub bays pending buyer logistics dispatch.
            </p>
          </div>
          <Link href="/lots/new">
            <Button className="bg-farmly-primary text-white text-xs">
              Mint New Physical Lot
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
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

                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-farmly-muted">Storage Bay:</span>
                    <strong className="text-farmly-foreground font-mono">Bay 3 &bull; Stored</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-farmly-muted">Net Weight:</span>
                    <strong className="text-farmly-foreground font-mono">{lot.quantity} {lot.unit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-farmly-muted">Scale Used:</span>
                    <span className="text-farmly-muted font-mono">{lot.weighmentScaleId || "FPO-SIN-03"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-farmly-border flex items-center justify-between text-xs">
                <span className="text-farmly-muted font-mono">{lot.createdDate}</span>
                <Link
                  href={`/lots/${lot.id}`}
                  className="text-farmly-primary font-semibold hover:underline flex items-center gap-1"
                >
                  Lot Details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
