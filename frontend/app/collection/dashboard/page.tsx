"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  Scale,
  Boxes,
  ClipboardList,
  CheckCircle2,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function CollectionDashboardPage() {
  const { collectionArrivals, lots } = useMockData();

  return (
    <AppLayout title="Collection Hub Operations">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600/15 via-blue-500/10 to-transparent border border-blue-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
              <Truck className="w-4 h-4" /> Sinnar Collection Hub #3 &bull; Nashik
            </div>
            <h1 className="text-2xl font-bold text-farmly-foreground mt-1">
              Produce Intake &amp; Weighbridge Station
            </h1>
            <p className="text-xs text-farmly-muted mt-0.5">
              Calibrated platform scales, moisture meters, lot bagging, and distributor dispatch handover.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/collection/weighment">
              <Button size="sm" className="bg-farmly-primary text-white text-xs">
                <Scale className="w-3.5 h-3.5 mr-1" /> New Weighment
              </Button>
            </Link>
            <Link href="/collection/handover">
              <Button size="sm" variant="outline" className="border-farmly-border text-xs">
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Custody Handover
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Today&apos;s Measured Intake</span>
              <Scale className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">1,292.4 kg</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tare calibration active
            </div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Active Scales</span>
              <CheckCircle2 className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">2 Scales</div>
            <div className="text-[11px] text-farmly-muted mt-1">
              FPO-SIN-01 &bull; FPO-SIN-03
            </div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Lots Bagged &amp; Stored</span>
              <Boxes className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">{lots.length}</div>
            <div className="text-[11px] text-farmly-muted mt-1">Bay 3 &amp; Bay 12</div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Dispatches In Transit</span>
              <Truck className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">1 Active</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">To Bhiwandi Warehouse</div>
          </Card>
        </div>

        {/* Live Intake Queue */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
            <div>
              <h3 className="text-base font-bold text-farmly-foreground">Intake Weighment Log</h3>
              <p className="text-xs text-farmly-muted">Verified digital receipts with scale ID &amp; supervisor stamp</p>
            </div>
            <Link href="/collection/arrivals" className="text-xs text-farmly-primary dark:text-farmly-accent-light font-semibold hover:underline flex items-center gap-1">
              View All Arrivals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-farmly-border text-xs">
            {collectionArrivals.map((arr) => (
              <div key={arr.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-farmly-primary dark:text-farmly-accent-light">{arr.id}</span>
                    <strong className="text-farmly-foreground text-sm">{arr.farmerName}</strong>
                    <span className="text-farmly-muted">({arr.crop})</span>
                  </div>
                  <div className="text-farmly-muted mt-0.5">
                    Scale: <span className="font-mono text-farmly-foreground">{arr.scaleId}</span> &bull; Moisture: {arr.moisturePercent}% &bull; {arr.timestamp}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto font-mono">
                  <div className="text-right">
                    <div className="text-farmly-foreground font-bold text-sm">
                      {arr.measuredQuantity} {arr.unit}
                    </div>
                    <span className="text-[10px] text-farmly-muted">
                      (Decl: {arr.declaredQuantity} {arr.unit})
                    </span>
                  </div>
                  <StatusBadge status={arr.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
