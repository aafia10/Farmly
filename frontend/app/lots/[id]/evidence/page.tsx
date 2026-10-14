"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  ArrowLeft,
  Boxes,
  FileCheck2,
  FileText,
  Scale,
  Award,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function LotEvidencePage() {
  const params = useParams<{ id: string }>();
  const { lots, evidence } = useMockData();

  const lotId = params?.id || "LT-20391";
  const lot = lots.find((l) => l.id === lotId) || lots[0];
  const lotEvidence = evidence.filter((e) => e.lotId === lot?.id);

  const farmerDeclared = lotEvidence.filter((e) => e.category === "Farmer Declared");
  const evidenceBacked = lotEvidence.filter((e) => e.category === "Evidence Backed");
  const externallyVerified = lotEvidence.filter((e) => e.category === "Externally Verified");

  return (
    <AppLayout title={`Evidence Breakdown: ${lot?.id}`}>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href={`/lots/${lot?.id}`}>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-farmly-border text-farmly-foreground hover:bg-farmly-surface-elevated">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="text-xs text-farmly-muted flex items-center gap-1.5">
              <Link href="/lots" className="hover:underline">Lots</Link>
              <span>/</span>
              <Link href={`/lots/${lot?.id}`} className="font-mono hover:underline">{lot?.id}</Link>
              <span>/</span>
              <span className="text-farmly-foreground">3-Tier Evidence</span>
            </div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              3-Tier Evidence & Provenance Verification
            </h1>
          </div>
        </div>

        {/* Informational Explainer Banner */}
        <div className="p-4 rounded-xl bg-farmly-surface border border-farmly-border flex items-start gap-3 text-xs text-farmly-muted">
          <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Farmly separates produce claims into three verifiable tiers. This gives buyers, distributors, and lenders absolute clarity on which data points are self-reported by growers, physically documented via connected field scales, or authenticated by accredited testing laboratories.
          </p>
        </div>

        {/* 3 Tiers Stacks */}
        <div className="space-y-8">
          {/* Tier 1: Externally Verified (Highest Trust) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-farmly-foreground">Tier 3 — Externally Verified</h2>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Certified by accredited third-party labs & APMC inspectors</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-semibold">
                {externallyVerified.length} Artifacts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {externallyVerified.length === 0 ? (
                <div className="col-span-2 p-6 rounded-xl bg-farmly-surface border border-dashed border-farmly-border text-center text-xs text-farmly-muted">
                  No third-party laboratory certifications submitted yet for this lot.
                </div>
              ) : (
                externallyVerified.map((item) => (
                  <Card key={item.id} className="bg-farmly-surface border-emerald-500/30 p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">{item.id}</div>
                        <h3 className="font-bold text-farmly-foreground text-base mt-0.5">{item.title}</h3>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 font-mono text-xs text-emerald-700 dark:text-emerald-300">
                      {item.value}
                    </div>

                    <div className="space-y-1 text-xs text-farmly-muted">
                      <div><strong className="text-farmly-foreground">Issuer:</strong> {item.issuer || "National Testing House"}</div>
                      <div><strong className="text-farmly-foreground">Source:</strong> {item.source}</div>
                      {item.documentRef && (
                        <div><strong className="text-farmly-foreground">Certificate Ref:</strong> <span className="font-mono text-emerald-700 dark:text-emerald-300">{item.documentRef}</span></div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Tier 2: Evidence Backed (Physical Field Documentation) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-farmly-foreground">Tier 2 — Evidence Backed</h2>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Captured through calibrated weighbridges, digital meters, and photos</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-semibold">
                {evidenceBacked.length} Artifacts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidenceBacked.length === 0 ? (
                <div className="col-span-2 p-6 rounded-xl bg-farmly-surface border border-dashed border-farmly-border text-center text-xs text-farmly-muted">
                  No physical weighment or sensor logs recorded.
                </div>
              ) : (
                evidenceBacked.map((item) => (
                  <Card key={item.id} className="bg-farmly-surface border-amber-500/30 p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-xs text-amber-700 dark:text-amber-400 font-bold">{item.id}</div>
                        <h3 className="font-bold text-farmly-foreground text-base mt-0.5">{item.title}</h3>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 font-mono text-xs text-amber-700 dark:text-amber-300">
                      {item.value}
                    </div>

                    <div className="space-y-1 text-xs text-farmly-muted">
                      <div><strong className="text-farmly-foreground">Hardware Source:</strong> {item.source}</div>
                      <div><strong className="text-farmly-foreground">Timestamp:</strong> {item.timestamp}</div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Tier 1: Farmer Declared (Self-Reported) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-farmly-foreground">Tier 1 — Farmer Declared</h2>
                  <p className="text-xs text-sky-700 dark:text-sky-400">Initial harvest estimations self-reported by grower at harvest</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 font-semibold">
                {farmerDeclared.length} Declarations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farmerDeclared.length === 0 ? (
                <div className="col-span-2 p-6 rounded-xl bg-farmly-surface border border-dashed border-farmly-border text-center text-xs text-farmly-muted">
                  No farmer self-declarations listed.
                </div>
              ) : (
                farmerDeclared.map((item) => (
                  <Card key={item.id} className="bg-farmly-surface border-sky-500/30 p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-xs text-sky-700 dark:text-sky-400 font-bold">{item.id}</div>
                        <h3 className="font-bold text-farmly-foreground text-base mt-0.5">{item.title}</h3>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40 font-mono text-xs text-sky-700 dark:text-sky-300">
                      {item.value}
                    </div>

                    <div className="text-xs text-farmly-muted">
                      <div><strong className="text-farmly-foreground">Reporting Farmer:</strong> {item.farmerName}</div>
                      <div><strong className="text-farmly-foreground">Recorded:</strong> {item.timestamp}</div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
