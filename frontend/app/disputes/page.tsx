"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Scale,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";

export default function DisputesPage() {
  const { disputes } = useMockData();
  const { t } = useTranslation();
  const [filter, setFilter] = useState("All");

  const statuses = [
    { value: "All", label: t("common.all", "All") },
    { value: "Open", label: t("status.open", "Open") },
    { value: "Under Review", label: t("status.underReview", "Under Review") },
    { value: "Waiting for Evidence", label: t("status.waitingEvidence", "Waiting for Evidence") },
    { value: "Resolved", label: t("status.resolved", "Resolved") },
    { value: "Closed", label: t("status.closed", "Closed") },
  ];

  const filtered = disputes.filter((d) => {
    if (filter === "All") return true;
    return d.status === filter;
  });

  return (
    <AppLayout title={t("nav.disputes", "Dispute Mediation")}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {t("disputes.title", "Agricultural Dispute Mediation")}
            </h1>
            <p className="text-xs text-farmly-muted">
              {t(
                "disputes.subtitle",
                "Structured arbitration for weight discrepancies, moisture grade variances, and transit delivery claims."
              )}
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("disputes.activeClaims", "Active Claims")}</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {disputes.filter((d) => d.status !== "Resolved" && d.status !== "Closed").length}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">{t("disputes.underMediation", "Under mediation")}</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("disputes.evidenceReview", "Evidence Review")}</div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {disputes.filter((d) => d.status === "Under Review").length}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">{t("disputes.inspectorAssigned", "Inspector assigned")}</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("disputes.resolvedAmicably", "Resolved Amicably")}</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {disputes.filter((d) => d.status === "Resolved" || d.status === "Closed").length}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">{t("disputes.settledWithin48h", "Settled within 48h")}</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("disputes.arbitrationRate", "Arbitration Rate")}</div>
            <div className="text-2xl font-bold text-farmly-foreground mt-1">98.4%</div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
              {t("disputes.fpoApproved", "FPO approved")}
            </div>
          </Card>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-farmly-border pb-3">
          {statuses.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setFilter(st.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === st.value
                  ? "bg-farmly-primary text-white font-bold"
                  : "bg-farmly-surface border border-farmly-border text-farmly-muted hover:text-farmly-foreground"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Disputes List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-farmly-muted text-xs">
              {t("disputes.noDisputes", "No disputes found matching criteria.")}
            </Card>
          ) : (
            filtered.map((d) => (
              <Card
                key={d.id}
                className="bg-farmly-surface border-farmly-border p-5 space-y-3 hover:border-farmly-accent/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{d.id}</span>
                      <span className="text-xs text-farmly-muted">•</span>
                      <Link href={`/lots/${d.lotId}`} className="font-mono text-xs text-farmly-foreground hover:underline">
                        Lot {d.lotId}
                      </Link>
                      <StatusBadge status={d.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-farmly-foreground">{d.category}</h3>
                  </div>

                  <span className="text-xs text-farmly-muted font-mono">{d.createdDate}</span>
                </div>

                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs text-farmly-muted flex items-center justify-between">
                  <div>
                    <span className="text-farmly-foreground font-medium">
                      {d.farmerName} ({t("common.grower", "Grower")})
                    </span>
                    <span className="mx-2 text-farmly-muted">vs</span>
                    <span className="text-farmly-foreground font-medium">
                      {d.buyerName} ({t("common.buyer", "Buyer")})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    {d.evidence.length} {t("disputes.evidenceFiles", "evidence files")}
                  </span>
                </div>

                <p className="text-xs text-farmly-muted line-clamp-2 leading-relaxed">
                  {d.description}
                </p>

                <div className="pt-2 border-t border-farmly-border flex justify-end">
                  <Link href={`/disputes/${d.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8 font-medium">
                      {t("disputes.inspectTimeline", "Inspect Timeline & Evidence")}{" "}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
