"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, UserPlus, Filter, ShieldCheck, ArrowRight, Phone, MapPin } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";

export default function HelperFarmersListPage() {
  const { farmers } = useMockData();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const accessibleFarmers = useMemo(() => {
    if (!user) return [];
    const helperId = user.id;
    const helperNameLower = user.fullName?.toLowerCase();
    return farmers.filter((f) => {
      const matchesHelperId = f.assistedByHelperId && (
        f.assistedByHelperId === helperId ||
        (user.id === "usr_help_01" && f.assistedByHelperId === "e1000000-0000-0000-0000-000000000002")
      );
      const matchesHelperName = f.assistedBy?.helperName && helperNameLower && f.assistedBy.helperName.toLowerCase() === helperNameLower;
      return Boolean(matchesHelperId || matchesHelperName);
    });
  }, [farmers, user]);

  const districts = useMemo(() => Array.from(new Set(accessibleFarmers.map((f) => f.district))), [accessibleFarmers]);
  const languages = useMemo(() => Array.from(new Set(accessibleFarmers.map((f) => f.language))), [accessibleFarmers]);

  const filteredFarmers = useMemo(() => {
    return accessibleFarmers.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.mobile.includes(searchQuery);

      const matchesDistrict = districtFilter === "all" || f.district === districtFilter;
      const matchesLanguage = languageFilter === "all" || f.language === languageFilter;
      const matchesStatus = statusFilter === "all" || f.status === statusFilter;

      return matchesSearch && matchesDistrict && matchesLanguage && matchesStatus;
    });
  }, [accessibleFarmers, searchQuery, districtFilter, languageFilter, statusFilter]);

  return (
    <AppLayout title={t("nav.farmers", "Assisted Farmers Directory")}>
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {t("nav.farmers", "Registered Farmers")}
            </h2>
            <p className="text-xs sm:text-sm text-farmly-muted">
              {t(
                "helper.farmersSubtitle",
                "Manage farmer records, verification statuses, and crop profiles."
              )}
            </p>
          </div>
          <Link href="/helper/farmers/new">
            <Button size="md" className="gap-2 shadow-md shadow-farmly-primary/30 font-semibold text-white">
              <UserPlus className="w-4 h-4" />
              <span>{t("nav.addFarmer", "Add New Farmer")}</span>
            </Button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <Card className="p-4 border-farmly-border/80 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-farmly-muted-dark absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  "helper.searchFarmerPlaceholder",
                  "Search by name, ID (e.g. FM-10294), mobile or village..."
                )}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-sm text-farmly-foreground placeholder:text-farmly-muted-dark focus:border-farmly-accent outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs text-farmly-foreground outline-none focus:border-farmly-accent"
                aria-label="Filter by district"
              >
                <option value="all">{t("common.all", "All Districts")}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs text-farmly-foreground outline-none focus:border-farmly-accent"
                aria-label="Filter by language"
              >
                <option value="all">{t("common.all", "All Languages")}</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs text-farmly-foreground outline-none focus:border-farmly-accent"
                aria-label="Filter by status"
              >
                <option value="all">{t("common.all", "All Statuses")}</option>
                <option value="Active">{t("status.active", "Active")}</option>
                <option value="Needs Review">{t("status.needsReview", "Needs Review")}</option>
                <option value="Pending">{t("status.pending", "Pending")}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Farmers Table / Grid */}
        <div className="space-y-3">
          {filteredFarmers.length === 0 ? (
            <Card className="p-12 text-center text-farmly-muted">
              <p className="text-sm">{t("helper.noFarmersFound", "No farmers matched your search or filters.")}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSearchQuery("");
                  setDistrictFilter("all");
                  setLanguageFilter("all");
                  setStatusFilter("all");
                }}
              >
                {t("common.clearFilters", "Clear Filters")}
              </Button>
            </Card>
          ) : (
            filteredFarmers.map((farmer) => (
              <Link
                key={farmer.id}
                href={`/helper/farmers/${farmer.id}`}
                className="block group outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded-2xl"
              >
                <Card hoverGlow className="p-5 border-farmly-border/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-farmly-surface-elevated border border-farmly-border text-farmly-accent flex items-center justify-center font-mono font-extrabold text-base shrink-0 group-hover:scale-105 transition-transform">
                      {farmer.name.charAt(0)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-farmly-foreground text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                          {farmer.name}
                        </h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-farmly-surface-elevated border border-farmly-border text-emerald-800 dark:text-emerald-300 font-semibold">
                          {farmer.id}
                        </span>
                        <StatusBadge status={farmer.verificationLevel} size="sm" />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-farmly-muted">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-farmly-accent" />
                          {farmer.village}, {farmer.district}, {farmer.state}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-farmly-accent" />
                          {farmer.mobile}
                        </span>
                        <span>•</span>
                        <span>
                          {t("profile.language", "Lang")}: <strong className="text-farmly-foreground">{farmer.language}</strong>
                        </span>
                      </div>

                      <div className="text-xs text-farmly-muted-dark pt-1">
                        {t("profile.farmingCategory", "Category")}: <span className="text-farmly-foreground">{farmer.farmingCategory}</span> | FPO: {farmer.fpo || "Individual"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-farmly-border/40">
                    <div className="flex flex-col md:items-end">
                      <StatusBadge status={farmer.status} size="sm" />
                      <span className="text-[11px] text-farmly-muted-dark mt-1 font-mono">
                        Active: {farmer.lastActivity}
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-farmly-surface-elevated border border-farmly-border flex items-center justify-center text-farmly-muted group-hover:text-farmly-foreground group-hover:border-farmly-accent/40 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
