"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Search,
  Boxes,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Award,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";

export default function TraceabilityPage() {
  const { lots, evidence } = useMockData();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [scannedLotId, setScannedLotId] = useState("");

  const filteredLots = lots.filter(
    (l) =>
      l.id.toLowerCase().includes(search.toLowerCase()) ||
      l.crop.toLowerCase().includes(search.toLowerCase()) ||
      l.farmerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title={t("nav.traceability", "Supply Chain Traceability")}>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/30 via-farmly-dark-green/40 to-farmly-surface border border-farmly-border p-6 lg:p-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              {t("traceability.ledgerTag", "Cryptographic Seed-to-Shelf Audit Ledger")}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-farmly-foreground tracking-tight">
              {t("traceability.title", "Transparent Agricultural Traceability")}
            </h1>
            <p className="text-xs text-farmly-muted leading-relaxed">
              {t(
                "traceability.subtitle",
                "Verify immutable harvest provenance, weight measurements, moisture readings, and multi-custodian chain of custody from regional farms to retail shelves."
              )}
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("traceability.totalTracked", "Total Tracked Batches")}
            </div>
            <div className="text-2xl font-bold text-farmly-foreground mt-1">{lots.length}</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
              100% {t("traceability.indexedOnChain", "indexed on-chain")}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("traceability.verifiedEvidence", "Verified Evidence Items")}
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{evidence.length}</div>
            <div className="text-[11px] text-farmly-muted mt-1">
              {t("traceability.weighmentsTests", "Weighments & test sheets")}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("traceability.agmarkCertified", "AGMARK Certified")}
            </div>
            <div className="text-2xl font-bold text-farmly-foreground mt-1">
              {lots.filter((l) => l.certificateRef).length}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
              {t("traceability.accreditedLabs", "Accredited laboratories")}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("traceability.activeQrTags", "Active Retail QR Tags")}
            </div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">{lots.length * 4}</div>
            <div className="text-[11px] text-farmly-muted mt-1">
              {t("traceability.customerScans", "Customer verified scans")}
            </div>
          </Card>
        </div>

        {/* Quick QR Lookup Section */}
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-farmly-foreground text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t("traceability.quickQrLookup", "Quick Consumer QR / Batch Verification")}
              </h3>
              <p className="text-xs text-farmly-muted">
                {t(
                  "traceability.quickQrDesc",
                  "Enter any Lot or Container QR reference code to inspect its public provenance certificate."
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. LT-20391"
                value={scannedLotId}
                onChange={(e) => setScannedLotId(e.target.value)}
                className="w-44 h-9 text-xs font-mono uppercase"
              />
              <Link href={`/verify/${scannedLotId.trim() || "LT-20391"}`}>
                <Button className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9 font-semibold">
                  {t("traceability.verifyQrBtn", "Verify QR")}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Traceability Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-farmly-foreground">
                {t("traceability.auditedLots", "Audited Produce Lots")}
              </h2>
              <p className="text-xs text-farmly-muted">
                {t("traceability.auditedLotsDesc", "Click any lot to inspect full lineage and sensory certificates")}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmly-muted" />
              <Input
                placeholder={t("traceability.filterAuditedPlaceholder", "Filter audited lots...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLots.map((lot) => {
              const lotEvCount = evidence.filter((e) => e.lotId === lot.id).length;
              return (
                <Card
                  key={lot.id}
                  className="bg-farmly-surface border-farmly-border p-5 space-y-4 hover:border-farmly-accent/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-farmly-accent">{lot.id}</span>
                        <h3 className="text-base font-bold text-farmly-foreground mt-0.5">{lot.crop}</h3>
                        <div className="text-xs text-farmly-muted">{lot.variety}</div>
                      </div>
                      <StatusBadge status={lot.qualityGrade} size="sm" />
                    </div>

                    <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-farmly-muted">{t("common.grower", "Grower")}:</span>
                        <span className="text-farmly-foreground font-medium">{lot.farmerName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-farmly-muted">{t("lots.volume", "Volume")}:</span>
                        <span className="text-farmly-foreground font-bold">{lot.quantity} {lot.unit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-farmly-muted">{t("traceability.auditArtifacts", "Audit Artifacts")}:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {lotEvCount} {t("traceability.verifiedLogs", "verified logs")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-farmly-border/60 flex items-center justify-between">
                    <Link href={`/verify/${lot.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs border-farmly-border hover:bg-farmly-surface-elevated text-farmly-muted hover:text-farmly-foreground font-medium">
                        <QrCode className="w-3.5 h-3.5 mr-1 text-farmly-accent" />
                        {t("traceability.publicQr", "Public QR")}
                      </Button>
                    </Link>
                    <Link href={`/lots/${lot.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-farmly-accent hover:bg-farmly-primary/20 font-medium">
                        {t("traceability.lineageTree", "Lineage Tree")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
