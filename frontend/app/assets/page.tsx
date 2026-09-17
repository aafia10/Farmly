"use client";

import React from "react";
import Link from "next/link";
import {
  Boxes,
  Wheat,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf,
  FileCheck2,
  TreePine,
  Coins,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";

export default function AssetsPage() {
  const { lots, cropAvailabilities } = useMockData();
  const { user } = useAuth();

  return (
    <AppLayout title="Farmer Agricultural Assets">
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-farmly-primary/30 via-farmly-dark-green/40 to-farmly-surface border border-farmly-border p-6 lg:p-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <Boxes className="w-3.5 h-3.5" />
              Verified Agricultural Asset Portfolio
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Grower Holdings & Harvest Pipeline
            </h1>
            <p className="text-xs text-farmly-muted leading-relaxed">
              Consolidated registry of verified harvest lots, upcoming field crop availability declarations, and future tokenized rural asset classes.
            </p>
          </div>
        </div>

        {/* Section 1: Active Harvest Lots */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Active Produce Lots</h2>
              <p className="text-xs text-farmly-muted">Ready for marketplace bidding or fulfillment</p>
            </div>
            <Link href="/lots" className="text-xs text-farmly-accent hover:underline flex items-center gap-1">
              All lots <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lots.slice(0, 3).map((lot) => (
              <Card key={lot.id} className="bg-farmly-surface border-farmly-border p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-farmly-accent">{lot.id}</span>
                      <h3 className="font-bold text-white text-base mt-0.5">{lot.crop}</h3>
                      <div className="text-xs text-farmly-muted">{lot.variety}</div>
                    </div>
                    <StatusBadge status={lot.status} size="sm" />
                  </div>

                  <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs flex justify-between">
                    <span className="text-farmly-muted">Volume:</span>
                    <span className="font-bold text-white">{lot.quantity} {lot.unit}</span>
                  </div>
                </div>

                <Link href={`/lots/${lot.id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs border-farmly-border hover:bg-farmly-surface-elevated text-white">
                    View Lineage & Documents
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 2: Crop Availabilities (Pipeline) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Upcoming Harvest Pipeline</h2>
              <p className="text-xs text-farmly-muted">Declared standing crops with expected harvest dates</p>
            </div>
            <Link href="/helper/crop-availability" className="text-xs text-farmly-accent hover:underline flex items-center gap-1">
              Registry <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cropAvailabilities.map((ca) => (
              <Card key={ca.id} className="bg-farmly-surface border-farmly-border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs text-amber-400 font-bold">{ca.id}</span>
                    <h3 className="font-bold text-white text-base mt-0.5">{ca.crop}</h3>
                    <div className="text-xs text-farmly-muted">{ca.variety}</div>
                  </div>
                  <StatusBadge status={ca.status} size="sm" />
                </div>

                <div className="space-y-1.5 text-xs text-farmly-muted">
                  <div className="flex justify-between">
                    <span>Estimated Yield:</span>
                    <span className="text-white font-semibold">{ca.estimatedQuantity} {ca.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Harvest:</span>
                    <span className="text-emerald-400 font-medium">{ca.expectedHarvestDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location:</span>
                    <span className="text-white truncate max-w-[140px]">{ca.location}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 3: Future Asset Registry Domains (Preview) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">Future Asset Domains (Coming Soon)</h2>
            <p className="text-xs text-farmly-muted">Extensible digital infrastructure under development for Farmly 2.0</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-farmly-surface border-farmly-border/70 p-6 space-y-3 relative overflow-hidden">
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                Preview
              </span>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Digital Land Titles</h3>
              <p className="text-xs text-farmly-muted leading-relaxed">
                Connect state revenue records and cadastral survey numbers to create unassailable identity collateral for crop loans.
              </p>
            </Card>

            <Card className="bg-farmly-surface border-farmly-border/70 p-6 space-y-3 relative overflow-hidden">
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                Preview
              </span>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Agricultural Inputs</h3>
              <p className="text-xs text-farmly-muted leading-relaxed">
                Track certified seeds, organic bio-fertilizers, and water telemetry to verify zero-residue regenerative practices.
              </p>
            </Card>

            <Card className="bg-farmly-surface border-farmly-border/70 p-6 space-y-3 relative overflow-hidden">
              <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
                Preview
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Soil Carbon Credits</h3>
              <p className="text-xs text-farmly-muted leading-relaxed">
                Monetize verified soil organic carbon increases through satellite remote sensing and soil testing integration.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
