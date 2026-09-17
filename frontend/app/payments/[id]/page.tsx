"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  ArrowRightLeft,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { PaymentStage } from "@/types";

const ALL_STAGES: PaymentStage[] = [
  "Offer Accepted",
  "Goods Handed Over",
  "Payment Due",
  "Payment Initiated",
  "Reference Submitted",
  "Farmer Confirmation",
  "Closed",
];

export default function PaymentDetailPage() {
  const params = useParams<{ id: string }>();
  const { payments, updatePaymentStage } = useMockData();

  const paymentId = params?.id || "PY-8831";
  const payment = payments.find((p) => p.id === paymentId) || payments[0];

  if (!payment) {
    return (
      <AppLayout title="Payment Not Found">
        <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-xs text-farmly-muted">
          Escrow payment record not found.
        </Card>
      </AppLayout>
    );
  }

  const currentIdx = ALL_STAGES.indexOf(payment.currentStage);
  const nextStage = currentIdx < ALL_STAGES.length - 1 ? ALL_STAGES[currentIdx + 1] : null;

  return (
    <AppLayout title={`Escrow Settlement ${payment.id}`}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/payments">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-farmly-border text-farmly-foreground hover:bg-farmly-surface-elevated">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-farmly-accent">{payment.id}</span>
                <StatusBadge status={payment.status} size="sm" />
              </div>
              <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
                7-Stage Escrow Timeline
              </h1>
            </div>
          </div>

          {nextStage && (
            <Button
              onClick={() => updatePaymentStage(payment.id, nextStage)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 font-semibold"
            >
              Advance: {nextStage} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>

        {/* Amount & Parties Card */}
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-farmly-border">
            <div>
              <div className="text-xs text-farmly-muted">Escrow Settlement Amount</div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                ₹{payment.amount.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-farmly-muted mt-1">
                Linked to Harvest Lot <Link href={`/lots/${payment.lotId}`} className="font-mono text-farmly-foreground underline">{payment.lotId}</Link>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-right text-xs">
              <div className="text-farmly-muted">Banking UTR / Reference</div>
              <div className="font-mono font-bold text-farmly-foreground text-sm mt-0.5">
                {payment.transactionRef || "UTR-HDFC-992104-IN"}
              </div>
              <div className="text-[10px] text-emerald-400">Authenticated via NEFT / RTGS</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-1">
              <span className="text-farmly-muted block">Purchaser / Payer</span>
              <div className="text-sm font-bold text-farmly-foreground">{payment.payerName}</div>
              <div className="text-farmly-muted">Wholesale Logistics Escrow Account</div>
            </div>

            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-1">
              <span className="text-farmly-muted block">Payee / Beneficiary Grower</span>
              <div className="text-sm font-bold text-farmly-foreground">{payment.payeeName}</div>
              <div className="text-farmly-muted">Verified Farmer Bank Account</div>
            </div>
          </div>
        </Card>

        {/* 7-Stage Interactive Stepper */}
        <Card className="bg-farmly-surface border-farmly-border p-6 lg:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-farmly-foreground">Settlement Verification Lifecycle</h2>
            <p className="text-xs text-farmly-muted">
              Every transition is verified with digital receipts, weighment slips, and farmer SMS confirmations.
            </p>
          </div>

          <div className="relative space-y-6 pl-2">
            {ALL_STAGES.map((st, index) => {
              const timelineItem = payment.timeline.find((t) => t.stage === st);
              const isPast = index < currentIdx;
              const isCurrent = index === currentIdx;
              const isFuture = index > currentIdx;

              return (
                <div key={st} className="flex items-start gap-4 relative">
                  {/* Vertical connector line */}
                  {index < ALL_STAGES.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-12 -ml-px transition-colors ${
                        isPast ? "bg-emerald-500" : "bg-farmly-border"
                      }`}
                    />
                  )}

                  {/* Icon Indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all z-10 ${
                      isPast
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-farmly-primary text-emerald-300 ring-4 ring-emerald-500/20"
                        : "bg-farmly-surface-elevated text-farmly-muted border border-farmly-border"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>

                  {/* Stage Details */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-bold ${
                          isPast ? "text-farmly-foreground" : isCurrent ? "text-emerald-400" : "text-farmly-muted"
                        }`}
                      >
                        {st}
                      </h4>
                      <span className="text-xs font-mono text-farmly-muted">
                        {timelineItem?.completed ? timelineItem.timestamp : isCurrent ? "In Progress" : "Pending"}
                      </span>
                    </div>

                    <p className="text-xs text-farmly-muted mt-0.5">
                      {st === "Offer Accepted" && "Buyer bid approved; funds locked into neutral escrow"}
                      {st === "Goods Handed Over" && "Physical produce custody transferred to logistics fleet"}
                      {st === "Payment Due" && "Quality parameters cross-checked against scale certificates"}
                      {st === "Payment Initiated" && "Bank settlement instruction transmitted to clearing house"}
                      {st === "Reference Submitted" && "RTGS/NEFT transaction reference number logged"}
                      {st === "Farmer Confirmation" && "Grower acknowledges receipt of net funds via mobile SMS"}
                      {st === "Closed" && "Transaction completed; lot status marked as delivered"}
                    </p>

                    {timelineItem?.note && (
                      <div className="mt-1 text-[11px] font-mono text-emerald-300 p-2 rounded bg-farmly-surface-elevated">
                        {timelineItem.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
