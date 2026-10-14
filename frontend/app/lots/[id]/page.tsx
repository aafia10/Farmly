"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Boxes,
  ArrowLeft,
  ShieldCheck,
  FileCheck2,
  FileText,
  Award,
  QrCode,
  Download,
  Wheat,
  MapPin,
  Calendar,
  CheckCircle2,
  User,
  Scale,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { LineageTree } from "@/components/common/lineage-tree";
import { LotCertificatesSection } from "@/components/certificates/lot-certificates-section";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";

export default function LotDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { lots, evidence, offers, acceptOffer, rejectOffer } = useMockData();
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "evidence" | "quality" | "offers" | "certificate">("overview");

  const lotId = params?.id || "LT-20391";
  const lot = lots.find((l) => l.id === lotId);
  const lotEvidence = evidence.filter((e) => e.lotId === lot?.id);
  const lotOffers = offers.filter((o) => o.lotId === lot?.id);

  if (!lot) {
    return (
      <AppLayout title="Lot Not Found">
        <Card className="bg-farmly-surface border-farmly-border p-12 text-center space-y-4 max-w-md mx-auto my-12">
          <Boxes className="w-12 h-12 text-farmly-muted mx-auto opacity-40" />
          <h2 className="text-xl font-bold text-farmly-foreground">Harvest Lot Not Found</h2>
          <p className="text-xs text-farmly-muted">This lot is not in your list. It may belong to another participant.</p>
          <Link href={`/marketplace/${encodeURIComponent(lotId)}`} className="block text-xs underline text-farmly-primary dark:text-farmly-accent-light">
            Inspect it in the marketplace
          </Link>
          <Button onClick={() => router.push("/lots")} className="bg-farmly-primary text-white text-xs">
            Back to Lots
          </Button>
        </Card>
      </AppLayout>
    );
  }

  const farmerDeclaredEv = lotEvidence.filter((e) => e.category === "Farmer Declared");
  const evidenceBackedEv = lotEvidence.filter((e) => e.category === "Evidence Backed");
  const externallyVerifiedEv = lotEvidence.filter((e) => e.category === "Externally Verified");

  return (
    <AppLayout title={`Lot ${lot.id}`}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Back navigation & Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/lots">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-farmly-border text-farmly-foreground hover:bg-farmly-surface-elevated">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-farmly-accent">{lot.id}</span>
                <StatusBadge status={lot.status} size="sm" />
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  {lot.qualityGrade}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
                {lot.crop} <span className="text-farmly-muted text-lg font-normal">({lot.variety})</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/verify/${lot.id}`}>
              <Button variant="outline" size="sm" className="border-farmly-border text-xs text-farmly-foreground hover:bg-farmly-surface-elevated">
                <QrCode className="w-4 h-4 mr-1.5 text-farmly-accent" />
                Public QR Page
              </Button>
            </Link>
            <Link href={`/lots/${lot.id}/evidence`}>
              <Button size="sm" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs">
                <FileCheck2 className="w-4 h-4 mr-1.5" />
                3-Tier Evidence
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-farmly-border pb-1 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Lot Overview", icon: Boxes },
            { id: "evidence", label: `Evidence (${lotEvidence.length})`, icon: FileCheck2 },
            { id: "quality", label: "Quality & Specs", icon: Award },
            { id: "offers", label: `Offers (${lotOffers.length})`, icon: FileText },
            { id: "certificate", label: "Certificates", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-farmly-surface-elevated text-emerald-700 dark:text-emerald-300 border border-farmly-border"
                    : "text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Spec Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-farmly-surface border-farmly-border p-4">
                <div className="text-xs text-farmly-muted">Total Batch Quantity</div>
                <div className="text-xl font-bold text-farmly-foreground mt-1">
                  {lot.quantity} <span className="text-sm font-normal text-farmly-muted">{lot.unit}</span>
                </div>
              </Card>

              <Card className="bg-farmly-surface border-farmly-border p-4">
                <div className="text-xs text-farmly-muted">Registered Grower</div>
                <div className="text-base font-bold text-farmly-foreground mt-1">{lot.farmerName}</div>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{lot.farmerId}</div>
              </Card>

              <Card className="bg-farmly-surface border-farmly-border p-4">
                <div className="text-xs text-farmly-muted">Current Custody</div>
                <div className="text-base font-bold text-farmly-foreground mt-1">{lot.currentOwner}</div>
                <div className="text-[11px] text-farmly-muted">Primary Custodian</div>
              </Card>

              <Card className="bg-farmly-surface border-farmly-border p-4">
                <div className="text-xs text-farmly-muted">Weighment Sensor</div>
                <div className="text-base font-bold text-farmly-foreground mt-1 font-mono text-xs">
                  {lot.weighmentScaleId || "Calibrated Scale #04"}
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Zero-tare calibrated</div>
              </Card>
            </div>

            {/* Detailed metadata */}
            <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
              <h3 className="font-bold text-farmly-foreground text-base">Provenance Metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-farmly-muted block">Storage / Yard Location:</span>
                  <span className="text-farmly-foreground font-medium">{lot.location}</span>
                </div>
                <div>
                  <span className="text-farmly-muted block">Registration Date:</span>
                  <span className="text-farmly-foreground font-medium">{lot.createdDate}</span>
                </div>
                <div>
                  <span className="text-farmly-muted block">Field Verification Assistant:</span>
                  <span className="text-farmly-foreground font-medium">{lot.assistedBy || "Priya Sharma"}</span>
                </div>
                <div>
                  <span className="text-farmly-muted block">Certificates:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("certificate")}
                    className="font-medium underline text-farmly-primary dark:text-farmly-accent-light"
                  >
                    View certificate history
                  </button>
                </div>
              </div>
            </Card>

            {/* Visual Lineage Tree */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-farmly-foreground text-base">Batch Lineage & Custody Tree</h3>
                <span className="text-xs text-farmly-muted">Tracking splits, warehouse hops & retail distribution</span>
              </div>
              <LineageTree />
            </div>
          </div>
        )}

        {/* Tab 2: Evidence */}
        {activeTab === "evidence" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-farmly-foreground text-base">Verified Evidence Artifacts</h3>
                <p className="text-xs text-farmly-muted">Every claim is backed by physical IoT or third-party documentation.</p>
              </div>
              <Link href={`/lots/${lot.id}/evidence`}>
                <Button variant="outline" size="sm" className="border-farmly-border text-xs text-farmly-foreground">
                  3-Tier Breakdown <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {lotEvidence.length === 0 ? (
                <Card className="bg-farmly-surface border-farmly-border p-8 text-center text-farmly-muted text-xs">
                  No evidence files attached to this specific lot yet.
                </Card>
              ) : (
                lotEvidence.map((ev) => (
                  <Card key={ev.id} className="bg-farmly-surface border-farmly-border p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-farmly-accent">{ev.id}</span>
                        <StatusBadge status={ev.status} size="sm" />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-farmly-surface-elevated border border-farmly-border font-mono text-farmly-muted">
                          {ev.category}
                        </span>
                      </div>
                      <div className="font-bold text-farmly-foreground text-sm">{ev.title}</div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 font-mono p-2 rounded bg-farmly-surface-elevated">
                        {ev.value}
                      </div>
                      <div className="text-[11px] text-farmly-muted">
                        Source: {ev.source} • {ev.timestamp}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Quality */}
        {activeTab === "quality" && (
          <Card className="bg-farmly-surface border-farmly-border p-6 space-y-6">
            <div>
              <h3 className="font-bold text-farmly-foreground text-base">Quality Benchmark Assessment</h3>
              <p className="text-xs text-farmly-muted">Physical lab inspection thresholds and grain physical properties</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-1">
                <span className="text-xs text-farmly-muted">Assigned Quality Grade</span>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{lot.qualityGrade}</div>
                <p className="text-[11px] text-farmly-muted">Top 5% crop density percentile</p>
              </div>
              <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-1">
                <span className="text-xs text-farmly-muted">Moisture Content</span>
                <div className="text-xl font-bold text-farmly-foreground">11.8%</div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Within permissible 12.0% safe limit</p>
              </div>
              <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-1">
                <span className="text-xs text-farmly-muted">Foreign Matter</span>
                <div className="text-xl font-bold text-farmly-foreground">0.4%</div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Below 1.0% maximum tolerance</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-farmly-muted">Inspection Checklist</h4>
              <div className="space-y-2">
                {[
                  { test: "Moisture Content Analysis", standard: "Max 12.0%", result: "11.8%", pass: true },
                  { test: "Damaged / Discolored Grains", standard: "Max 2.0%", result: "0.8%", pass: true },
                  { test: "Foreign Matter (Inorganic)", standard: "Max 0.5%", result: "0.1%", pass: true },
                  { test: "Pesticide Residue Screen", standard: "Codex Compliant", result: "Negative", pass: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-farmly-surface-elevated border border-farmly-border/70 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span className="font-semibold text-farmly-foreground">{item.test}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-farmly-muted">Threshold: {item.standard}</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{item.result}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Tab 4: Offers */}
        {activeTab === "offers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-farmly-foreground text-base">Trade Offers on this Lot</h3>
                <p className="text-xs text-farmly-muted">Bids submitted by registered commercial distributors and retailers.</p>
              </div>
            </div>

            <div className="space-y-3">
              {lotOffers.length === 0 ? (
                <Card className="bg-farmly-surface border-farmly-border p-8 text-center text-farmly-muted text-xs">
                  No active trade offers for this lot at present.
                </Card>
              ) : (
                lotOffers.map((offer) => (
                  <Card key={offer.id} className="bg-farmly-surface border-farmly-border p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-xs text-farmly-muted">{offer.id}</div>
                        <h4 className="font-bold text-farmly-foreground text-base">{offer.buyerName}</h4>
                        <div className="text-xs text-farmly-muted">{offer.buyerType}</div>
                      </div>
                      <StatusBadge status={offer.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 text-xs">
                      <div>
                        <span className="text-farmly-muted block">Quantity Bid</span>
                        <span className="font-bold text-farmly-foreground">{offer.offeredQuantity} {offer.unit}</span>
                      </div>
                      <div>
                        <span className="text-farmly-muted block">Offer Rate</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{offer.pricePerKg}/kg</span>
                      </div>
                      <div>
                        <span className="text-farmly-muted block">Total Deductions</span>
                        <span className="font-medium text-amber-700 dark:text-amber-400">₹{offer.totalDeductions}</span>
                      </div>
                      <div>
                        <span className="text-farmly-muted block">Net Payout to Grower</span>
                        <span className="font-bold text-farmly-foreground">₹{offer.expectedNet.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {offer.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptOffer(offer.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                        >
                          Accept Offer & Initiate Escrow
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => rejectOffer(offer.id)}
                          className="border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-950/20 text-xs h-8"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Certificates */}
        {activeTab === "certificate" && <LotCertificatesSection lotId={lot.id} />}
      </div>
    </AppLayout>
  );
}
