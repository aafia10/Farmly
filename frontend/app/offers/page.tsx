"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";

export default function OffersPage() {
  const { offers, acceptOffer, rejectOffer } = useMockData();
  const { user, role } = useAuth();
  const [filter, setFilter] = useState("All");

  const statuses = ["All", "Pending", "Accepted", "Rejected", "Expired"];

  const filteredOffers = offers.filter((o) => {
    if (filter === "All") return true;
    return o.status === filter;
  });

  return (
    <AppLayout title="Trade Offers & Bids">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Trade Offers & Bids</h1>
            <p className="text-xs text-farmly-muted">
              Review and act upon formal procurement offers backed by conditional digital escrow settlements.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-farmly-border pb-3">
          {statuses.map((st) => (
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

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-farmly-muted text-xs">
            No trade offers found under the &quot;{filter}&quot; category.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => (
              <Card
                key={offer.id}
                className="bg-farmly-surface border-farmly-border p-5 space-y-4 hover:border-farmly-accent/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs text-farmly-accent font-bold">
                        {offer.id} • Lot {offer.lotId}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">{offer.crop}</h3>
                      <div className="text-xs text-farmly-muted">Bidder: {offer.buyerName} ({offer.buyerType})</div>
                    </div>
                    <StatusBadge status={offer.status} size="sm" />
                  </div>

                  <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-farmly-muted block">Bid Rate</span>
                      <span className="font-bold text-emerald-400 text-sm">₹{offer.pricePerKg}/kg</span>
                    </div>
                    <div>
                      <span className="text-farmly-muted block">Volume Bid</span>
                      <span className="font-bold text-white text-sm">{offer.offeredQuantity} {offer.unit}</span>
                    </div>
                    <div>
                      <span className="text-farmly-muted block">Net to Farmer</span>
                      <span className="font-bold text-white text-sm">
                        ₹{offer.expectedNet.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-farmly-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-farmly-muted-dark" />
                    <span>Response Deadline: {offer.offerDeadline}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-farmly-border/60 flex items-center justify-between gap-2">
                  <Link href={`/offers/${offer.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8">
                      View Breakdown <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>

                  {offer.status === "Pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptOffer(offer.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectOffer(offer.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-950/20 text-xs h-8"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
