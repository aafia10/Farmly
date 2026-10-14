"use client";

import React from "react";
import Link from "next/link";
import {
  Award,
  FlaskConical,
  FileCheck2,
  FileBadge,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function QualityDashboardPage() {
  const { qualityAssessments, lots } = useMockData();

  return (
    <AppLayout title="Quality Assessor Lab">
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600/15 via-teal-500/10 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <FlaskConical className="w-4 h-4" /> AgriTest Analytical Labs &bull; Chief Agronomist
            </div>
            <h1 className="text-2xl font-bold text-farmly-foreground mt-1">
              Produce Assay &amp; Grading Station
            </h1>
            <p className="text-xs text-farmly-muted mt-0.5">
              Independent laboratory grading, moisture content quantification, and tamper-proof certificate issuance.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/quality/assessments">
              <Button size="sm" className="bg-farmly-primary text-white text-xs">
                <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Log New Inspection
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Completed Assays</span>
              <FlaskConical className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">
              {qualityAssessments.length} Batches
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Certified &amp; anchored
            </div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Grade A Frequency</span>
              <Award className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">82.4%</div>
            <div className="text-[11px] text-farmly-muted mt-1">Premium export grade</div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Avg Moisture Reading</span>
              <TrendingUp className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">11.4%</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Below 12.0% safe threshold</div>
          </Card>

          <Card className="p-5 border border-farmly-border bg-farmly-surface">
            <div className="flex items-center justify-between text-xs text-farmly-muted mb-2">
              <span>Digital Certificates Issued</span>
              <FileBadge className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" />
            </div>
            <div className="text-2xl font-bold text-farmly-foreground font-mono">{lots.length}</div>
            <div className="text-[11px] text-farmly-muted mt-1">SHA-256 integrity stamped</div>
          </Card>
        </div>

        {/* Recent Assays Table */}
        <Card className="p-6 border border-farmly-border bg-farmly-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
            <div>
              <h3 className="text-base font-bold text-farmly-foreground">Recent Laboratory Inspections</h3>
              <p className="text-xs text-farmly-muted">Certified analysis parameter log</p>
            </div>
            <Link href="/quality/reports" className="text-xs text-farmly-primary dark:text-farmly-accent-light font-semibold hover:underline flex items-center gap-1">
              View Reports <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-farmly-border text-xs">
            {qualityAssessments.map((qa) => (
              <div key={qa.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-farmly-primary dark:text-farmly-accent-light">{qa.id}</span>
                    <strong className="text-farmly-foreground text-sm">{qa.crop}</strong>
                    <span className="text-farmly-muted font-mono">({qa.lotId})</span>
                  </div>
                  <div className="text-farmly-muted mt-0.5">
                    Moisture: {qa.moisturePercent}% &bull; Foreign Matter: {qa.foreignMatterPercent}% &bull; {qa.timestamp}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{qa.assignedGrade}</span>
                  <StatusBadge status={qa.status} size="sm" />
                  <Link href={`/lots/${qa.lotId}/quality`}>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] border-farmly-border">
                      Report
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
