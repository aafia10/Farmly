"use client";

import React, { useState } from "react";
import { Users, Shield, Search, CheckCircle2, UserCheck, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/auth/auth-input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function AdminUsersPage() {
  const { farmers } = useMockData();
  const [roleFilter, setRoleFilter] = useState("All");

  const SYSTEM_USERS = [
    { id: "USR-01", name: "Ramesh Patil", role: "Farmer", region: "Sinnar, Nashik", verified: true, date: "10 Sep 2026" },
    { id: "USR-02", name: "Priya Sharma", role: "Helper", region: "Nashik District", verified: true, date: "01 Jan 2026" },
    { id: "USR-03", name: "GreenHarvest Distributors", role: "Distributor", region: "Bhiwandi / Nashik", verified: true, date: "15 Mar 2026" },
    { id: "USR-04", name: "FreshBasket Retail", role: "Retailer", region: "Dadar, Mumbai", verified: true, date: "20 Apr 2026" },
    { id: "USR-05", name: "Sahyadri Farmers Co-op", role: "FPO", region: "Sinnar", verified: true, date: "10 Jan 2024" },
    { id: "USR-06", name: "Sinnar Collection Hub #3", role: "Collection Center", region: "Sinnar East", verified: true, date: "01 Jun 2025" },
    { id: "USR-07", name: "Dr. K. V. Mehta (AgriTest)", role: "Quality Assessor", region: "Pune / Nashik", verified: true, date: "12 Aug 2025" },
    { id: "USR-08", name: "Farmly Oversight & Audit", role: "Admin", region: "Central HQ", verified: true, date: "01 Jan 2024" },
  ];

  const filtered = SYSTEM_USERS.filter((u) => roleFilter === "All" || u.role === roleFilter);

  return (
    <AppLayout title="Multi-Role User Directory">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Platform Role &amp; Identity Governance</h2>
          <p className="text-xs text-farmly-muted">
            Auditing credentials, field helper authorizations, and KYC verification status across all 8 ecosystem roles.
          </p>
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap gap-2">
          {["All", "Farmer", "Helper", "Distributor", "Retailer", "FPO", "Collection Center", "Quality Assessor", "Admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? "bg-farmly-primary text-white"
                  : "bg-farmly-surface-elevated text-farmly-muted border border-farmly-border hover:text-farmly-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <Card className="border border-farmly-border bg-farmly-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-farmly-table-header text-farmly-muted border-b border-farmly-border font-semibold">
                <tr>
                  <th className="p-3.5">User ID</th>
                  <th className="p-3.5">Entity / Individual</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Jurisdiction / Location</th>
                  <th className="p-3.5">Onboarded</th>
                  <th className="p-3.5">KYC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmly-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-farmly-table-hover transition-colors">
                    <td className="p-3.5 font-mono font-bold text-farmly-primary dark:text-farmly-accent-light">{u.id}</td>
                    <td className="p-3.5 font-bold text-farmly-foreground">{u.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-farmly-surface-elevated border border-farmly-border font-medium text-farmly-foreground">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 text-farmly-muted">{u.region}</td>
                    <td className="p-3.5 font-mono text-farmly-muted">{u.date}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Field Verified
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
