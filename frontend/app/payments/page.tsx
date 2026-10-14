"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";

export default function PaymentsPage() {
  const { payments } = useMockData();
  const { t } = useTranslation();
  const [filter, setFilter] = useState("All");

  const stageTabs = [
    { value: "All", label: t("payments.statusAll", "All") },
    { value: "Pending", label: t("payments.statusPending", "Pending") },
    { value: "Due", label: t("payments.statusDue", "Due") },
    { value: "Initiated", label: t("payments.statusInitiated", "Initiated") },
    { value: "Received", label: t("payments.statusReceived", "Received") },
    { value: "Closed", label: t("payments.statusClosed", "Closed") },
  ];

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
    <AppLayout title={t("nav.payments", "Escrow Payments")}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {t("payments.title", "Agricultural Escrow Payments")}
            </h1>
            <p className="text-xs text-farmly-muted">
              {t(
                "payments.subtitle",
                "Milestone-locked settlements ensuring farmers receive guaranteed pay upon produce handover and quality sign-off."
              )}
            </p>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("payments.totalDisbursed", "Total Disbursed")}
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{totalDisbursed.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-farmly-muted mt-1">Direct RTGS / NEFT</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("payments.activeInEscrow", "Active in Escrow")}
            </div>
            <div className="text-xl font-bold text-farmly-foreground mt-1">
              ₹{pendingEscrow.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
              {t("payments.lockedTillHandover", "Locked till physical handover")}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("payments.escrowTransactions", "Escrow Transactions")}
            </div>
            <div className="text-xl font-bold text-farmly-foreground mt-1">{payments.length}</div>
            <div className="text-[11px] text-farmly-muted mt-1">100% audit compliance</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">
              {t("payments.disputedHolds", "Disputed Holds")}
            </div>
            <div className="text-xl font-bold text-sky-700 dark:text-sky-400 mt-1">0</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              {t("payments.cleanHistory", "Clean settlement history")}
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none border-b border-farmly-border">
          {stageTabs.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setFilter(st.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === st.value
                  ? "bg-farmly-primary text-white"
                  : "bg-farmly-surface border border-farmly-border text-farmly-muted hover:text-farmly-foreground"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Payments List */}
        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
            <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-farmly-muted text-xs">
              {t("payments.noPayments", "No payment records found.")}
            </Card>
          ) : (
            filteredPayments.map((payment) => (
              <Card
                key={payment.id}
                className="bg-farmly-surface border-farmly-border p-5 hover:border-farmly-accent/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-farmly-accent">{payment.id}</span>
                    <span className="text-xs text-farmly-muted">•</span>
                    <Link
                      href={`/lots/${payment.lotId}`}
                      className="font-mono text-xs text-farmly-foreground hover:underline"
                    >
                      Lot {payment.lotId}
                    </Link>
                    <StatusBadge status={payment.status} size="sm" />
                  </div>

                  <div className="text-sm font-semibold text-farmly-foreground">
                    {payment.payerName}{" "}
                    <span className="text-farmly-muted font-normal">→</span>{" "}
                    {payment.payeeName}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-farmly-muted">
                    <span>
                      {t("payments.currentStage", "Current Stage")}:{" "}
                      <strong className="text-emerald-600 dark:text-emerald-300">{payment.currentStage}</strong>
                    </span>
                    {payment.transactionRef && (
                      <span className="font-mono">UTR: {payment.transactionRef}</span>
                    )}
                    <span>
                      {t("payments.initiated", "Initiated")}: {payment.createdAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-farmly-border">
                  <div className="text-right">
                    <div className="text-xs text-farmly-muted">
                      {t("payments.settlementValue", "Settlement Value")}
                    </div>
                    <div className="text-lg font-bold text-farmly-foreground font-mono">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <Link href={`/payments/${payment.id}`}>
                    <Button
                      size="sm"
                      className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-8"
                    >
                      {t("payments.timeline", "Timeline")}{" "}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
