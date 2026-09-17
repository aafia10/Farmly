"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  Lock,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";

export default function MarketplacePage() {
  const { lots } = useMockData();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");

  const marketplaceLots = lots.filter(
    (lot) => lot.status === "Active" || lot.status === "Under Offer"
  );

  const filtered = marketplaceLots.filter((lot) => {
    const query = search.toLowerCase();
    const matchSearch =
      lot.id.toLowerCase().includes(query) ||
      lot.crop.toLowerCase().includes(query) ||
      lot.location.toLowerCase().includes(query);

    const matchGrade = gradeFilter === "All" || lot.qualityGrade === gradeFilter;

    return matchSearch && matchGrade;
  });

  const gradeOptions = [
    { value: "All", label: t("marketplace.allGrades", "All Grades") },
    { value: "Grade A", label: "Grade A" },
    { value: "Grade B", label: "Grade B" },
    { value: "Standard", label: "Standard" },
  ];

  return (
    <AppLayout title={t("nav.marketplace", "Produce Marketplace")}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Privacy Notice Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-farmly-primary/30 to-farmly-surface border border-farmly-border flex items-start gap-3 text-xs text-farmly-muted">
          <Lock className="w-5 h-5 text-farmly-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-farmly-foreground font-bold text-sm">
              {t("marketplace.privacyTitle", "Privacy-Safe Trading Protocol")}
            </div>
            <p className="leading-relaxed">
              {t(
                "marketplace.privacyDesc",
                "Farmer personal contact details, Aadhaar IDs, and private land surveys are strictly redacted. Wholesale buyers and distributors place binding bids directly against verified batch specs. Settlement is held in transparent escrow until produce handover is certified."
              )}
            </p>
          </div>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
            {t("marketplace.title", "Agricultural Produce Marketplace")}
          </h1>
          <p className="text-xs text-farmly-muted mt-1">
            {t(
              "marketplace.subtitle",
              "Browse verified harvest lots from trusted growers across regional collection hubs."
            )}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-farmly-surface border border-farmly-border">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmly-muted" />
            <Input
              placeholder={t("marketplace.searchPlaceholder", "Search crops, grades, or regions...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {gradeOptions.map((grade) => (
              <button
                key={grade.value}
                type="button"
                onClick={() => setGradeFilter(grade.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  gradeFilter === grade.value
                    ? "bg-farmly-primary text-white"
                    : "text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </div>

        {/* Marketplace Grid */}
        {filtered.length === 0 ? (
          <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-farmly-muted text-xs">
            {t("marketplace.noLots", "No marketplace produce lots found matching your filter criteria.")}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((lot) => {
              const stateName = lot.location.split(",").pop()?.trim() || "Gujarat";

              return (
                <Card
                  key={lot.id}
                  className="bg-farmly-surface border-farmly-border hover:border-farmly-accent/50 transition-all p-5 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-farmly-accent">{lot.id}</span>
                        <h3 className="text-lg font-bold text-farmly-foreground group-hover:text-emerald-500 transition-colors mt-0.5">
                          {lot.crop}
                        </h3>
                        <div className="text-xs text-farmly-muted">{lot.variety}</div>
                      </div>
                      <StatusBadge status={lot.qualityGrade} size="sm" />
                    </div>

                    <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-farmly-muted">{t("lots.volume", "Available Volume")}:</span>
                        <span className="font-bold text-farmly-foreground text-sm">
                          {lot.quantity} {lot.unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-farmly-muted">{t("marketplace.regionalOrigin", "Regional Origin")}:</span>
                        <span className="text-farmly-foreground font-medium">{stateName} Region</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-farmly-muted">{t("marketplace.auditStandard", "Audit Standard")}:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-300 font-semibold">
                          {lot.certificateRef
                            ? t("lots.agmarkCertified", "AGMARK Tested")
                            : t("lots.verifiedScale", "Scale Certified")}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-farmly-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-farmly-muted-dark" />
                      <span>
                        {t("lots.documentedOn", "Documented")} {lot.createdDate}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-farmly-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {t("marketplace.readyForBidding", "Ready for Bidding")}
                    </span>
                    <Link href={`/marketplace/${lot.id}`}>
                      <Button className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-8">
                        {t("marketplace.makeOffer", "Inspect & Bid")}{" "}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
