"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Search,
  Plus,
  ArrowRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";

export default function LotsPage() {
  const { role } = useAuth();
  const { lots } = useMockData();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statusKeys: { value: string; label: string }[] = [
    { value: "All", label: t("lots.statusAll", "All") },
    { value: "Active", label: t("lots.statusActive", "Active") },
    { value: "Under Offer", label: t("lots.statusUnderOffer", "Under Offer") },
    { value: "Sold", label: t("lots.statusSold", "Sold") },
    { value: "Split", label: t("lots.statusSplit", "Split") },
    { value: "In Transit", label: t("lots.statusInTransit", "In Transit") },
    { value: "Delivered", label: t("lots.statusDelivered", "Delivered") },
  ];

  const filteredLots = lots.filter((lot) => {
    const query = search.toLowerCase();
    const matchSearch =
      lot.id.toLowerCase().includes(query) ||
      lot.crop.toLowerCase().includes(query) ||
      lot.farmerName.toLowerCase().includes(query) ||
      lot.location.toLowerCase().includes(query);

    const matchStatus = statusFilter === "All" || lot.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const pageTitle =
    role === "farmer"
      ? t("lots.title", "My Harvest Produce Lots")
      : t("lots.directoryTitle", "Produce Lots Ledger");

  return (
    <AppLayout title={role === "farmer" ? "My Harvest Lots" : "Harvest Lots Directory"}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-xs text-farmly-muted">
              {t(
                "lots.subtitle",
                "Standardized agricultural inventory units verified with physical weighments, quality grades, and cryptographic identifiers."
              )}
            </p>
          </div>

          {role === "helper" && (
            <Link href="/helper/lots">
              <Button className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9">
                <Plus className="w-4 h-4 mr-1.5" />
                {t("lots.documentNew", "Document New Lot")}
              </Button>
            </Link>
          )}
          {role === "farmer" && (
            <Link href="/lots/new">
              <Button className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9">
                <Plus className="w-4 h-4 mr-1.5" />
                {t("lots.documentNew", "Document New Lot")}
              </Button>
            </Link>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-farmly-surface border border-farmly-border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmly-muted" />
            <Input
              placeholder={t("lots.searchPlaceholder", "Search ID, crop, farmer...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {statusKeys.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setStatusFilter(st.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st.value
                    ? "bg-farmly-primary text-white"
                    : "text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lots List */}
        {filteredLots.length === 0 ? (
          <Card className="bg-farmly-surface border-farmly-border p-12 text-center space-y-2">
            <Boxes className="w-12 h-12 text-farmly-muted mx-auto opacity-30" />
            <div className="text-sm font-semibold text-farmly-foreground">
              {t("lots.noLotsFound", "No lots matching your criteria.")}
            </div>
            <p className="text-xs text-farmly-muted">
              {t("common.clearFilters", "Try clearing your filters or search keywords.")}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLots.map((lot) => (
              <Card
                key={lot.id}
                className="bg-farmly-surface border-farmly-border hover:border-farmly-accent/50 transition-all p-5 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs font-bold text-farmly-accent">{lot.id}</div>
                      <h3 className="text-lg font-bold text-farmly-foreground group-hover:text-emerald-500 transition-colors">
                        {lot.crop}
                      </h3>
                      <div className="text-xs text-farmly-muted">{lot.variety}</div>
                    </div>
                    <StatusBadge status={lot.status} size="sm" />
                  </div>

                  <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-farmly-muted">{t("lots.volume", "Volume")}:</span>
                      <span className="font-bold text-farmly-foreground text-sm">
                        {lot.quantity} {lot.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-farmly-muted">{t("lots.qualityGrade", "Quality Grade")}:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{lot.qualityGrade}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-farmly-muted">{t("lots.grower", "Grower")}:</span>
                      <span className="text-farmly-foreground font-medium truncate max-w-[110px]">{lot.farmerName}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-farmly-muted">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-farmly-muted-dark shrink-0" />
                      <span className="truncate">{lot.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-farmly-muted-dark shrink-0" />
                      <span>{t("lots.documentedOn", "Documented")} {lot.createdDate}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-farmly-border/60 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-farmly-muted">
                    {lot.certificateRef
                      ? t("lots.agmarkCertified", "Agmark Certified")
                      : t("lots.verifiedScale", "Verified Scale")}
                  </span>
                  <Link href={`/lots/${lot.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8 font-medium">
                      {t("lots.inspectLot", "Inspect Lot")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
