"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  ShieldCheck,
  Wheat,
  Boxes,
  FileCheck2,
  FileText,
  CreditCard,
  AlertTriangle,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { cn } from "@/lib/utils";

export default function HelperFarmerDetailPage() {
  const params = useParams();
  const farmerId = params.id as string;
  const { farmers, cropAvailabilities, lots, evidence, offers, payments, disputes, helperActivities } = useMockData();

  const [activeTab, setActiveTab] = useState<
    "overview" | "cropAvailability" | "lots" | "evidence" | "offers" | "payments" | "disputes" | "activities"
  >("overview");

  const farmer = farmers.find((f) => f.id === farmerId) || farmers[0];

  const farmerCropAvail = cropAvailabilities.filter((c) => c.farmerId === farmer.id || c.farmerName === farmer.name);
  const farmerLots = lots.filter((l) => l.farmerId === farmer.id || l.farmerName === farmer.name);
  const farmerEvidence = evidence.filter((e) => e.farmerId === farmer.id || e.farmerName === farmer.name);
  const farmerOffers = offers.filter((o) => farmerLots.some((l) => l.id === o.lotId));
  const farmerPayments = payments.filter((p) => farmerOffers.some((o) => o.id === p.offerId));
  const farmerDisputes = disputes.filter((d) => d.farmerName.includes(farmer.name));

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "cropAvailability", label: `Crop Availability (${farmerCropAvail.length})`, icon: Wheat },
    { id: "lots", label: `Lots (${farmerLots.length})`, icon: Boxes },
    { id: "evidence", label: `Evidence (${farmerEvidence.length})`, icon: FileCheck2 },
    { id: "offers", label: `Offers (${farmerOffers.length})`, icon: FileText },
    { id: "payments", label: `Payments (${farmerPayments.length})`, icon: CreditCard },
    { id: "disputes", label: `Disputes (${farmerDisputes.length})`, icon: AlertTriangle },
    { id: "activities", label: "Activity History", icon: Clock },
  ];

  return (
    <AppLayout title={`Farmer Profile: ${farmer.name}`}>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/helper/farmers"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-farmly-muted hover:text-farmly-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Farmers Directory</span>
        </Link>

        {/* Profile Top Card */}
        <Card className="p-6 sm:p-8 border-farmly-border/80 bg-gradient-to-br from-farmly-surface-elevated to-farmly-surface">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-farmly-primary/40 border border-farmly-accent/40 flex items-center justify-center text-emerald-300 font-mono font-black text-2xl shrink-0">
                {farmer.name.charAt(0)}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-extrabold text-farmly-foreground">{farmer.name}</h2>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-farmly-surface border border-farmly-border text-emerald-300">
                    {farmer.id}
                  </span>
                  <StatusBadge status={farmer.verificationLevel} size="sm" />
                  <StatusBadge status={farmer.status} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-farmly-muted">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-farmly-accent" />
                    {farmer.village}, {farmer.district}, {farmer.state}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-farmly-accent" />
                    {farmer.mobile}
                  </span>
                  <span>Primary: <strong>{farmer.farmingCategory}</strong></span>
                </div>
              </div>
            </div>

            {/* Assisted By Callout */}
            <div className="p-4 rounded-2xl bg-farmly-surface border border-farmly-accent/30 text-xs space-y-1.5 max-w-xs w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-farmly-accent font-bold">
                <HeartHandshake className="w-4 h-4" />
                <span>Assisted by Helper</span>
              </div>
              <p className="text-farmly-foreground font-medium">
                Helper: {farmer.assistedBy?.helperName || "Priya Sharma"}
              </p>
              <p className="text-[11px] text-farmly-muted-dark">
                Registered on {farmer.assistedBy?.date || "17 Sep 2026"}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-6 mt-6 border-t border-farmly-border/40">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as typeof activeTab)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all outline-none min-h-[38px]",
                    isSelected
                      ? "bg-farmly-primary text-white shadow-sm"
                      : "text-farmly-muted hover:bg-farmly-surface hover:text-farmly-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tab Content Panes */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-farmly-border/70 space-y-4">
              <h3 className="text-base font-bold text-farmly-foreground">Farmer Identity &amp; Location</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">Farmer ID:</span>
                  <span className="font-mono text-emerald-300 font-bold">{farmer.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">Full Name:</span>
                  <span className="text-farmly-foreground font-medium">{farmer.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">Mobile Number:</span>
                  <span className="text-farmly-foreground font-mono">{farmer.mobile}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">Village / Taluka:</span>
                  <span className="text-farmly-foreground">{farmer.village}, {farmer.taluka || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">District / State:</span>
                  <span className="text-farmly-foreground">{farmer.district}, {farmer.state}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-farmly-muted">Preferred Language:</span>
                  <span className="text-farmly-foreground font-medium">{farmer.language}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-farmly-border/70 space-y-4">
              <h3 className="text-base font-bold text-farmly-foreground">Verification &amp; Governance</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">Verification Level:</span>
                  <StatusBadge status={farmer.verificationLevel} size="sm" />
                </div>
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">FPO Affiliation:</span>
                  <span className="text-farmly-foreground">{farmer.fpo || "Independent Grower"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">Digital Consent:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Recorded &amp; Confirmed
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-farmly-border/40">
                  <span className="text-farmly-muted">Account Status:</span>
                  <StatusBadge status={farmer.status} size="sm" />
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-farmly-muted">Assisted By:</span>
                  <span className="text-farmly-accent font-semibold">{farmer.assistedBy?.helperName}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "cropAvailability" && (
          <div className="space-y-3">
            {farmerCropAvail.length === 0 ? (
              <Card className="p-8 text-center text-farmly-muted">No crop availability records yet.</Card>
            ) : (
              farmerCropAvail.map((c) => (
                <Card key={c.id} className="p-5 border-farmly-border/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-farmly-foreground text-base">{c.crop} ({c.variety})</h4>
                      <span className="font-mono text-xs text-farmly-muted">{c.id}</span>
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <p className="text-xs text-farmly-muted mt-1">
                      Estimated: <strong>{c.estimatedQuantity} {c.unit}</strong> | Harvest: {c.expectedHarvestDate} | Loc: {c.location}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "lots" && (
          <div className="space-y-3">
            {farmerLots.map((lot) => (
              <Link key={lot.id} href={`/lots/${lot.id}`} className="block">
                <Card hoverGlow className="p-5 border-farmly-border/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-farmly-foreground text-base">{lot.crop}</h4>
                      <span className="font-mono text-xs text-emerald-300">{lot.id}</span>
                      <StatusBadge status={lot.status} size="sm" />
                    </div>
                    <p className="text-xs text-farmly-muted mt-1">
                      Qty: <strong>{lot.quantity} {lot.unit}</strong> | Grade: {lot.qualityGrade} | {lot.location}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Inspect Lot</Button>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-3">
            {farmerEvidence.map((ev) => (
              <Card key={ev.id} className="p-5 border-farmly-border/70 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-farmly-foreground text-sm">{ev.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-farmly-surface-elevated text-farmly-accent">
                      {ev.category}
                    </span>
                    <StatusBadge status={ev.status} size="sm" />
                  </div>
                  <p className="text-xs text-farmly-muted mt-1">
                    Value: <strong className="text-farmly-foreground">{ev.value}</strong> | Source: {ev.source} | {ev.timestamp}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "offers" && (
          <div className="space-y-3">
            {farmerOffers.map((o) => (
              <Link key={o.id} href={`/offers/${o.id}`} className="block">
                <Card hoverGlow className="p-5 border-farmly-border/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-farmly-foreground text-sm">{o.buyerName}</h4>
                      <span className="font-mono text-xs text-farmly-muted">{o.id}</span>
                      <StatusBadge status={o.status} size="sm" />
                    </div>
                    <p className="text-xs text-farmly-muted mt-1">
                      Offered: {o.offeredQuantity} {o.unit} @ ₹{o.pricePerKg}/kg | Net: <strong>₹{o.expectedNet.toLocaleString()}</strong>
                    </p>
                  </div>
                  <Button variant="outline" size="sm">View Offer</Button>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-3">
            {farmerPayments.map((p) => (
              <Link key={p.id} href={`/payments/${p.id}`} className="block">
                <Card hoverGlow className="p-5 border-farmly-border/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-farmly-foreground text-sm">₹{p.amount.toLocaleString()}</h4>
                      <span className="font-mono text-xs text-farmly-muted">{p.id}</span>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                    <p className="text-xs text-farmly-muted mt-1">
                      Current Stage: <strong>{p.currentStage}</strong> | Payer: {p.payerName}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">View Timeline</Button>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "disputes" && (
          <div className="space-y-3">
            {farmerDisputes.map((d) => (
              <Link key={d.id} href={`/disputes/${d.id}`} className="block">
                <Card hoverGlow className="p-5 border-farmly-border/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-farmly-foreground text-sm">{d.category}</h4>
                      <span className="font-mono text-xs text-farmly-muted">{d.id}</span>
                      <StatusBadge status={d.status} size="sm" />
                    </div>
                    <p className="text-xs text-farmly-muted mt-1">{d.description}</p>
                  </div>
                  <Button variant="outline" size="sm">Inspect Dispute</Button>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {activeTab === "activities" && (
          <Card className="p-6 border-farmly-border/70 space-y-3">
            {helperActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 py-2 border-b border-farmly-border/30 last:border-0">
                <span className="text-xs font-mono text-farmly-accent bg-farmly-surface-elevated px-2 py-0.5 rounded">
                  {act.timestamp}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-farmly-foreground">{act.action}</p>
                  <p className="text-xs text-farmly-muted">{act.details}</p>
                </div>
                <StatusBadge status={act.badgeStatus} size="sm" />
              </div>
            ))}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
