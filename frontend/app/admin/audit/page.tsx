"use client";

import React from "react";
import { Activity, Lock, CheckCircle2, ShieldCheck, Database, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/contexts/mock-data-context";

export default function AdminAuditPage() {
  const { transactions, payments, helperActivities } = useMockData();

  const AUDIT_EVENTS = [
    {
      txHash: "0x89ab...4412",
      event: "Lot Minted & Tare Calibrated",
      entity: "KS-MH-NSK-WHT-20260910-00125",
      actor: "Supervisor Nilesh Gaikwad (Scale FPO-SIN-03)",
      timestamp: "10 Sep 2026, 10:15:32 IST",
      status: "Anchored",
    },
    {
      txHash: "0x77cd...8910",
      event: "Assay Laboratory Grading (Grade A)",
      entity: "CERT-QC-MH-NSK-2026-0910",
      actor: "Dr. K. V. Mehta (AgriTest Labs)",
      timestamp: "10 Sep 2026, 11:45:10 IST",
      status: "Anchored",
    },
    {
      txHash: "0x44ee...1209",
      event: "Binding Offer Accepted via OTP",
      entity: "OF-MH-9021 (₹25,439.60 Net)",
      actor: "Ramesh Patil (FMR-MH-000421)",
      timestamp: "10 Sep 2026, 12:00:44 IST",
      status: "Anchored",
    },
    {
      txHash: "0x12ff...3341",
      event: "Dispatch Custody Transferred",
      entity: "Vehicle MH-15-EG-4402",
      actor: "GreenHarvest Logistics Fleet",
      timestamp: "10 Sep 2026, 14:30:19 IST",
      status: "Anchored",
    },
    {
      txHash: "0x99aa...7781",
      event: "Banking UTR Reference Submitted",
      entity: "UPI/20260911/AGR-883109",
      actor: "GreenHarvest Accounts Desk",
      timestamp: "11 Sep 2026, 10:45:00 IST",
      status: "Anchored",
    },
  ];

  return (
    <AppLayout title="System Audit Ledger">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Cryptographic Audit Ledger</h2>
          <p className="text-xs text-farmly-muted">
            Immutable log of state changes across produce weighing, quality assay stamping, offer lock-in, and escrow settlements.
          </p>
        </div>

        <Card className="border border-farmly-border bg-farmly-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-farmly-table-header text-farmly-muted border-b border-farmly-border font-semibold">
                <tr>
                  <th className="p-3.5">Tx Hash</th>
                  <th className="p-3.5">Audit Event</th>
                  <th className="p-3.5">Referenced Entity</th>
                  <th className="p-3.5">Authorized Actor</th>
                  <th className="p-3.5">Audit Timestamp</th>
                  <th className="p-3.5">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmly-border">
                {AUDIT_EVENTS.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-farmly-table-hover transition-colors">
                    <td className="p-3.5 font-mono text-farmly-primary font-bold">{ev.txHash}</td>
                    <td className="p-3.5 font-bold text-farmly-foreground">{ev.event}</td>
                    <td className="p-3.5 font-mono text-farmly-muted">{ev.entity}</td>
                    <td className="p-3.5 text-farmly-muted">{ev.actor}</td>
                    <td className="p-3.5 font-mono text-farmly-muted">{ev.timestamp}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
