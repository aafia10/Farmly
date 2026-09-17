"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  AlertTriangle,
  Activity,
  CheckCircle2,
  ArrowRight,
  Scale,
  Lock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function AdminDashboardPage() {
  const { adminAlerts, farmers, lots, disputes } = useMockData();

  const openAlerts = adminAlerts.filter((a) => a.status === "Investigating");

  return (
    <AppLayout title="Platform Oversight & Audit">
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-red-600/15 via-amber-500/10 to-transparent border border-red-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> System Auditor &bull; Integrity Protocol
            </div>
            <h1 className="text-2xl font-bold text-farmly-foreground mt-1">
              Audit &amp; Fraud Surveillance Desk
            </h1>
            <p className="text-xs text-farmly-muted mt-0.5">
              Automated anomaly detection across calibrated scale telemetry, duplicate QR codes, and deduction discrepancies.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/fraud">
              <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white text-xs flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Anomaly Alerts ({openAlerts.length})
              </Button>
            </Link>
            <Link href="/admin/audit">
              <Button size="sm" variant="outline" className="border-farmly-border text-xs">
                <Activity className="w-3.5 h-3.5 mr-1" /> Ledger Logs
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Open Fraud Alerts</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">{openAlerts.length}</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
              Requires supervisor sign-off
            </div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Total Platform Users</span>
              <Users className="w-4 h-4 text-farmly-primary" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">{farmers.length + 7}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Across all 8 role domains</div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Cryptographic Ledger</span>
              <Lock className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">100% Valid</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Zero broken hash chains</div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Disputed Inquiries</span>
              <Scale className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">{disputes.length}</div>
            <div className="text-[11px] text-farmly-muted mt-1">Tare variance reconciliation</div>
          </Card>
        </div>

        {/* Live Alerts Stream */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
            <div>
              <h3 className="text-base font-bold text-farmly-foreground">Surveillance &amp; Integrity Alerts</h3>
              <p className="text-xs text-farmly-muted">Automated system triggers flagging potential discrepancies</p>
            </div>
            <Link href="/admin/fraud" className="text-xs text-farmly-primary font-semibold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-farmly-border text-xs">
            {adminAlerts.map((alt) => (
              <div key={alt.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red-500">{alt.id}</span>
                    <strong className="text-farmly-foreground text-sm">{alt.category}</strong>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      alt.severity === "High" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {alt.severity} Severity
                    </span>
                  </div>
                  <p className="text-farmly-muted mt-1 leading-relaxed">{alt.description}</p>
                  <div className="text-[10px] text-farmly-muted font-mono mt-0.5">
                    Target: {alt.relatedEntityId} &bull; {alt.timestamp}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <StatusBadge status={alt.status === "Investigating" ? "Needs Review" : "Completed"} size="sm" />
                  <Link href="/admin/fraud">
                    <Button size="sm" variant="outline" className="h-7 text-[11px] border-farmly-border">
                      Investigate
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
