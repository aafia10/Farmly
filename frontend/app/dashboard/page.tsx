"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wheat,
  Boxes,
  FileText,
  CreditCard,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Store,
  Scale,
  CheckCircle2,
  Clock,
  QrCode,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const { lots, offers, payments, evidence, transactions, acceptOffer, rejectOffer } = useMockData();
  const { t } = useTranslation();

  // Automatic routing for specialized workspace roles
  useEffect(() => {
    if (role === "fpo") router.push("/fpo/dashboard");
    else if (role === "collection_center") router.push("/collection/dashboard");
    else if (role === "quality_assessor") router.push("/quality/dashboard");
    else if (role === "admin") router.push("/admin/dashboard");
    else if (role === "helper") router.push("/helper/dashboard");
  }, [role, router]);

  const formatINR = (amt: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);

  // Farmer metrics
  const activeLots = lots.filter((l) => l.status === "Active" || l.status === "Under Offer");
  const openOffers = offers.filter((o) => o.status === "Pending");
  const completedTx = transactions.filter((tx) => tx.status === "Completed");
  const totalFarmerEarnings = completedTx
    .filter((tx) => tx.type === "Sale" || tx.type === "Settlement")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const pendingEv = evidence.filter((e) => e.status === "Pending");

  // Distributor metrics
  const mktLots = lots.filter((l) => l.status === "Active");
  const myOffersPlaced = offers;
  const pendingPayments = payments.filter((p) => p.status === "Due" || p.status === "Pending");

  // Retailer metrics
  const receivedLots = lots.filter((l) => l.status === "Delivered" || l.status === "Sold");
  const verifiedLots = lots.filter((l) => l.qualityGrade === "Grade A");

  const renderFarmerDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/15 via-farmly-primary/5 to-farmly-surface border border-farmly-border p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t("dashboard.farmerBadge", "Farmer Verified Account")} &bull; FMR-MH-000421
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-farmly-foreground tracking-tight">
              {t("dashboard.welcome", "Welcome back")}, {user?.fullName || "Ramesh Patil"}
            </h1>
            <p className="text-farmly-muted text-sm max-w-xl">
              {t("dashboard.farmerSubtitle", "Manage your harvest lots, evaluate incoming buyer bids, track verifiable evidence, and monitor transparent payments.")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/assets">
              <Button variant="outline" className="text-xs h-10 border-farmly-border bg-farmly-surface hover:bg-farmly-surface-elevated text-farmly-foreground">
                <Boxes className="w-4 h-4 mr-2 text-farmly-primary" />
                {t("dashboard.myAssets", "My Assets")}
              </Button>
            </Link>
            <Link href="/agrosathi">
              <Button className="text-xs h-10 bg-farmly-primary hover:bg-farmly-primary/90 text-white shadow-sm">
                <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                {t("dashboard.agrosathi", "AgroSathi Assistant")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.activeLots", "Active Harvest Lots")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{activeLots.length}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> {t("dashboard.readyForTrade", "Ready for trade")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-farmly-primary/10 border border-farmly-primary/20 flex items-center justify-center text-farmly-primary">
              <Wheat className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.openOffers", "Open Buyer Offers")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{openOffers.length}</h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" /> {t("dashboard.needsReview", "Needs your review")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.totalRevenue", "Total Realized Revenue")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{formatINR(totalFarmerEarnings)}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> {t("dashboard.throughEscrow", "Through digital escrow")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-primary/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.pendingEvidence", "Pending Evidence")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{pendingEv.length}</h3>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3" /> {t("dashboard.weighmentMoisture", "Weighment & Moisture")}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split: Recent Lots & Incoming Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Lots (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-farmly-foreground">{t("dashboard.recentLots", "Your Listed Lots")}</h2>
              <p className="text-xs text-farmly-muted">{t("dashboard.recentLotsSub", "Active and recent produce registered on Farmly")}</p>
            </div>
            <Link href="/lots" className="text-xs text-farmly-primary hover:underline flex items-center gap-1">
              {t("common.viewAll", "View all")} ({lots.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="bg-farmly-surface border-farmly-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-farmly-table-header text-xs font-semibold text-farmly-muted uppercase border-b border-farmly-border">
                  <tr>
                    <th className="px-5 py-3.5">Lot ID</th>
                    <th className="px-5 py-3.5">{t("common.crop", "Crop")}</th>
                    <th className="px-5 py-3.5">{t("common.quantity", "Quantity")}</th>
                    <th className="px-5 py-3.5">Grade</th>
                    <th className="px-5 py-3.5">{t("common.status", "Status")}</th>
                    <th className="px-5 py-3.5 text-right">{t("common.actions", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-border">
                  {lots.slice(0, 4).map((lot) => (
                    <tr key={lot.id} className="hover:bg-farmly-table-hover transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-farmly-foreground">{lot.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-farmly-foreground">{lot.crop}</div>
                        <div className="text-xs text-farmly-muted">{lot.variety}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-farmly-foreground">
                        {lot.quantity} {lot.unit}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium">
                          {lot.qualityGrade}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={lot.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/lots/${lot.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-farmly-primary hover:bg-farmly-primary/10 h-8">
                            {t("common.details", "Details")}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Incoming Offers (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-farmly-foreground">{t("dashboard.incomingOffers", "Incoming Offers")}</h2>
              <p className="text-xs text-farmly-muted">{t("dashboard.incomingOffersSub", "Direct buyer bids requiring action")}</p>
            </div>
            <Link href="/offers" className="text-xs text-farmly-primary hover:underline flex items-center gap-1">
              {t("common.all", "All")} ({offers.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {offers.slice(0, 3).map((offer) => (
              <Card key={offer.id} className="bg-farmly-surface border-farmly-border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-xs text-farmly-muted">{offer.id} &bull; {offer.lotId}</div>
                    <div className="font-bold text-farmly-foreground text-base mt-0.5">{offer.crop}</div>
                    <div className="text-xs text-farmly-muted">{t("role.distributor", "Buyer")}: {offer.buyerName}</div>
                  </div>
                  <StatusBadge status={offer.status} size="sm" />
                </div>

                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex justify-between items-center text-xs">
                  <div>
                    <div className="text-farmly-muted">{t("dashboard.offeredRate", "Offered Rate")}</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{offer.pricePerKg}/kg</div>
                  </div>
                  <div className="text-right">
                    <div className="text-farmly-muted">{t("dashboard.expectedNet", "Expected Net")}</div>
                    <div className="font-bold text-farmly-foreground text-sm">{formatINR(offer.expectedNet)}</div>
                  </div>
                </div>

                {offer.status === "Pending" ? (
                  <div className="flex gap-2 pt-1">
                    <Link href={`/offers/${offer.id}`} className="flex-1">
                      <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold">
                        {t("common.accept", "Accept")}
                      </Button>
                    </Link>
                    <Button
                      onClick={() => rejectOffer(offer.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-8"
                    >
                      {t("common.decline", "Decline")}
                    </Button>
                  </div>
                ) : (
                  <Link href={`/offers/${offer.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 border-farmly-border hover:bg-farmly-surface-elevated text-farmly-foreground">
                      {t("dashboard.offerBreakdown", "View Offer Breakdown")}
                    </Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/fair-price" className="group">
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-primary/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-farmly-foreground text-sm group-hover:text-farmly-primary transition-colors">{t("dashboard.fairPrice", "Fair Price Benchmarks")}</div>
              <div className="text-xs text-farmly-muted">{t("dashboard.fairPriceSub", "APMC & MSP daily rates")}</div>
            </div>
          </Card>
        </Link>

        <Link href="/traceability" className="group">
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-primary/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-farmly-foreground text-sm group-hover:text-farmly-primary transition-colors">{t("dashboard.traceabilityLedger", "Traceability Ledger")}</div>
              <div className="text-xs text-farmly-muted">{t("dashboard.traceabilitySub", "Verify batch lineage & tests")}</div>
            </div>
          </Card>
        </Link>

        <Link href="/payments" className="group">
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-primary/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-farmly-foreground text-sm group-hover:text-farmly-primary transition-colors">{t("dashboard.settlementTimelines", "Settlement Timelines")}</div>
              <div className="text-xs text-farmly-muted">{t("dashboard.settlementSub", "Track 7-stage escrows")}</div>
            </div>
          </Card>
        </Link>

        <Link href="/disputes" className="group">
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-primary/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-farmly-foreground text-sm group-hover:text-farmly-primary transition-colors">{t("dashboard.disputeResolution", "Dispute Resolution")}</div>
              <div className="text-xs text-farmly-muted">{t("dashboard.disputeSub", "Mediation & claim status")}</div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );

  const renderDistributorDashboard = () => (
    <div className="space-y-8">
      {/* Distributor Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/15 via-farmly-primary/5 to-farmly-surface border border-farmly-border p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
              <Truck className="w-3.5 h-3.5" />
              Wholesale &amp; Logistics Network
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-farmly-foreground tracking-tight">
              {user?.fullName || "GreenHarvest Distributors"}
            </h1>
            <p className="text-farmly-muted text-sm max-w-xl">
              Procure verified farm produce, submit bids, track batch weighments, and coordinate secondary distribution.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/marketplace">
              <Button className="text-xs h-10 bg-farmly-primary hover:bg-farmly-primary/90 text-white">
                <Store className="w-4 h-4 mr-2" />
                {t("dashboard.browseMarketplace", "Browse Marketplace")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.marketplaceProduce", "Marketplace Produce")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{mktLots.length} {t("nav.lots", "Lots")}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{t("dashboard.readyForTrade", "Verified produce")}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-farmly-primary/10 border border-farmly-primary/20 flex items-center justify-center text-farmly-primary">
              <Store className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.activeBidsPlaced", "Active Bids Placed")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{myOffersPlaced.length}</h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{t("dashboard.incomingOffersSub", "Direct bids")}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.totalProcurement", "Total Procurement")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">
                {formatINR(transactions.filter(t => t.type === "Purchase").reduce((a, b) => a + b.amount, 0) || 540000)}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{t("dashboard.throughEscrow", "In completed settlements")}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.pendingPayments", "Pending Payments")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{pendingPayments.length}</h3>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">{t("dashboard.settlementSub", "Escrow milestones")}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distributor Action Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-farmly-foreground text-base">{t("dashboard.marketplaceProduce", "Top Available Lots in Market")}</h3>
            <Link href="/marketplace" className="text-xs text-farmly-primary hover:underline flex items-center gap-1">
              {t("common.viewAll", "Explore all")} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {lots.slice(0, 3).map((l) => (
              <div key={l.id} className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-farmly-muted">{l.id}</div>
                  <div className="font-bold text-farmly-foreground">{l.crop} ({l.variety})</div>
                  <div className="text-xs text-farmly-muted">{l.quantity} {l.unit} &bull; {l.location}</div>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={l.qualityGrade} size="sm" />
                  <div>
                    <Link href={`/marketplace/${l.id}`}>
                      <Button size="sm" className="h-7 text-xs bg-farmly-primary hover:bg-farmly-primary/90 text-white">
                        {t("marketplace.makeOffer", "Make Offer")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-farmly-foreground text-base">{t("dashboard.settlementTimelines", "Procurement Escrows")}</h3>
            <Link href="/payments" className="text-xs text-farmly-primary hover:underline flex items-center gap-1">
              {t("common.viewAll", "View payments")} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-farmly-muted">{p.id} &bull; Lot {p.lotId}</div>
                  <div className="font-bold text-farmly-foreground">{formatINR(p.amount)}</div>
                  <div className="text-xs text-farmly-muted">{t("common.payee", "Payee")}: {p.payeeName}</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                    {p.currentStage}
                  </span>
                  <div>
                    <Link href={`/payments/${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-farmly-primary">
                        {t("common.details", "Details")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderRetailerDashboard = () => (
    <div className="space-y-8">
      {/* Retailer Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/15 via-farmly-primary/5 to-farmly-surface border border-farmly-border p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
              <QrCode className="w-3.5 h-3.5" />
              {t("role.retailer", "Retailer")} &bull; {t("dashboard.activeQrCodes", "Consumer Trust Gateway")}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-farmly-foreground tracking-tight">
              {user?.fullName || "FreshBasket Retail"}
            </h1>
            <p className="text-farmly-muted text-sm max-w-xl">
              {t("dashboard.farmerSubtitle", "Verify incoming inventory QR labels, present complete seed-to-shelf provenance to retail customers, and confirm receipt.")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/verify/KS-MH-NSK-WHT-20260910-00125">
              <Button className="text-xs h-10 bg-farmly-primary hover:bg-farmly-primary/90 text-white">
                <QrCode className="w-4 h-4 mr-2" />
                {t("dashboard.scanQrVerify", "Inspect Sample QR")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Retailer Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.receivedLots", "Received Lots")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{receivedLots.length}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{t("dashboard.readyForTrade", "In retail inventory")}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-farmly-primary/10 border border-farmly-primary/20 flex items-center justify-center text-farmly-primary">
              <Boxes className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.verifiedLots", "Quality Verified")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">{verifiedLots.length}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Grade A certified</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.activeQrCodes", "Consumer Scans")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">142</h3>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Public trust validations</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <QrCode className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">{t("dashboard.disputeResolution", "Disputes / Returns")}</p>
              <h3 className="text-2xl font-bold text-farmly-foreground tracking-tight">0</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Clean audit record</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retailer Inventory Grid */}
      <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-farmly-foreground text-base">Store Produce Batches</h3>
            <p className="text-xs text-farmly-muted">Batches with customer-facing QR labels ready</p>
          </div>
          <Link href="/traceability" className="text-xs text-farmly-primary hover:underline">
            View full chain
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <div key={lot.id} className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs text-farmly-muted">{lot.id}</div>
                  <div className="font-bold text-farmly-foreground text-base">{lot.crop}</div>
                  <div className="text-xs text-farmly-muted">{lot.variety} &bull; {lot.location}</div>
                </div>
                <StatusBadge status={lot.qualityGrade} size="sm" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-farmly-border">
                <span className="text-xs font-semibold text-farmly-foreground">{lot.quantity} {lot.unit}</span>
                <Link href={`/verify/${lot.id}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-farmly-border hover:bg-farmly-primary hover:text-white text-farmly-foreground">
                    <QrCode className="w-3.5 h-3.5 mr-1" />
                    Customer QR
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return (
    <AppLayout title={`${role.charAt(0).toUpperCase() + role.slice(1)} Workspace`}>
      {role === "farmer" && renderFarmerDashboard()}
      {role === "distributor" && renderDistributorDashboard()}
      {role === "retailer" && renderRetailerDashboard()}
      {role === "helper" && renderFarmerDashboard()}
    </AppLayout>
  );
}
