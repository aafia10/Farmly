"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, CheckCircle2, Search, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function AdminFraudPage() {
  const { adminAlerts, resolveAdminAlert } = useMockData();
  const [filterSeverity, setFilterSeverity] = useState("All");

  const filtered = adminAlerts.filter(
    (a) => filterSeverity === "All" || a.severity === filterSeverity
  );

  return (
    <AppLayout title="Fraud & Anomaly Surveillance">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Automated Anomaly Detection</h2>
          <p className="text-xs text-farmly-muted">
            Heuristic monitoring flagging calibrated scale variances, duplicate consumer QR scans, and deduction deviations.
          </p>
        </div>

        <div className="flex gap-2">
          {["All", "High", "Medium", "Low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterSeverity === sev
                  ? "bg-farmly-primary text-white"
                  : "bg-farmly-surface-elevated text-farmly-muted border border-farmly-border hover:text-farmly-foreground"
              }`}
            >
              {sev} Severity
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((alt) => (
            <Card key={alt.id} className="p-5 border border-farmly-border bg-farmly-surface space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${
                    alt.severity === "High"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500"
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-farmly-primary">{alt.id}</span>
                      <h3 className="text-sm font-bold text-farmly-foreground">{alt.category}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        alt.severity === "High" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {alt.severity}
                      </span>
                    </div>
                    <span className="text-xs text-farmly-muted font-mono">Entity: {alt.relatedEntityId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <StatusBadge status={alt.status === "Investigating" ? "Needs Review" : "Completed"} size="sm" />
                  {alt.status === "Investigating" && (
                    <Button
                      size="sm"
                      onClick={() => resolveAdminAlert(alt.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Resolved
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs text-farmly-muted leading-relaxed">
                {alt.description}
              </div>

              <div className="text-[11px] text-farmly-muted font-mono flex justify-between">
                <span>Triggered: {alt.timestamp}</span>
                <span>Audit Protocol: Section 14 Integrity Rules</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
