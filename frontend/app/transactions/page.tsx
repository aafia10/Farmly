"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Download,
  Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function TransactionsPage() {
  const { transactions } = useMockData();
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");

  const types = ["All", "Sale", "Purchase", "Transfer", "Settlement", "Fee"];

  const filtered = transactions.filter((tx) => {
    const matchType = filterType === "All" || tx.type === filterType;
    const matchSearch =
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      tx.crop.toLowerCase().includes(search.toLowerCase()) ||
      tx.counterparty.toLowerCase().includes(search.toLowerCase()) ||
      tx.lotId.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIn = transactions
    .filter((t) => t.type === "Sale" || t.type === "Settlement")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOut = transactions
    .filter((t) => t.type === "Purchase" || t.type === "Fee")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <AppLayout title="Transaction Ledger">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Agricultural Transaction Ledger</h1>
            <p className="text-xs text-farmly-muted">
              Audited historical record of produce sales, purchase transfers, APMC levies, and digital escrow payouts.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert("Statement export ready.")}
            className="border-farmly-border text-white text-xs h-9 hover:bg-farmly-surface-elevated shrink-0"
          >
            <Download className="w-4 h-4 mr-1.5 text-farmly-accent" />
            Download Statement
          </Button>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-1">
            <span className="text-xs text-farmly-muted flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> Total Inflow (Sales & Payouts)
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              ₹{totalIn.toLocaleString("en-IN")}
            </div>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-1">
            <span className="text-xs text-farmly-muted flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-red-400" /> Total Outflow (Procurement & Fees)
            </span>
            <div className="text-2xl font-bold text-white font-mono">
              ₹{totalOut.toLocaleString("en-IN")}
            </div>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-1">
            <span className="text-xs text-farmly-muted">Net Position</span>
            <div className="text-2xl font-bold text-emerald-300 font-mono">
              ₹{(totalIn - totalOut).toLocaleString("en-IN")}
            </div>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-farmly-surface border border-farmly-border">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmly-muted" />
            <Input
              placeholder="Search ID, counterparty, crop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {types.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setFilterType(tp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === tp
                    ? "bg-farmly-primary text-white"
                    : "text-farmly-muted hover:text-white"
                }`}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="bg-farmly-surface border-farmly-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-farmly-surface-elevated text-xs font-semibold text-farmly-muted uppercase border-b border-farmly-border">
                <tr>
                  <th className="px-5 py-3.5">Tx ID</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Produce & Lot</th>
                  <th className="px-5 py-3.5">Counterparty</th>
                  <th className="px-5 py-3.5">Volume</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmly-border/60 text-xs">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-farmly-surface-elevated/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white">{tx.id}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold uppercase text-[10px] ${
                          tx.type === "Sale" || tx.type === "Settlement"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{tx.crop}</div>
                      <Link href={`/lots/${tx.lotId}`} className="font-mono text-farmly-muted hover:underline">
                        {tx.lotId}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-white">{tx.counterparty}</td>
                    <td className="px-5 py-4 font-mono text-white">
                      {tx.quantity > 0 ? `${tx.quantity} kg` : "—"}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={tx.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right text-farmly-muted font-mono">{tx.date}</td>
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
