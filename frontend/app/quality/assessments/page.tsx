"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, FlaskConical, CheckCircle2, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function QualityAssessmentsPage() {
  const { lots, qualityAssessments, addQualityAssessment } = useMockData();

  const [lotId, setLotId] = useState("KS-MH-NSK-WHT-20260910-00125");
  const [moisture, setMoisture] = useState("11.2");
  const [foreignMatter, setForeignMatter] = useState("0.4");
  const [visibleSpoilage, setVisibleSpoilage] = useState<"None" | "Low" | "Moderate" | "High">("None");
  const [assignedGrade, setAssignedGrade] = useState<"Grade A" | "Grade B" | "Standard">("Grade A");
  const [method, setMethod] = useState("Digital Moisture Meter + Analytical Sieve (IS 4333)");
  const [notes, setNotes] = useState("Clean golden grains, moisture comfortably within standard safety limit.");
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = lots.find((l) => l.id === lotId) || lots[0];

    const newQa = addQualityAssessment({
      lotId,
      crop: matched?.crop || "Wheat",
      moisturePercent: Number(moisture) || 12,
      foreignMatterPercent: Number(foreignMatter) || 1,
      visibleSpoilage,
      assignedGrade,
      method,
      assessedBy: "Dr. K. V. Mehta (Chief Agronomist, AgriTest Labs)",
      reportNotes: notes,
      status: "Certified",
    });

    setNotice(`Quality assay ${newQa.id} completed. Lot ${lotId} certified as ${assignedGrade}.`);
  };

  return (
    <AppLayout title="Quality Assessment Workbench">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Log Produce Laboratory Assay</h2>
          <p className="text-xs text-farmly-muted">
            Record certified chemical and physical parameters to stamp lot provenance with tamper-proof grading.
          </p>
        </div>

        {notice && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{notice}</span>
            </div>
            <Link href={`/lots/${lotId}/certificate`}>
              <Button size="sm" variant="outline" className="border-emerald-500/40 text-xs">
                Inspect Certificate <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        <Card className="p-6 border border-farmly-border bg-farmly-surface">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Target Lot for Inspection
              </label>
              <select
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm font-mono"
              >
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} &bull; {l.crop} ({l.quantity} {l.unit}) &bull; {l.farmerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Moisture Content (%) &mdash; Threshold &le; 12.0%
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={moisture}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoisture(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Foreign Matter (%) &mdash; Threshold &le; 1.0%
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={foreignMatter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForeignMatter(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Visible Spoilage
                </label>
                <select
                  value={visibleSpoilage}
                  onChange={(e) => setVisibleSpoilage(e.target.value as "None" | "Low" | "Moderate" | "High")}
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                >
                  <option value="None">None (Pristine)</option>
                  <option value="Low">Low (&lt; 0.5%)</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High (Rejection)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Assigned Quality Grade
                </label>
                <select
                  value={assignedGrade}
                  onChange={(e) => setAssignedGrade(e.target.value as "Grade A" | "Grade B" | "Standard")}
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                >
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B (Commercial)</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Standard Inspection Methodology
              </label>
              <Input value={method} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMethod(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Laboratory Agronomist Notes
              </label>
              <Input value={notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-farmly-border">
              <Button type="submit" className="bg-farmly-primary text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Certify Grade &amp; Anchor Assay
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
