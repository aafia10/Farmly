"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Boxes,
  FileCheck2,
  Wheat,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";

export default function HelperDashboardPage() {
  const { farmers, lots, evidence, helperActivities, cropAvailabilities } = useMockData();
  const { user } = useAuth();
  const { t } = useTranslation();

  const pendingEvidenceCount = evidence.filter((e) => e.status === "Pending").length;
  const pendingRegistrationsCount = farmers.filter((f) => f.status === "Needs Review" || f.status === "Pending").length;

  const statCards = [
    {
      title: t("helper.farmersAssisted", "Farmers Assisted"),
      value: farmers.length.toString(),
      subtext: "Across 4 collection zones",
      icon: Users,
      color: "text-emerald-400",
      href: "/helper/farmers",
    },
    {
      title: t("helper.pendingRegistrations", "Pending Registrations"),
      value: pendingRegistrationsCount.toString(),
      subtext: "Awaiting field checks",
      icon: Clock,
      color: "text-amber-400",
      href: "/helper/farmers",
    },
    {
      title: t("helper.pendingEvidence", "Pending Evidence"),
      value: pendingEvidenceCount.toString(),
      subtext: "Scale & assay receipts",
      icon: FileCheck2,
      color: "text-sky-400",
      href: "/helper/evidence",
    },
    {
      title: t("helper.lotsDocumented", "Lots Documented"),
      value: lots.length.toString(),
      subtext: "Verified crop batches",
      icon: Boxes,
      color: "text-emerald-300",
      href: "/helper/lots",
    },
  ];

  return (
    <AppLayout title="Field Assistance Workspace">
      <div className="space-y-8">
        {/* Helper Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-farmly-primary/30 via-farmly-surface-elevated to-farmly-surface border border-farmly-accent/40 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-farmly-accent/20 border border-farmly-accent/40 text-[11px] font-mono font-semibold text-emerald-300">
                Assigned Desk: {user?.district || "Anand District"}
              </span>
              <span className="text-xs text-farmly-muted-dark">● Operational</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Namaste, {user?.fullName || "Priya Sharma"}
            </h2>
            <p className="text-sm text-farmly-muted max-w-2xl leading-relaxed">
              Assisting growers with identity registration, pre-harvest crop availability, IoT digital weighment records, and fair buyer offers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link href="/helper/farmers/new" className="w-full sm:w-auto">
              <Button variant="default" size="md" className="gap-2 w-full shadow-lg shadow-farmly-primary/30">
                <UserPlus className="w-4 h-4" />
                <span>Add Farmer</span>
              </Button>
            </Link>
            <Link href="/helper/lots" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="gap-2 w-full border-farmly-accent/40">
                <Boxes className="w-4 h-4" />
                <span>Document Lot</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="group outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded-2xl">
                <Card hoverGlow className="p-6 h-full flex flex-col justify-between border-farmly-border/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-farmly-muted tracking-wide">
                      {card.title}
                    </span>
                    <div className="p-2.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-farmly-accent group-hover:scale-105 transition-transform">
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                      {card.value}
                    </div>
                    <div className="text-xs text-farmly-muted-dark mt-1 flex items-center justify-between">
                      <span>{card.subtext}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-farmly-accent" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 2-Column Section: Recent Assisted Farmers & Today's Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Recent Assisted Farmers */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Recent Assisted Farmers</h3>
                <p className="text-xs text-farmly-muted">Growers supported with digital onboarding and lot creation</p>
              </div>
              <Link href="/helper/farmers">
                <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:text-emerald-300">
                  <span>View All ({farmers.length})</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {farmers.slice(0, 4).map((f) => (
                <Link
                  key={f.id}
                  href={`/helper/farmers/${f.id}`}
                  className="block group outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded-2xl"
                >
                  <Card hoverGlow className="p-4 sm:p-5 border-farmly-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-center text-farmly-accent font-mono font-bold text-sm shrink-0">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white group-hover:text-emerald-300 transition-colors text-sm sm:text-base">
                            {f.name}
                          </h4>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-farmly-surface-elevated border border-farmly-border text-farmly-muted">
                            {f.id}
                          </span>
                        </div>
                        <div className="text-xs text-farmly-muted-dark mt-0.5 flex items-center gap-2">
                          <span>{f.village}, {f.district}</span>
                          <span>•</span>
                          <span>Lang: {f.language}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-farmly-border/40">
                      <StatusBadge status={f.status} size="sm" />
                      <span className="text-[11px] text-farmly-muted-dark font-mono">
                        {f.lastActivity}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Today's Audit Activity Feed */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Today&apos;s Field Log</h3>
                <p className="text-xs text-farmly-muted">Timestamped audit record of helper assistance</p>
              </div>
              <Link href="/helper/activity">
                <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:text-emerald-300">
                  <span>Full Audit</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>

            <Card className="p-5 border-farmly-border/70 space-y-4">
              {helperActivities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 pb-3.5 border-b border-farmly-border/40 last:border-0 last:pb-0"
                >
                  <span className="text-[11px] font-mono font-bold text-farmly-accent bg-farmly-surface-elevated px-2 py-1 rounded-md shrink-0">
                    {act.timestamp}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
                      {act.action}
                    </p>
                    <p className="text-[11px] text-farmly-muted-dark mt-0.5 truncate">
                      {act.details}
                    </p>
                  </div>
                  <StatusBadge status={act.badgeStatus} size="sm" />
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
