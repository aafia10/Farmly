"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Building,
  Truck,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const { offers, lots, payments, acceptOffer, rejectOffer } = useMockData();

  const offerId = params?.id || "OF-1032";
  const offer = offers.find((o) => o.id === offerId) || offers[0];
  const matchingLot = lots.find((l) => l.id === offer?.lotId);
  const matchingPayment = payments.find((p) => p.offerId === offer?.id);

  if (!offer) {
    return (
      <AppLayout title="Offer Not Found">
        <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-xs text-farmly-muted">
          Offer reference does not exist.
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Offer ${offer.id}`}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/offers">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-farmly-border text-white hover:bg-farmly-surface-elevated">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-farmly-accent">{offer.id}</span>
                <StatusBadge status={offer.status} size="sm" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Offer on {offer.crop}
              </h1>
            </div>
          </div>

          {offer.status === "Pending" && (
            <div className="flex gap-2">
              <Button
                onClick={() => acceptOffer(offer.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept Offer
              </Button>
              <Button
                variant="outline"
                onClick={() => rejectOffer(offer.id)}
                className="border-red-500/30 text-red-400 hover:bg-red-950/20 text-xs h-9"
              >
                Decline
              </Button>
            </div>
          )}
        </div>

        {/* Bidder & Harvest Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-2">
            <div className="text-xs text-farmly-muted">Purchaser Identity</div>
            <div className="text-lg font-bold text-white">{offer.buyerName}</div>
            <div className="text-xs text-emerald-400">{offer.buyerType}</div>
            <div className="text-[11px] text-farmly-muted pt-2 border-t border-farmly-border">
              Submitted on {offer.createdAt} • Valid until {offer.offerDeadline}
            </div>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-2">
            <div className="text-xs text-farmly-muted">Harvest Lot Reference</div>
            <div className="text-lg font-bold text-white flex items-center justify-between">
              <span>{matchingLot?.crop || offer.crop}</span>
              <Link href={`/lots/${offer.lotId}`} className="font-mono text-xs text-farmly-accent hover:underline">
                {offer.lotId}
              </Link>
            </div>
            <div className="text-xs text-farmly-muted">
              Volume: {offer.offeredQuantity} {offer.unit}
            </div>
            <div className="text-[11px] text-farmly-muted pt-2 border-t border-farmly-border">
              Quality Grade: {matchingLot?.qualityGrade || "Grade A"}
            </div>
          </Card>
        </div>

        {/* Detailed Financial Breakdown */}
        <Card className="bg-farmly-surface border-farmly-border overflow-hidden">
          <CardHeader className="border-b border-farmly-border bg-farmly-surface-elevated/40">
            <CardTitle className="text-white text-base">Transparent Financial Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm py-2">
              <span className="text-white font-medium">
                Gross Value ({offer.offeredQuantity} {offer.unit} @ ₹{offer.pricePerKg}/{offer.unit})
              </span>
              <span className="font-mono text-lg font-bold text-white">
                ₹{offer.grossValue.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Deductions Matrix */}
            <div className="space-y-2 pt-2 border-t border-farmly-border">
              <div className="text-xs font-semibold uppercase tracking-wider text-farmly-muted">
                Line-Item Deductions & Mandi Handling
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-farmly-muted">
                  <span>Logistics / Freight Pickup:</span>
                  <span className="font-mono text-red-400">-₹{offer.deductions.transport.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-farmly-muted">
                  <span>Loading & Labour Handling:</span>
                  <span className="font-mono text-red-400">-₹{offer.deductions.loading.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-farmly-muted">
                  <span>APMC / Mandi User Cess:</span>
                  <span className="font-mono text-red-400">-₹{offer.deductions.commission.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-farmly-muted">
                  <span>Farmly Escrow & Provenance Fee:</span>
                  <span className="font-mono text-red-400">-₹{offer.deductions.platformFee.toLocaleString("en-IN")}</span>
                </div>
                {offer.deductions.other > 0 && (
                  <div className="flex justify-between text-farmly-muted">
                    <span>Other Bagging & Weighment:</span>
                    <span className="font-mono text-red-400">-₹{offer.deductions.other.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xs pt-2 border-t border-farmly-border font-semibold">
                <span className="text-farmly-muted">Total Authorized Deductions:</span>
                <span className="font-mono text-amber-400">-₹{offer.totalDeductions.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-farmly-surface-elevated border border-emerald-500/30 flex justify-between items-center">
              <div>
                <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Guaranteed Net Escrow Settlement
                </div>
                <div className="text-xs text-farmly-muted">Disbursed directly to farmer verified bank account</div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                ₹{offer.expectedNet.toLocaleString("en-IN")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* If Accepted: Escrow Progress Link */}
        {offer.status === "Accepted" && matchingPayment && (
          <Card className="bg-farmly-surface border-farmly-border p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-farmly-muted">Connected Escrow Payment</span>
              <div className="font-mono font-bold text-white">{matchingPayment.id}</div>
              <div className="text-xs text-emerald-400">Current Phase: {matchingPayment.currentStage}</div>
            </div>
            <Link href={`/payments/${matchingPayment.id}`}>
              <Button size="sm" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs">
                Inspect 7-Stage Timeline
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
