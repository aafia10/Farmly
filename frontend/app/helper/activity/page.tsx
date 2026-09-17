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
import { useTranslation } from "@/contexts/language-context";
import { HelperActivity } from "@/types";

export default function HelperActivityPage() {
  const { helperActivities } = useMockData();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = [
    { value: "All", label: t("common.all", "All") },
    { value: "Registration", label: t("helper.registration", "Registration") },
    { value: "Crop Availability", label: t("nav.cropAvailability", "Crop Availability") },
    { value: "Lot Creation", label: t("helper.lotCreation", "Lot Creation") },
    { value: "Evidence", label: t("nav.evidence", "Evidence") },
    { value: "Offer", label: t("nav.offers", "Offer") },
    { value: "Profile", label: t("nav.profile", "Profile") },
  ];

  const filtered = helperActivities.filter((act) => {
    if (activeFilter === "All") return true;
    return act.category === activeFilter;
  });

  const getCategoryIcon = (category: HelperActivity["category"]) => {
    switch (category) {
      case "Registration":
        return <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case "Crop Availability":
        return <Wheat className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "Lot Creation":
        return <Boxes className="w-5 h-5 text-farmly-accent" />;
      case "Evidence":
        return <FileCheck2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "Offer":
        return <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <User className="w-5 h-5 text-farmly-muted" />;
    }
  };

  const handleExport = () => {
    setToastMessage(t("helper.csvExportReady", "Activity CSV export ready. In production, this downloads cryptographic audit logs."));
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <AppLayout title={t("nav.activities", "Field Activity Log")}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {t("helper.activityAuditTitle", "Helper Activity Audit Log")}
            </h1>
            <p className="text-xs text-farmly-muted">
              {t(
                "helper.activityAuditDesc",
                "Immutable digital ledger of all assisted farmer registrations, crop availabilities, lot creations, and evidence uploads."
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-farmly-border text-xs text-farmly-foreground hover:bg-farmly-surface-elevated shrink-0 font-medium"
          >
            <Download className="w-4 h-4 mr-1.5 text-farmly-accent" />
            {t("helper.exportAuditTrail", "Export Audit Trail")}
          </Button>
        </div>

        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("helper.totalActivities", "Total Activities")}</div>
            <div className="text-2xl font-bold text-farmly-foreground mt-1">{helperActivities.length}</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("helper.todayLogs", "Today's Logs")}</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {helperActivities.filter((a) => a.timestamp.includes("now") || a.timestamp.includes("Today")).length || 3}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("helper.farmerRegistrations", "Farmer Registrations")}</div>
            <div className="text-2xl font-bold text-farmly-foreground mt-1">
              {helperActivities.filter((a) => a.category === "Registration").length}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">{t("helper.evidenceActions", "Evidence Actions")}</div>
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">
              {helperActivities.filter((a) => a.category === "Evidence").length}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveFilter(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === cat.value
                  ? "bg-farmly-primary text-white shadow-sm font-bold"
                  : "bg-farmly-surface border border-farmly-border text-farmly-muted hover:text-farmly-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Activity Stream */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="bg-farmly-surface border-farmly-border p-8 text-center text-farmly-muted text-sm">
              {t("helper.noActivityCategory", "No activity records found in this category.")}
            </Card>
          ) : (
            filtered.map((act) => (
              <Card key={act.id} className="bg-farmly-surface border-farmly-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-center shrink-0">
                  {getCategoryIcon(act.category)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-farmly-foreground">{act.action}</span>
                    <span className="text-[11px] text-farmly-muted font-mono shrink-0">{act.timestamp}</span>
                  </div>

                  <p className="text-xs text-farmly-muted leading-relaxed">{act.details}</p>

                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-farmly-surface-elevated border border-farmly-border font-mono text-farmly-muted">
                      {act.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/20">
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
