"use client";

import React, { use } from "react";
import Link from "next/link";
import { Award, CheckCircle2, FlaskConical, AlertCircle, ArrowLeft, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function LotQualityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lots, qualityAssessments } = useMockData();

  const lot = lots.find((l) => l.id === id) || lots[0];
  const assessment =
    qualityAssessments.find((q) => q.lotId === lot.id) ||
    qualityAssessments[0] || {
      id: "QA-109",
      lotId: lot.id,
      crop: lot.crop,
      moisturePercent: 11.2,
      foreignMatterPercent: 0.4,
      visibleSpoilage: "None",
      assignedGrade: lot.qualityGrade,
      method: "Digital Moisture Meter + Analytical Sieve",
      assessedBy: "Dr. K. V. Mehta (AgriTest Labs)",
      reportNotes: "Clean grain, moisture within standard 12% threshold.",
      status: "Certified",
      timestamp: "10 Sep 2026, 11:45",
    };

  return (
    <AppLayout title={`Quality Inspection — ${lot.id}`}>
      <div className="max-w-4xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-farmly-muted">
          <Link href={`/lots/${lot.id}`} className="hover:text-farmly-primary flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Lot Overview
          </Link>
          <span>/</span>
          <span className="text-farmly-foreground font-medium">Quality Inspection</span>
        </div>

        {/* Header Summary */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-farmly-foreground">{lot.crop} ({lot.variety})</h2>
                <StatusBadge status={assessment.status} size="sm" />
              </div>
              <p className="text-xs text-farmly-muted font-mono mt-0.5">Lot ID: {lot.id}</p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-farmly-border sm:pl-6">
            <div className="text-xs text-farmly-muted">Assigned Quality Grade</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {assessment.assignedGrade}
            </div>
          </div>
        </Card>

        {/* Structured Quality Metrics Table */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-farmly-primary" />
              <h3 className="text-base font-bold text-farmly-foreground">Laboratory Assay Parameters</h3>
            </div>
            <span className="text-xs font-mono text-farmly-muted">ISO/IEC 17025 Compliant</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <div className="text-xs text-farmly-muted mb-1">Moisture Content</div>
              <div className="text-2xl font-bold font-mono text-farmly-foreground">
                {assessment.moisturePercent}%
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Threshold: &le; 12.0% (Passed)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <div className="text-xs text-farmly-muted mb-1">Foreign Matter</div>
              <div className="text-2xl font-bold font-mono text-farmly-foreground">
                {assessment.foreignMatterPercent}%
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Threshold: &le; 1.0% (Passed)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <div className="text-xs text-farmly-muted mb-1">Visible Spoilage</div>
              <div className="text-2xl font-bold font-mono text-farmly-foreground">
                {assessment.visibleSpoilage}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Zero fungal/insect damage
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-2 text-xs">
            <div className="font-semibold text-farmly-foreground">Assessor Evaluation &amp; Methodology</div>
            <p className="text-farmly-muted leading-relaxed">{assessment.reportNotes}</p>
            <div className="pt-2 flex flex-wrap items-center justify-between text-farmly-muted border-t border-farmly-border text-[11px]">
              <span><strong>Inspection Method:</strong> {assessment.method}</span>
              <span><strong>Assessed By:</strong> {assessment.assessedBy}</span>
              <span><strong>Timestamp:</strong> {assessment.timestamp}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link href={`/lots/${lot.id}`}>
            <Button variant="outline" className="border-farmly-border">
              Back to Overview
            </Button>
          </Link>
          <Link href={`/lots/${lot.id}/certificate`}>
            <Button className="bg-farmly-primary text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> View Digital Certificate
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
