"use client";

import React from "react";
import Link from "next/link";
import { FileBadge, Download, Eye, CheckCircle2, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function QualityReportsPage() {
  const { qualityAssessments } = useMockData();

  return (
    <AppLayout title="Certified Quality Reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Inspection Dossiers &amp; Certificates</h2>
          <p className="text-xs text-farmly-muted">
            All issued analytical quality certificates authenticated with SHA-256 digests.
          </p>
        </div>

        <div className="space-y-3">
          {qualityAssessments.map((qa) => (
            <Card key={qa.id} className="p-5 border border-farmly-border bg-farmly-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <FileBadge className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-farmly-primary dark:text-farmly-accent-light text-xs">{qa.id}</span>
                    <strong className="text-sm text-farmly-foreground">{qa.crop}</strong>
                    <StatusBadge status={qa.status} size="sm" />
                  </div>
                  <div className="text-xs text-farmly-muted font-mono mt-0.5">
                    Lot: {qa.lotId} &bull; Moisture: {qa.moisturePercent}% &bull; Foreign: {qa.foreignMatterPercent}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link href={`/lots/${qa.lotId}/certificate`}>
                  <Button size="sm" variant="outline" className="border-farmly-border text-xs flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Certificate
                  </Button>
                </Link>
                <Link href={`/lots/${qa.lotId}/quality`}>
                  <Button size="sm" className="bg-farmly-primary text-white text-xs flex items-center gap-1">
                    Inspect Report <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
