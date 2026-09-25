"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  Search,
  AlertTriangle,
  TrendingUp,
  Info,
  Calendar,
  Building,
  HelpCircle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/contexts/language-context";
import { backendClient } from "@/lib/api/backendClient";

interface CropPriceBenchmark {
  crop: string;
  variety: string;
  msp: number; // ₹ per quintal
  apmcMin: number;
  apmcMax: number;
  modalPrice: number;
  trend: "up" | "stable" | "down";
  lastUpdated: string;
}

const BENCHMARKS: CropPriceBenchmark[] = [
  { crop: "Wheat", variety: "Sharbati / Lokwan", msp: 2275, apmcMin: 2200, apmcMax: 2650, modalPrice: 2450, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Basmati Rice", variety: "Pusa 1121", msp: 3100, apmcMin: 3200, apmcMax: 3850, modalPrice: 3500, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Soybean", variety: "Yellow Soybean", msp: 4600, apmcMin: 4400, apmcMax: 4950, modalPrice: 4750, trend: "stable", lastUpdated: "16 Sep 2026" },
  { crop: "Cotton", variety: "Medium Staple", msp: 7020, apmcMin: 6900, apmcMax: 7400, modalPrice: 7150, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Mustard Seed", variety: "Brown Mustard", msp: 5650, apmcMin: 5400, apmcMax: 6100, modalPrice: 5800, trend: "up", lastUpdated: "16 Sep 2026" },
  { crop: "Maize", variety: "Kharif Hybrid", msp: 2090, apmcMin: 1950, apmcMax: 2250, modalPrice: 2120, trend: "stable", lastUpdated: "15 Sep 2026" },
  { crop: "Tur / Arhar", variety: "Desi Red", msp: 7000, apmcMin: 6900, apmcMax: 7600, modalPrice: 7300, trend: "up", lastUpdated: "17 Sep 2026" },
  { crop: "Gram (Chana)", variety: "Desi Chana", msp: 5440, apmcMin: 5300, apmcMax: 5750, modalPrice: 5520, trend: "stable", lastUpdated: "16 Sep 2026" },
];

export default function FairPricePage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [benchmarks, setBenchmarks] = useState<CropPriceBenchmark[]>(BENCHMARKS);

  useEffect(() => {
    backendClient.getMandiBenchmarks().then((data: any) => {
      if (Array.isArray(data) && data.length > 0) {
        setBenchmarks(data);
      }
    }).catch(() => {});
  }, []);

  const filtered = benchmarks.filter(
    (b) =>
      b.crop.toLowerCase().includes(search.toLowerCase()) ||
      b.variety.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title={t("nav.fairPrice", "Fair Price Reference Benchmarks")}>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
            {t("fairPrice.title", "Fair Price Reference Benchmarks")}
          </h1>
          <p className="text-xs text-farmly-muted">
            {t(
              "fairPrice.subtitle",
              "Aggregated government Minimum Support Price (MSP) announcements and regional APMC mandi spot rates."
            )}
          </p>
        </div>

        {/* MANDATORY PROMINENT DISCLAIMER */}
        <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-300 dark:border-amber-500/40 text-amber-950 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-amber-800 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            {t("fairPrice.disclaimerTitle", "Mandatory Price Reference Disclaimer")}
          </div>
          <p className="leading-relaxed text-amber-900 dark:text-amber-200/90">
            {t(
              "fairPrice.disclaimerText",
              "The prices displayed on this page are non-binding indicative benchmarks compiled from public APMC market bulletins and Government of India MSP notifications. Farmly does not set, guarantee, or legally mandate produce prices. Actual realized transaction prices are negotiated freely between buyers and sellers, subject to moisture content, foreign matter grading, bulk volume discounts, and local transport logistics. Always verify current rates with your local FPO or mandi yard committee prior to concluding sales."
            )}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-farmly-surface border border-farmly-border">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmly-muted" />
            <Input
              placeholder={t("fairPrice.searchPlaceholder", "Search crop benchmarks...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <div className="text-xs text-farmly-muted font-mono hidden sm:block">
            {t("fairPrice.unitNote", "Rates in INR per Quintal (100 kg)")}
          </div>
        </div>

        {/* Benchmarks Table */}
        <Card className="bg-farmly-surface border-farmly-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-farmly-surface-elevated text-xs font-semibold text-farmly-muted uppercase border-b border-farmly-border">
                <tr>
                  <th className="px-5 py-3.5">{t("fairPrice.commodity", "Commodity & Variety")}</th>
                  <th className="px-5 py-3.5">{t("fairPrice.msp", "Govt. MSP (₹/qtl)")}</th>
                  <th className="px-5 py-3.5">{t("fairPrice.apmcRange", "APMC Mandi Range")}</th>
                  <th className="px-5 py-3.5">{t("fairPrice.modalPrice", "Modal Spot Rate")}</th>
                  <th className="px-5 py-3.5">{t("fairPrice.spread", "Spread vs MSP")}</th>
                  <th className="px-5 py-3.5 text-right">{t("fairPrice.lastSurveyed", "Last Surveyed")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-farmly-border/60 text-xs">
                {filtered.map((item, idx) => {
                  const diff = item.modalPrice - item.msp;
                  const isAbove = diff >= 0;

                  return (
                    <tr key={idx} className="hover:bg-farmly-surface-elevated/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-farmly-foreground text-sm">{item.crop}</div>
                        <div className="text-farmly-muted text-xs">{item.variety}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                        ₹{item.msp.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 font-mono text-farmly-foreground">
                        ₹{item.apmcMin.toLocaleString("en-IN")} – ₹{item.apmcMax.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₹{item.modalPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] ${
                            isAbove
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {isAbove ? `+₹${diff}` : `-₹${Math.abs(diff)}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-farmly-muted font-mono">
                        {item.lastUpdated}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
