"use client";

import React from "react";
import Link from "next/link";
import {
  Building,
  Users,
  Boxes,
  Award,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Scale,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";

export default function FPODashboardPage() {
  const { user } = useAuth();
  const { fpoMembers, lots, collectionArrivals } = useMockData();

  const totalMembers = fpoMembers.length || 3;
  const totalVolumeKg = fpoMembers.reduce((acc, m) => acc + m.totalContributedKg, 0);

  return (
    <AppLayout title="FPO Cooperative Workspace">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600/15 via-emerald-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <Building className="w-4 h-4" /> Sahyadri Farmers Producer Co-op (Sinnar)
            </div>
            <h1 className="text-2xl font-bold text-farmly-foreground mt-1">
              Cooperative Aggregation Desk
            </h1>
            <p className="text-xs text-farmly-muted mt-0.5">
              Coordinating collective bargaining, digital scale weighment, and member patronage dividends.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/fpo/members">
              <Button size="sm" variant="outline" className="border-farmly-border text-xs">
                <Users className="w-3.5 h-3.5 mr-1" /> Member Roster
              </Button>
            </Link>
            <Link href="/fpo/lots">
              <Button size="sm" className="bg-farmly-primary text-white text-xs">
                <Boxes className="w-3.5 h-3.5 mr-1" /> Aggregate Lots
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Active Producer Members</span>
              <Users className="w-4 h-4 text-farmly-primary" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">{totalMembers}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% KYC &amp; consent logged
            </div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Aggregated Volume</span>
              <Scale className="w-4 h-4 text-farmly-primary" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">
              {(totalVolumeKg / 1000).toFixed(2)} MT
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">
              {totalVolumeKg.toLocaleString("en-IN")} kg measured net
            </div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Lots Under Management</span>
              <Boxes className="w-4 h-4 text-farmly-primary" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">{lots.length}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              All batches scale-calibrated
            </div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Quality Pass Rate</span>
              <Award className="w-4 h-4 text-farmly-primary" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">98.4%</div>
            <div className="text-[11px] text-farmly-muted mt-1">Grade A &amp; B verified</div>
          </Card>
        </div>

        {/* Member Arrivals & Scale Weighments */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
            <div>
              <h3 className="text-base font-bold text-farmly-foreground">Recent Member Produce Arrivals</h3>
              <p className="text-xs text-farmly-muted">Intake weighments at Sinnar Collection Hub #3</p>
            </div>
            <Link href="/fpo/lots" className="text-xs text-farmly-primary font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-farmly-border text-xs">
            {collectionArrivals.map((arr) => (
              <div key={arr.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-farmly-primary">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-farmly-foreground text-sm">
                      {arr.farmerName} &bull; {arr.crop} ({arr.variety})
                    </div>
                    <div className="text-farmly-muted">
                      Scale: {arr.scaleId} &bull; Moisture: {arr.moisturePercent}% &bull; {arr.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
                  <span className="text-farmly-foreground font-bold text-sm">
                    {arr.measuredQuantity} {arr.unit}
                  </span>
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
