"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function PaymentsPage() {
  const { payments } = useMockData();
  const [filter, setFilter] = useState("All");

  const stages = ["All", "Pending", "Due", "Initiated", "Received", "Closed"];

  const filteredPayments = payments.filter((p) => {
    if (filter === "All") return true;
    return p.status === filter;
  });

  const totalDisbursed = payments
    .filter((p) => p.status === "Closed" || p.status === "Received")
    .reduce((a, b) => a + b.amount, 0);

  const pendingEscrow = payments
    .filter((p) => p.status !== "Closed")
    .reduce((a, b) => a + b.amount, 0);

  return (
    <AppLayout title="Escrow Payments">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Agricultural Escrow Payments</h1>
            <p className="text-xs text-farmly-muted">
              Milestone-locked settlements ensuring farmers receive guaranteed pay upon produce handover and quality sign-off.
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Total Disbursed</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              ₹{totalDisbursed.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">Direct RTGS / NEFT</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Active in Escrow</div>
            <div className="text-xl font-bold text-white mt-1">
              ₹{pendingEscrow.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-400 mt-1">Locked till physical handover</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Escrow Transactions</div>
            <div className="text-xl font-bold text-white mt-1">{payments.length}</div>
            <div className="text-[11px] text-farmly-muted mt-1">100% audit compliance</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Disputed Holds</div>
            <div className="text-xl font-bold text-sky-400 mt-1">0</div>
            <div className="text-[11px] text-emerald-400 mt-1">Clean settlement history</div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-farmly-border pb-3">
          {stages.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === st
                  ? "bg-farmly-primary text-white"
                  : "bg-farmly-surface border border-farmly-border text-farmly-muted hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Payments Grid */}
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <Card
              key={payment.id}
              className="bg-farmly-surface border-farmly-border p-5 hover:border-farmly-accent/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-farmly-accent">{payment.id}</span>
                  <span className="text-xs text-farmly-muted">•</span>
                  <Link href={`/lots/${payment.lotId}`} className="font-mono text-xs text-white hover:underline">
                    Lot {payment.lotId}
                  </Link>
                  <StatusBadge status={payment.status} size="sm" />
                </div>

                <div className="text-sm font-semibold text-white">
                  {payment.payerName} <span className="text-farmly-muted font-normal">→</span> {payment.payeeName}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-farmly-muted">
                  <span>Current Stage: <strong className="text-emerald-300">{payment.currentStage}</strong></span>
                  {payment.transactionRef && (
                    <span className="font-mono">UTR: {payment.transactionRef}</span>
                  )}
                  <span>Initiated: {payment.createdAt}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-farmly-border">
                <div className="text-right">
                  <div className="text-xs text-farmly-muted">Settlement Value</div>
                  <div className="text-lg font-bold text-white font-mono">
                    ₹{payment.amount.toLocaleString("en-IN")}
                  </div>
                </div>

                <Link href={`/payments/${payment.id}`}>
                  <Button size="sm" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-8">
                    Timeline <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
