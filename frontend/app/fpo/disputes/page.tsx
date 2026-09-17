"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Scale, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function FPODisputesPage() {
  const { disputes } = useMockData();

  return (
    <AppLayout title="FPO Member Disputes & Mediation">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Member Grievance Mediation</h2>
          <p className="text-xs text-farmly-muted">
            Resolving tare deductions, scale variances, and payment reconciliations on behalf of FPO farmers.
          </p>
        </div>

        <div className="space-y-4">
          {disputes.map((d) => (
            <Card key={d.id} className="p-5 border border-farmly-border bg-farmly-surface space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-farmly-primary">{d.id}</span>
                    <h3 className="text-sm font-bold text-farmly-foreground">
                      {d.category} &bull; {d.farmerName} vs. {d.buyerName}
                    </h3>
                  </div>
                </div>
                <StatusBadge status={d.status} size="sm" />
              </div>

              <p className="text-xs text-farmly-muted leading-relaxed bg-farmly-surface-elevated p-3 rounded-xl border border-farmly-border">
                {d.description}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-farmly-muted">Opened: {d.createdDate}</span>
                <Link
                  href={`/disputes/${d.id}`}
                  className="text-farmly-primary font-semibold hover:underline flex items-center gap-1"
                >
                  Mediate Dispute <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
