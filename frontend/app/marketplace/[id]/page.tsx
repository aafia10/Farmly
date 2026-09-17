"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Store,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Boxes,
  FileCheck2,
  Calendar,
  Send,
  Scale,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";

export default function MarketplaceLotDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { lots, evidence } = useMockData();
  const { user } = useAuth();

  const lotId = params?.id || "LT-20391";
  const lot = lots.find((l) => l.id === lotId) || lots[0];
  const lotEvidence = evidence.filter((e) => e.lotId === lot?.id);

  // Bidding form state
  const [offeredQty, setOfferedQty] = useState(lot?.quantity ? String(lot.quantity) : "5000");
  const [pricePerKg, setPricePerKg] = useState("28");
  const [notes, setNotes] = useState("Immediate pickup via refrigerated container truck. Standard APMC quality parameters accepted.");
  const [offerSubmitted, setOfferSubmitted] = useState(false);

  const qtyNum = Number(offeredQty) || 0;
  const priceNum = Number(pricePerKg) || 0;
  const grossValue = qtyNum * priceNum;
  const estimatedDeductions = Math.round(grossValue * 0.04); // 4% platform & handling
  const netEstimated = grossValue - estimatedDeductions;

  const handleMakeOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setOfferSubmitted(true);
  };

  const stateOrigin = lot?.location.split(",").pop()?.trim() || "Gujarat";

  return (
    <AppLayout title={`Procurement Bid: ${lot?.id}`}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Link href="/marketplace">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-farmly-border text-farmly-foreground hover:bg-farmly-surface-elevated">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="text-xs text-farmly-muted flex items-center gap-1.5">
              <Link href="/marketplace" className="hover:underline">Marketplace</Link>
              <span>/</span>
              <span className="font-mono text-farmly-foreground">{lot?.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {lot?.crop} <span className="text-farmly-muted text-lg font-normal">({lot?.variety})</span>
            </h1>
          </div>
        </div>

        {/* Success Banner */}
        {offerSubmitted && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-farmly-foreground text-base">Trade Bid Formally Logged in Escrow Registry</h3>
                <p className="text-xs text-farmly-muted">
                  The verified grower has been notified. Upon acceptance, an automated 7-stage settlement timeline will activate.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Link href="/offers">
                <Button size="sm" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs">
                  View Tracked Offers
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOfferSubmitted(false)}
                className="border-farmly-border text-farmly-foreground text-xs hover:bg-farmly-surface-elevated"
              >
                Modify Bid
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Produce Specs (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-farmly-surface border-farmly-border p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-farmly-accent uppercase">{lot?.id}</span>
                  <h2 className="text-xl font-bold text-farmly-foreground mt-1">{lot?.crop} ({lot?.variety})</h2>
                </div>
                <StatusBadge status={lot?.qualityGrade || "Grade A"} size="sm" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                  <span className="text-farmly-muted block">Available Volume</span>
                  <span className="font-bold text-farmly-foreground text-sm mt-0.5 block">{lot?.quantity} {lot?.unit}</span>
                </div>

                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                  <span className="text-farmly-muted block">Regional Origin</span>
                  <span className="font-bold text-farmly-foreground text-sm mt-0.5 block">{stateOrigin} Region</span>
                </div>

                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                  <span className="text-farmly-muted block">Inspection Standard</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                    {lot?.certificateRef ? "AGMARK Tested" : "Scale Certified"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-farmly-surface-elevated/80 border border-farmly-border flex items-start gap-3 text-xs text-farmly-muted">
                <Lock className="w-4 h-4 text-farmly-accent shrink-0 mt-0.5" />
                <p>
                  <strong>Privacy Safeguard:</strong> Direct contact details of the farmer are shielded. Bids, delivery instructions, and escrow funds are handled securely through the Farmly platform.
                </p>
              </div>
            </Card>

            {/* Evidence Artifacts Preview */}
            <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
              <h3 className="font-bold text-farmly-foreground text-base">Accompanying Verification Proofs</h3>
              <div className="space-y-2">
                {lotEvidence.length === 0 ? (
                  <p className="text-xs text-farmly-muted">Scale weighbridge receipt and moisture test calibrated.</p>
                ) : (
                  lotEvidence.map((ev) => (
                    <div key={ev.id} className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-farmly-foreground">{ev.title}</span>
                        <div className="text-[11px] text-farmly-muted font-mono">{ev.value}</div>
                      </div>
                      <StatusBadge status={ev.status} size="sm" />
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Place Offer Form (Right 1 col) */}
          <div>
            <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4 sticky top-24">
              <h3 className="font-bold text-farmly-foreground text-base flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                Submit Commercial Offer
              </h3>

              <form onSubmit={handleMakeOffer} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <Label>Bid Quantity ({lot?.unit || "kg"})</Label>
                  <Input
                    type="number"
                    value={offeredQty}
                    onChange={(e) => setOfferedQty(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Offered Price (₹ / {lot?.unit || "kg"})</Label>
                  <Input
                    type="number"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Procurement Terms & Logistics Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Financial Summary Calculation */}
                <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/80 space-y-2 text-xs">
                  <div className="flex justify-between text-farmly-muted">
                    <span>Gross Bid Value:</span>
                    <span className="text-farmly-foreground font-mono font-semibold">₹{grossValue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-farmly-muted">
                    <span>Estimated Mandi & Transit:</span>
                    <span className="text-amber-400 font-mono">-₹{estimatedDeductions.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pt-2 border-t border-farmly-border flex justify-between font-bold">
                    <span className="text-farmly-foreground">Net to Grower:</span>
                    <span className="text-emerald-400 font-mono text-sm">₹{netEstimated.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={offerSubmitted}
                  className="w-full bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-10 font-semibold"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Transmit Offer to Grower
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
