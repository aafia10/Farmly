"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Boxes, ClipboardList, Users, type LucideIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useTranslation } from "@/contexts/language-context";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";

function StatCard({ label, value, hint, icon: Icon, href }: { label: string; value: number; hint: string; icon: LucideIcon; href: string }) {
  return (
    <Link href={href} className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent">
      <Card className="p-5 sm:p-6 h-full flex items-start justify-between gap-4 group-hover:border-farmly-primary/40">
        <div className="space-y-1">
          <p className="text-sm text-farmly-muted">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold text-farmly-foreground tracking-tight">{value}</p>
          <p className="text-xs text-farmly-muted">{hint}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-farmly-primary/10 text-farmly-primary dark:text-farmly-accent-light flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-farmly-primary dark:text-farmly-accent-light hover:underline inline-flex items-center gap-1">
      View all <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export default function HelperDashboardPage() {
  const { farmers, lots, evidence, helperActivities } = useMockData();
  const { user } = useAuth();
  const { t } = useTranslation();

  const pendingRegistrations = farmers.filter((f) => f.status === "Needs Review" || f.status === "Pending").length;
  const pendingEvidence = evidence.filter((e) => e.status === "Pending").length;

  return (
    <AppLayout title={t("nav.dashboard", "Dashboard")}>
      <div className="space-y-8 sm:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-farmly-foreground tracking-tight">Namaste, {user?.fullName || "there"}</h1>
            <p className="text-sm text-farmly-muted">Farmers you assist, registrations and pending field tasks.</p>
          </div>
          <Link href="/helper/farmers" className="shrink-0">
            <Button className="gap-2"><Users className="w-4 h-4" /> Open farmers</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatCard icon={Users} label={t("helper.farmersAssisted", "Farmers assisted")} value={farmers.length} hint="Registered with your help" href="/helper/farmers" />
          <StatCard
            icon={ClipboardList}
            label="Pending tasks"
            value={pendingRegistrations + pendingEvidence}
            hint={`${pendingRegistrations} registrations, ${pendingEvidence} evidence reviews`}
            href={pendingEvidence > 0 ? "/helper/evidence" : "/helper/farmers"}
          />
          <StatCard icon={Boxes} label={t("helper.lotsDocumented", "Crop lots documented")} value={lots.length} hint="Crop registrations" href="/helper/lots" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-farmly-foreground">Recent farmers</h2>
              <SeeAll href="/helper/farmers" />
            </div>
            {farmers.length === 0 ? (
              <Card className="px-5 py-10 text-center text-sm text-farmly-muted">No farmers registered yet.</Card>
            ) : (
              <Card className="divide-y divide-farmly-border overflow-hidden">
                {farmers.slice(0, 5).map((f) => (
                  <Link key={f.id} href={`/helper/farmers/${f.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-farmly-surface-elevated/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-farmly-primary/10 text-farmly-primary dark:text-farmly-accent-light flex items-center justify-center text-sm font-semibold shrink-0">
                        {f.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-farmly-foreground truncate">{f.name}</div>
                        <div className="text-xs text-farmly-muted truncate">{f.village}, {f.district}</div>
                      </div>
                    </div>
                    <StatusBadge status={f.status} size="sm" />
                  </Link>
                ))}
              </Card>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-farmly-foreground">Field activity</h2>
              <SeeAll href="/helper/activity" />
            </div>
            {helperActivities.length === 0 ? (
              <Card className="px-5 py-10 text-center text-sm text-farmly-muted">No activity recorded yet.</Card>
            ) : (
              <Card className="divide-y divide-farmly-border overflow-hidden">
                {helperActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-farmly-foreground">{act.action}</div>
                      <div className="text-xs text-farmly-muted truncate">{act.timestamp} · {act.details}</div>
                    </div>
                    <StatusBadge status={act.badgeStatus} size="sm" />
                  </div>
                ))}
              </Card>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
