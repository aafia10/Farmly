"use client";

import React, { useState } from "react";
import { Users, Plus, CheckCircle2, Search, UserPlus } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function FPOMembersPage() {
  const { fpoMembers } = useMockData();
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = fpoMembers.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.village.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout title="FPO Farmer Members">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-farmly-foreground">Producer Shareholder Roster</h2>
            <p className="text-xs text-farmly-muted">
              Registered members of Sahyadri Farmers Producer Co-op entitled to collective procurement &amp; dividends.
            </p>
          </div>
          <Button className="bg-farmly-primary text-white flex items-center gap-1.5 text-xs">
            <UserPlus className="w-4 h-4" /> Enroll New Member
          </Button>
        </div>

        <div className="max-w-md">
          <Input
            placeholder="Search member name or village..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} hoverGlow className="p-5 border border-farmly-border bg-farmly-surface flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-farmly-primary font-bold">{m.id}</span>
                    <h3 className="text-base font-bold text-farmly-foreground">{m.name}</h3>
                    <span className="text-xs text-farmly-muted">{m.village}, Sinnar Block</span>
                  </div>
                  <StatusBadge status={m.status} size="sm" />
                </div>

                <div className="pt-2 border-t border-farmly-border text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-farmly-muted">Share Capital:</span>
                    <strong className="text-farmly-foreground font-mono">{m.shareHolding} Equity Shares</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-farmly-muted">Lifetime Intake:</span>
                    <strong className="text-farmly-foreground font-mono">{m.totalContributedKg} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-farmly-muted">Crops Grown:</span>
                    <span className="text-farmly-foreground font-medium">{m.crops.join(", ")}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-farmly-border text-[11px] text-farmly-muted flex items-center justify-between">
                <span>Joined: {m.joinedDate}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">KYC Verified</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
