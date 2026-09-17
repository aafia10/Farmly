"use client";

import React from "react";
import Link from "next/link";
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
  const { user, role } = useAuth();
  const { lots, offers, payments, evidence, transactions, acceptOffer, rejectOffer } = useMockData();
  const { t } = useTranslation();

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/30 via-farmly-dark-green/40 to-farmly-surface border border-farmly-border p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Farmer Verified Account • FM-10294
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {t("common.welcome", "Welcome back")}, {user?.fullName || "Ramesh Patel"}
            </h1>
            <p className="text-farmly-muted text-sm max-w-xl">
              Manage your harvest lots, evaluate incoming buyer bids, track verifiable evidence, and monitor transparent payments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/assets">
              <Button variant="outline" className="text-xs h-10 border-farmly-border bg-farmly-surface hover:bg-farmly-surface-elevated">
                <Boxes className="w-4 h-4 mr-2 text-farmly-accent" />
                My Assets
              </Button>
            </Link>
            <Link href="/agrosathi">
              <Button className="text-xs h-10 bg-farmly-primary hover:bg-farmly-primary-hover text-white shadow-sm">
                <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                AgroSathi Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-accent/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">Active Harvest Lots</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{activeLots.length}</h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Ready for trade
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-farmly-primary/20 border border-farmly-primary/30 flex items-center justify-center text-farmly-accent">
              <Wheat className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-accent/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">Open Buyer Offers</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{openOffers.length}</h3>
              <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" /> Needs your review
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-accent/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">Total Realized Revenue</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{formatINR(totalFarmerEarnings)}</h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> Through digital escrow
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border hover:border-farmly-accent/40 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-farmly-muted font-medium">Pending Evidence</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{pendingEv.length}</h3>
              <p className="text-[11px] text-sky-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3" /> Weighment & Moisture
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
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
              <h2 className="text-lg font-bold text-white">Your Listed Lots</h2>
              <p className="text-xs text-farmly-muted">Active and recent produce registered on Farmly</p>
            </div>
            <Link href="/lots" className="text-xs text-farmly-accent hover:underline flex items-center gap-1">
              View all ({lots.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card className="bg-farmly-surface border-farmly-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-farmly-surface-elevated text-xs font-semibold text-farmly-muted uppercase border-b border-farmly-border">
                  <tr>
                    <th className="px-5 py-3.5">Lot ID</th>
                    <th className="px-5 py-3.5">Crop & Variety</th>
                    <th className="px-5 py-3.5">Quantity</th>
                    <th className="px-5 py-3.5">Grade</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-border/60">
                  {lots.slice(0, 4).map((lot) => (
                    <tr key={lot.id} className="hover:bg-farmly-surface-elevated/50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-white">{lot.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{lot.crop}</div>
                        <div className="text-xs text-farmly-muted">{lot.variety}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-white">
                        {lot.quantity} {lot.unit}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-medium">
                          {lot.qualityGrade}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={lot.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/lots/${lot.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8">
                            Details
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
              <h2 className="text-lg font-bold text-white">Incoming Offers</h2>
              <p className="text-xs text-farmly-muted">Direct buyer bids requiring action</p>
            </div>
            <Link href="/offers" className="text-xs text-farmly-accent hover:underline flex items-center gap-1">
              All ({offers.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {offers.slice(0, 3).map((offer) => (
              <Card key={offer.id} className="bg-farmly-surface border-farmly-border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-xs text-farmly-muted">{offer.id} • {offer.lotId}</div>
                    <div className="font-bold text-white text-base mt-0.5">{offer.crop}</div>
                    <div className="text-xs text-farmly-muted">Buyer: {offer.buyerName}</div>
                  </div>
                  <StatusBadge status={offer.status} size="sm" />
                </div>

                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 flex justify-between items-center text-xs">
                  <div>
                    <div className="text-farmly-muted">Offered Rate</div>
                    <div className="font-bold text-emerald-400 text-sm">₹{offer.pricePerKg}/kg</div>
                  </div>
                  <div className="text-right">
                    <div className="text-farmly-muted">Expected Net</div>
                    <div className="font-bold text-white text-sm">{formatINR(offer.expectedNet)}</div>
                  </div>
                </div>

                {offer.status === "Pending" ? (
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => acceptOffer(offer.id)}
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => rejectOffer(offer.id)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-950/20 text-xs h-8"
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  <Link href={`/offers/${offer.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 border-farmly-border hover:bg-farmly-surface-elevated">
                      View Offer Breakdown
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
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-accent/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">Fair Price Benchmarks</div>
              <div className="text-xs text-farmly-muted">APMC & MSP daily rates</div>
            </div>
          </Card>
        </Link>

        <Link href="/traceability" className="group">
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-accent/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">Traceability Ledger</div>
              <div className="text-xs text-farmly-muted">Verify batch lineage & tests</div>
            </div>
          </Card>
        </Link>

        <Link href="/payments" className="group">
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-accent/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">Settlement Timelines</div>
              <div className="text-xs text-farmly-muted">Track 7-stage escrows</div>
            </div>
          </Card>
        </Link>

        <Link href="/disputes" className="group">
          <Card className="bg-farmly-surface border-farmly-border group-hover:border-farmly-accent/50 transition-all p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">Dispute Resolution</div>
              <div className="text-xs text-farmly-muted">Mediation & claim status</div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );

  const renderDistributorDashboard = () => (
    <div className="space-y-8">
      {/* Distributor Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/30 via-farmly-dark-green/40 to-farmly-surface border border-farmly-border p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
              <Truck className="w-3.5 h-3.5" />
              Wholesale & Logistics Network
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {user?.fullName || "Kisan Logistics"}
            </h1>
            <p className="text-farmly-muted text-sm max-w-xl">
              Procure verified farm produce, submit bids, track batch weighments, and coordinate secondary distribution.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/marketplace">
              <Button className="text-xs h-10 bg-farmly-primary hover:bg-farmly-primary-hover text-white">
                <Store className="w-4 h-4 mr-2" />
                Browse Marketplace
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
              <p className="text-xs text-farmly-muted font-medium">Marketplace Produce</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{mktLots.length} Lots</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Verified by field helpers</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-farmly-primary/20 border border-farmly-primary/30 flex items-center justify-center text-farmly-accent">
              <Store className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">Active Bids Placed</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{myOffersPlaced.length}</h3>
              <p className="text-[11px] text-amber-400 font-medium">Across multiple lots</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">Total Procurement</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {formatINR(transactions.filter(t => t.type === "Purchase").reduce((a, b) => a + b.amount, 0) || 540000)}
              </h3>
              <p className="text-[11px] text-emerald-400 font-medium">In completed settlements</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">Pending Payments</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{pendingPayments.length}</h3>
              <p className="text-[11px] text-sky-400 font-medium">Escrow milestones</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distributor Action Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Top Available Lots in Market</h3>
            <Link href="/marketplace" className="text-xs text-farmly-accent hover:underline flex items-center gap-1">
              Explore all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {lots.slice(0, 3).map((l) => (
              <div key={l.id} className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-farmly-muted">{l.id}</div>
                  <div className="font-bold text-white">{l.crop} ({l.variety})</div>
                  <div className="text-xs text-farmly-muted">{l.quantity} {l.unit} • {l.location}</div>
                </div>
                <div className="text-right space-y-1">
                  <StatusBadge status={l.qualityGrade} size="sm" />
                  <div>
                    <Link href={`/marketplace/${l.id}`}>
                      <Button size="sm" className="h-7 text-xs bg-farmly-primary hover:bg-farmly-primary-hover text-white">
                        Make Offer
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
            <h3 className="font-bold text-white text-base">Procurement Escrows</h3>
            <Link href="/payments" className="text-xs text-farmly-accent hover:underline flex items-center gap-1">
              View payments <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-farmly-muted">{p.id} • Lot {p.lotId}</div>
                  <div className="font-bold text-white">{formatINR(p.amount)}</div>
                  <div className="text-xs text-farmly-muted">Payee: {p.payeeName}</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    {p.currentStage}
                  </span>
                  <div>
                    <Link href={`/payments/${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-farmly-accent">
                        Timeline
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/30 via-farmly-dark-green/40 to-farmly-surface border border-farmly-border p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
              <QrCode className="w-3.5 h-3.5" />
              Retail Outlet & Consumer Trust Gateway
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {user?.fullName || "Gramin Superstore"}
            </h1>
            <p className="text-farmly-muted text-sm max-w-xl">
              Verify incoming inventory QR labels, present complete seed-to-shelf provenance to retail customers, and confirm receipt.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/verify/LT-20391">
              <Button className="text-xs h-10 bg-farmly-primary hover:bg-farmly-primary-hover text-white">
                <QrCode className="w-4 h-4 mr-2" />
                Inspect Sample QR
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
              <p className="text-xs text-farmly-muted font-medium">Received Lots</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{receivedLots.length}</h3>
              <p className="text-[11px] text-emerald-400 font-medium">In retail inventory</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-farmly-primary/20 border border-farmly-primary/30 flex items-center justify-center text-farmly-accent">
              <Boxes className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">Quality Verified</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{verifiedLots.length}</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Grade A certified</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">Consumer Scans</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">142</h3>
              <p className="text-[11px] text-sky-400 font-medium">Public trust validations</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <QrCode className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-farmly-surface border-farmly-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-farmly-muted font-medium">Disputes / Returns</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">0</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Clean audit record</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retailer Inventory Grid */}
      <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Store Produce Batches</h3>
            <p className="text-xs text-farmly-muted">Batches with customer-facing QR labels ready</p>
          </div>
          <Link href="/traceability" className="text-xs text-farmly-accent hover:underline">
            View full chain
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lots.map((lot) => (
            <div key={lot.id} className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-xs text-farmly-muted">{lot.id}</div>
                  <div className="font-bold text-white text-base">{lot.crop}</div>
                  <div className="text-xs text-farmly-muted">{lot.variety} • {lot.location}</div>
                </div>
                <StatusBadge status={lot.qualityGrade} size="sm" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-farmly-border/50">
                <span className="text-xs font-semibold text-white">{lot.quantity} {lot.unit}</span>
                <Link href={`/verify/${lot.id}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-farmly-border hover:bg-farmly-primary hover:text-white">
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
