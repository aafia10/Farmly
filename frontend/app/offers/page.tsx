"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowRight,
  Clock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";

export default function OffersPage() {
  const { offers, acceptOffer, rejectOffer } = useMockData();
  const { t } = useTranslation();
  const [filter, setFilter] = useState("All");

  const statusTabs = [
    { value: "All", label: t("offers.statusAll", "All") },
    { value: "Pending", label: t("offers.statusPending", "Pending") },
    { value: "Accepted", label: t("offers.statusAccepted", "Accepted") },
    { value: "Rejected", label: t("offers.statusRejected", "Rejected") },
    { value: "Expired", label: t("offers.statusExpired", "Expired") },
  ];

  const filteredOffers = offers.filter((o) => {
    if (filter === "All") return true;
    return o.status === filter;
  });

  return (
    <AppLayout title={t("nav.offers", "Trade Offers")}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {t("offers.title", "Trade Offers & Bids")}
            </h1>
            <p className="text-xs text-farmly-muted">
              {t(
                "offers.subtitle",
                "Review and act upon formal procurement offers backed by conditional digital escrow settlements."
              )}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 scrollbar-none border-b border-farmly-border">
          {statusTabs.map((st) => (
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

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <Card className="bg-farmly-surface border-farmly-border p-12 text-center text-farmly-muted text-xs">
            {t("offers.noOffers", "No trade offers found.")}
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
                      <h3 className="text-lg font-bold text-farmly-foreground mt-0.5">{offer.crop}</h3>
                      <div className="text-xs text-farmly-muted">
                        {t("offers.bidder", "Bidder")}: {offer.buyerName} ({offer.buyerType})
                      </div>
                    </div>
                    <StatusBadge status={offer.status} size="sm" />
                  </div>

                  <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-farmly-muted block">
                        {t("offers.bidRate", "Bid Rate")}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{offer.pricePerKg}/kg
                      </span>
                    </div>
                    <div>
                      <span className="text-farmly-muted block">
                        {t("offers.volumeBid", "Volume Bid")}
                      </span>
                      <span className="font-bold text-farmly-foreground text-sm">
                        {offer.offeredQuantity} {offer.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-farmly-muted block">
                        {t("offers.netToFarmer", "Net to Farmer")}
                      </span>
                      <span className="font-bold text-farmly-foreground text-sm">
                        ₹{offer.expectedNet.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-farmly-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-farmly-muted-dark" />
                    <span>
                      {t("offers.responseDeadline", "Response Deadline")}: {offer.offerDeadline}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-farmly-border/60 flex items-center justify-between gap-2">
                  <Link href={`/offers/${offer.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8">
                      {t("offers.viewBreakdown", "View Breakdown")}{" "}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>

                  {offer.status === "Pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptOffer(offer.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
                      >
                        {t("common.accept", "Accept")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectOffer(offer.id)}
                        className="border-red-500/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-8"
                      >
                        {t("common.decline", "Decline")}
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
