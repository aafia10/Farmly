"use client";

import React, { useState } from "react";
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
  KeyRound,
  X,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const { offers, lots, payments, acceptOffer, rejectOffer } = useMockData();

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("123456");
  const [otpError, setOtpError] = useState("");

  const offerId = params?.id || "OF-MH-9021";
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

  const handleVerifyOtpAndAccept = () => {
    if (otpValue.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }
    acceptOffer(offer.id);
    setIsOtpModalOpen(false);
  };

  return (
    <AppLayout title={`Offer ${offer.id}`}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/offers">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 border-farmly-border text-farmly-foreground hover:bg-farmly-surface-elevated"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-farmly-primary">{offer.id}</span>
                <StatusBadge status={offer.status} size="sm" />
              </div>
              <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
                Offer on {offer.crop}
              </h1>
            </div>
          </div>

          {offer.status === "Pending" && (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsOtpModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Accept Offer
              </Button>
              <Button
                variant="outline"
                onClick={() => rejectOffer(offer.id)}
                className="border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-9"
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
            <div className="text-lg font-bold text-farmly-foreground">{offer.buyerName}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{offer.buyerType}</div>
            <div className="text-[11px] text-farmly-muted pt-2 border-t border-farmly-border">
              Submitted on {offer.createdAt} &bull; Valid until {offer.offerDeadline}
            </div>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-2">
            <div className="text-xs text-farmly-muted">Harvest Lot Reference</div>
            <div className="text-lg font-bold text-farmly-foreground flex items-center justify-between">
              <span>{matchingLot?.crop || offer.crop}</span>
              <Link href={`/lots/${offer.lotId}`} className="font-mono text-xs text-farmly-primary hover:underline">
                {offer.lotId}
              </Link>
            </div>
            <div className="text-xs text-farmly-muted">
              Grade: <strong className="text-farmly-foreground">{matchingLot?.qualityGrade || "Grade A"}</strong> &bull; Origin: {matchingLot?.location || "Nashik"}
            </div>
            <div className="text-[11px] text-farmly-muted pt-2 border-t border-farmly-border">
              Calibrated Tare Scale: {matchingLot?.weighmentScaleId || "FPO-SIN-03"}
            </div>
          </Card>
        </div>

        {/* Transparent Deductions Breakdown Card */}
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-farmly-border pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-farmly-primary" />
              <h3 className="text-base font-bold text-farmly-foreground">Itemized Financial Breakdown</h3>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              Zero Hidden Charges
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <span className="text-xs text-farmly-muted block">Agreed Unit Price</span>
              <span className="text-xl font-bold font-mono text-farmly-foreground">₹{offer.pricePerKg} / kg</span>
            </div>
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <span className="text-xs text-farmly-muted block">Contracted Quantity</span>
              <span className="text-xl font-bold font-mono text-farmly-foreground">{offer.offeredQuantity} {offer.unit}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <span className="text-xs text-farmly-muted block">Gross Sale Value</span>
              <span className="text-xl font-bold font-mono text-farmly-foreground">₹{offer.grossValue.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Deductions Table */}
          <div className="rounded-xl border border-farmly-border overflow-hidden">
            <div className="bg-farmly-surface-elevated px-4 py-2.5 text-xs font-semibold text-farmly-foreground border-b border-farmly-border">
              Transparent Logistics &amp; Operational Deductions
            </div>
            <div className="divide-y divide-farmly-border text-xs">
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-farmly-muted">Transport Cost (To Bhiwandi Hub)</span>
                <span className="font-mono text-red-500 font-medium">- ₹{offer.deductions.transport}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-farmly-muted">Loading &amp; Labor Handling</span>
                <span className="font-mono text-red-500 font-medium">- ₹{offer.deductions.loading}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-farmly-muted">Intermediary Commission (Direct Platform Trade)</span>
                <span className="font-mono text-farmly-muted">₹{offer.deductions.commission}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between">
                <span className="text-farmly-muted">Platform Facilitation Fee</span>
                <span className="font-mono text-farmly-muted">₹{offer.deductions.platformFee}</span>
              </div>
              <div className="px-4 py-3 bg-farmly-surface-elevated flex justify-between font-bold text-sm">
                <span className="text-farmly-foreground">Net Guaranteed Farmer Payout</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">
                  ₹{offer.expectedNet.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Linked Escrow Payment Status if accepted */}
        {matchingPayment && (
          <Card className="bg-farmly-surface border border-emerald-500/30 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-farmly-foreground">Escrow Payment Initialized</div>
                <div className="text-xs text-farmly-muted">
                  Stage: <strong>{matchingPayment.currentStage}</strong> &bull; Ref: {matchingPayment.transactionRef || "Pending UTR"}
                </div>
              </div>
            </div>
            <Link href={`/payments/${matchingPayment.id}`}>
              <Button size="sm" variant="outline" className="border-farmly-border text-xs">
                Track 7-Stage Settlement
              </Button>
            </Link>
          </Card>
        )}

        {/* OTP Confirmation Modal */}
        {isOtpModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 border border-farmly-border bg-farmly-surface shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-farmly-border pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-farmly-primary" />
                  <h3 className="font-bold text-base text-farmly-foreground">Confirm Sale with OTP</h3>
                </div>
                <button
                  onClick={() => setIsOtpModalOpen(false)}
                  className="text-farmly-muted hover:text-farmly-foreground p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-farmly-muted">
                <p>
                  You are confirming the binding sale of <strong>{offer.offeredQuantity} {offer.unit}</strong> to{" "}
                  <strong>{offer.buyerName}</strong> for a net payout of{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">₹{offer.expectedNet.toLocaleString("en-IN")}</strong>.
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200">
                  Demo SMS code sent to farmer phone ending in <strong>•••• 3210</strong>. Use demo OTP: <strong className="font-mono">123456</strong>.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => {
                    setOtpValue(e.target.value);
                    setOtpError("");
                  }}
                  className="w-full text-center tracking-widest font-mono text-xl py-3 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground focus:ring-2 focus:ring-farmly-primary"
                  placeholder="123456"
                />
                {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="w-1/2 border-farmly-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerifyOtpAndAccept}
                  className="w-1/2 bg-farmly-primary text-white hover:bg-farmly-primary/90"
                >
                  Confirm &amp; Lock Sale
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
