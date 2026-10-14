"use client";

import React from "react";
import Link from "next/link";
import { Award, CheckCircle2, FlaskConical, ArrowRight, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function FPOQualityPage() {
  const { qualityAssessments, lots } = useMockData();

  return (
    <AppLayout title="FPO Quality & Compliance">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Batch Quality &amp; Moisture Audits</h2>
          <p className="text-xs text-farmly-muted">
            Independent third-party laboratory assays conducted for Sahyadri FPO lots prior to buyer dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qualityAssessments.map((qa) => {
            const matchedLot = lots.find((l) => l.id === qa.lotId);
            return (
              <Card key={qa.id} className="p-5 border border-farmly-border bg-farmly-surface space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-farmly-primary dark:text-farmly-accent-light">{qa.id}</span>
                      <h3 className="text-base font-bold text-farmly-foreground">{qa.crop}</h3>
                    </div>
                  </div>
                  <StatusBadge status={qa.status} size="sm" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                  <div>
                    <span className="text-farmly-muted block">Moisture</span>
                    <strong className="text-farmly-foreground font-mono text-sm">{qa.moisturePercent}%</strong>
                  </div>
                  <div>
                    <span className="text-farmly-muted block">Foreign Matter</span>
                    <strong className="text-farmly-foreground font-mono text-sm">{qa.foreignMatterPercent}%</strong>
                  </div>
                  <div>
                    <span className="text-farmly-muted block">Assigned Grade</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{qa.assignedGrade}</strong>
                  </div>
                </div>

                <p className="text-xs text-farmly-muted leading-relaxed">{qa.reportNotes}</p>

                <div className="pt-3 border-t border-farmly-border flex items-center justify-between text-xs">
                  <span className="text-farmly-muted">Inspector: {qa.assessedBy}</span>
                  <Link
                    href={`/lots/${qa.lotId}/quality`}
                    className="text-farmly-primary dark:text-farmly-accent-light font-medium hover:underline flex items-center gap-1"
                  >
                    View Lab Report <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
