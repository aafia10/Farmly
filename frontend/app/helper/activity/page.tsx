"use client";

import React, { useState } from "react";
import {
  Activity,
  Users,
  Wheat,
  Boxes,
  FileCheck2,
  FileText,
  User,
  Download,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/contexts/mock-data-context";
import { HelperActivity } from "@/types";

export default function HelperActivityPage() {
  const { helperActivities } = useMockData();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = [
    "All",
    "Registration",
    "Crop Availability",
    "Lot Creation",
    "Evidence",
    "Offer",
    "Profile",
  ];

  const filtered = helperActivities.filter((act) => {
    if (activeFilter === "All") return true;
    return act.category === activeFilter;
  });

  const getCategoryIcon = (category: HelperActivity["category"]) => {
    switch (category) {
      case "Registration":
        return <Users className="w-5 h-5 text-emerald-400" />;
      case "Crop Availability":
        return <Wheat className="w-5 h-5 text-amber-400" />;
      case "Lot Creation":
        return <Boxes className="w-5 h-5 text-farmly-accent" />;
      case "Evidence":
        return <FileCheck2 className="w-5 h-5 text-sky-400" />;
      case "Offer":
        return <FileText className="w-5 h-5 text-purple-400" />;
      default:
        return <User className="w-5 h-5 text-farmly-muted" />;
    }
  };

  const handleExport = () => {
    setToastMessage("Activity CSV export ready. In production, this downloads cryptographic audit logs.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <AppLayout title="Field Activity Log">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Helper Activity Audit Log</h1>
            <p className="text-xs text-farmly-muted">
              Immutable digital ledger of all assisted farmer registrations, crop availabilities, lot creations, and evidence uploads.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-farmly-border text-xs text-white hover:bg-farmly-surface-elevated shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5 text-farmly-accent" />
            Export Audit Trail
          </Button>
        </div>

        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {toastMessage}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Total Activities</div>
            <div className="text-2xl font-bold text-white mt-1">{helperActivities.length}</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Today&apos;s Logs</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {helperActivities.filter((a) => a.timestamp.includes("now") || a.timestamp.includes("Today")).length || 3}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Farmer Registrations</div>
            <div className="text-2xl font-bold text-white mt-1">
              {helperActivities.filter((a) => a.category === "Registration").length}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Evidence Actions</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">
              {helperActivities.filter((a) => a.category === "Evidence").length}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === cat
                  ? "bg-farmly-primary text-white shadow-sm"
                  : "bg-farmly-surface border border-farmly-border text-farmly-muted hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Activity Stream */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="bg-farmly-surface border-farmly-border p-8 text-center text-farmly-muted text-sm">
              No activity records found in this category.
            </Card>
          ) : (
            filtered.map((act) => (
              <Card key={act.id} className="bg-farmly-surface border-farmly-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-center shrink-0">
                  {getCategoryIcon(act.category)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{act.action}</span>
                    <span className="text-[11px] text-farmly-muted font-mono shrink-0">{act.timestamp}</span>
                  </div>

                  <p className="text-xs text-farmly-muted leading-relaxed">{act.details}</p>

                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-farmly-surface-elevated border border-farmly-border font-mono text-farmly-muted">
                      {act.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      {act.badgeStatus}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
