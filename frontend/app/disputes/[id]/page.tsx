"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Scale,
  FileCheck2,
  Send,
  User,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const { disputes } = useMockData();

  const disputeId = params?.id || "DP-401";
  const dispute = disputes.find((d) => d.id === disputeId) || disputes[0];

  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [submittedEvidenceSuccess, setSubmittedEvidenceSuccess] = useState(false);
  const [mediationRequested, setMediationRequested] = useState(false);

  if (!dispute) {
    return (
      <AppLayout title="Dispute Not Found">
        <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-xs text-farmly-muted">
          Dispute record not found.
        </Card>
      </AppLayout>
    );
  }

  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    dispute.resolutionTimeline.push({
      date: "Just now",
      actor: "Authorized Representative",
      action: `Submitted supplementary evidence: "${evidenceNote.slice(0, 40)}..."`,
    });
    setSubmittedEvidenceSuccess(true);
    setEvidenceNote("");
    setShowAddEvidence(false);
    setTimeout(() => setSubmittedEvidenceSuccess(false), 4000);
  };

  return (
    <AppLayout title={`Dispute ${dispute.id}`}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/disputes">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-farmly-border text-white hover:bg-farmly-surface-elevated">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-400">{dispute.id}</span>
                <StatusBadge status={dispute.status} size="sm" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {dispute.category}
              </h1>
            </div>
          </div>

          <div className="flex gap-2">
            {!mediationRequested ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediationRequested(true)}
                className="border-farmly-border text-xs text-white hover:bg-farmly-surface-elevated"
              >
                Request Mandi Mediation
              </Button>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Mediation Requested
              </span>
            )}
            <Button
              size="sm"
              onClick={() => setShowAddEvidence(!showAddEvidence)}
              className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs"
            >
              Add Evidence
            </Button>
          </div>
        </div>

        {submittedEvidenceSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Supplementary evidence artifact successfully appended to arbitration timeline.
          </div>
        )}

        {/* Claim Details Card */}
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-farmly-border">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-farmly-muted text-xs block">Grower (Claimant)</span>
                <span className="font-bold text-white">{dispute.farmerName}</span>
              </div>
              <span className="text-farmly-muted font-bold">vs</span>
              <div>
                <span className="text-farmly-muted text-xs block">Buyer (Counterparty)</span>
                <span className="font-bold text-white">{dispute.buyerName}</span>
              </div>
            </div>

            <div className="text-xs text-farmly-muted">
              Referenced Lot: <Link href={`/lots/${dispute.lotId}`} className="font-mono text-emerald-400 font-bold underline">{dispute.lotId}</Link>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-farmly-muted">Dispute Statement</span>
            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs text-white leading-relaxed">
              {dispute.description}
            </div>
          </div>

          {/* Attached Evidence List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-farmly-muted">Attached Documents</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dispute.evidence.map((ev, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-farmly-surface-elevated border border-farmly-border flex items-center gap-2 text-xs">
                  <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-white font-mono">{ev}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Add Evidence Modal / Inline Form */}
        {showAddEvidence && (
          <Card className="bg-farmly-surface border-farmly-accent/40 p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Submit Additional Verification Evidence</h3>
            <form onSubmit={handleAddEvidence} className="space-y-3">
              <Textarea
                placeholder="Describe your supplementary evidence, weighbridge re-test ticket number, or moisture meter reading..."
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                required
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddEvidence(false)}
                  className="border-farmly-border text-white text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs">
                  Submit to Arbitrators
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Resolution Timeline */}
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Arbitration Timeline</h3>
          <div className="space-y-4 pl-2">
            {dispute.resolutionTimeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 relative">
                {idx < dispute.resolutionTimeline.length - 1 && (
                  <div className="absolute left-2.5 top-6 w-0.5 h-10 bg-farmly-border -ml-px" />
                )}
                <div className="w-5 h-5 rounded-full bg-farmly-primary/30 border border-farmly-accent flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-semibold">{item.actor}</strong>
                    <span className="text-farmly-muted font-mono text-[11px]">{item.date}</span>
                  </div>
                  <p className="text-farmly-muted">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
