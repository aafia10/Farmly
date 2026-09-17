"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  Filter,
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

export default function DisputesPage() {
  const { disputes } = useMockData();
  const [filter, setFilter] = useState("All");

  const statuses = ["All", "Open", "Under Review", "Waiting for Evidence", "Resolved", "Closed"];

  const filtered = disputes.filter((d) => {
    if (filter === "All") return true;
    return d.status === filter;
  });

  return (
    <AppLayout title="Dispute Mediation">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Agricultural Dispute Mediation</h1>
            <p className="text-xs text-farmly-muted">
              Structured arbitration for weight discrepancies, moisture grade variances, and transit delivery claims.
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Active Claims</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {disputes.filter((d) => d.status !== "Resolved" && d.status !== "Closed").length}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">Under mediation</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Evidence Review</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">
              {disputes.filter((d) => d.status === "Under Review").length}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">Inspector assigned</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Resolved Amicably</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {disputes.filter((d) => d.status === "Resolved" || d.status === "Closed").length}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">Settled within 48h</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Arbitration Rate</div>
            <div className="text-2xl font-bold text-white mt-1">98.4%</div>
            <div className="text-[11px] text-emerald-400 mt-1">FPO approved</div>
          </Card>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-farmly-border pb-3">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === st
                  ? "bg-farmly-primary text-white"
                  : "bg-farmly-surface border border-farmly-border text-farmly-muted hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Disputes List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-farmly-muted text-xs">
              No disputes found under the &quot;{filter}&quot; category.
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
                      <span className="font-mono text-xs font-bold text-red-400">{d.id}</span>
                      <span className="text-xs text-farmly-muted">•</span>
                      <Link href={`/lots/${d.lotId}`} className="font-mono text-xs text-white hover:underline">
                        Lot {d.lotId}
                      </Link>
                      <StatusBadge status={d.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-white">{d.category}</h3>
                  </div>

                  <span className="text-xs text-farmly-muted font-mono">{d.createdDate}</span>
                </div>

                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs text-farmly-muted flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium">{d.farmerName} (Grower)</span>
                    <span className="mx-2 text-farmly-muted">vs</span>
                    <span className="text-white font-medium">{d.buyerName} (Buyer)</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">{d.evidence.length} evidence files</span>
                </div>

                <p className="text-xs text-farmly-muted line-clamp-2 leading-relaxed">
                  {d.description}
                </p>

                <div className="pt-2 border-t border-farmly-border flex justify-end">
                  <Link href={`/disputes/${d.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8">
                      Inspect Timeline & Evidence <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
