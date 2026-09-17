"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Boxes,
  MapPin,
  Calendar,
  Award,
  Lock,
  ArrowLeft,
  Scale,
  Sparkles,
  QrCode,
  Tag,
  Building,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { useMockData } from "@/contexts/mock-data-context";

export default function PublicVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { lots, evidence } = useMockData();

  const lotId = resolvedParams?.id || "KS-MH-NSK-WHT-20260910-00125";
  const lot =
    lots.find((l) => l.id.toLowerCase() === lotId.toLowerCase()) ||
    lots[0];
  const lotEvidence = evidence.filter((e) => e.lotId === lot?.id);

  const farmerFirstName = lot?.farmerName.split(" ")[0] || "Ramesh";
  const stateLocation = "Sinnar, Nashik, Maharashtra";

  return (
    <div className="min-h-screen bg-farmly-bg text-farmly-foreground font-sans antialiased flex flex-col justify-between">
      {/* Public Header */}
      <header className="border-b border-farmly-border bg-farmly-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" showTagline={false} />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Verified Provenance Chain
            </span>
          </div>
        </div>
      </header>

      {/* Main Public Card */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Verification Success Pill */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Authentic Farmly Verified Batch
          </div>
          <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
            Agricultural Provenance Certificate
          </h1>
          <p className="text-xs text-farmly-muted">
            Scanned directly from consumer packaging. Cryptographically authenticated against Farmly&apos;s digital ledger.
          </p>
        </div>

        {/* Certificate Card */}
        <Card className="bg-farmly-surface border border-farmly-border overflow-hidden shadow-2xl">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-farmly-primary/15 to-emerald-950/15 p-6 border-b border-farmly-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-farmly-primary uppercase tracking-wider">
                Batch ID: {lot?.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                {lot?.qualityGrade}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-farmly-foreground">{lot?.crop}</h2>
            <div className="text-xs text-farmly-muted font-medium">Cultivar: {lot?.variety}</div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Privacy-Safe Origin Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">Registered Grower:</span>
                <span className="font-semibold text-farmly-foreground text-sm mt-0.5 block">
                  {farmerFirstName} (Farmer)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Identity Field-Verified
                </span>
              </div>

              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">Regional Origin:</span>
                <span className="font-semibold text-farmly-foreground text-sm mt-0.5 block">
                  {stateLocation}
                </span>
                <span className="text-[10px] text-farmly-muted">Geographical Provenance</span>
              </div>

              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">Intake Date:</span>
                <span className="font-semibold text-farmly-foreground text-sm mt-0.5 block">
                  {lot?.createdDate}
                </span>
                <span className="text-[10px] text-farmly-muted">Sinnar Collection Hub #3</span>
              </div>

              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">Assay Reference:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                  {lot?.certificateRef || "QC-MH-NSK-2026-0910"}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  AgriTest Labs Certified
                </span>
              </div>
            </div>

            {/* Evidence Checkpoints with Explicit Source Badges */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-farmly-foreground uppercase tracking-wider">
                Verifiable Origin Checkpoints
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-farmly-foreground font-medium block">Net Measured Weighment</span>
                      <span className="text-[10px] text-farmly-muted font-mono">Scale FPO-SIN-03 (Calibrated)</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                    Scale-measured: 492.4 kg
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-farmly-foreground font-medium block">Quality Assay (Moisture 11.2%)</span>
                      <span className="text-[10px] text-farmly-muted">Foreign Matter: 0.4% &bull; Grade A</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold">
                    Assessor-recorded
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-farmly-foreground font-medium block">Public Testnet Ledger Anchor</span>
                      <span className="text-[10px] text-farmly-muted font-mono">Sepolia Block #29,481,029</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold">
                    Certificate-verified
                  </span>
                </div>
              </div>
            </div>

            {/* Privacy Safeguard Notice */}
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-start gap-3 text-xs text-farmly-muted">
              <Lock className="w-4 h-4 text-farmly-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-farmly-foreground">Farmer Privacy Charter:</strong> Personal contact numbers, bank accounts, and survey plot bounds are confidential and never exposed via public QR codes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Return Button */}
        <div className="text-center pt-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-farmly-muted hover:text-farmly-foreground">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Sign in to Farmly Platform
            </Button>
          </Link>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-farmly-border py-6 text-center text-xs text-farmly-muted space-y-1">
        <div>Farmly &mdash; The Digital Infrastructure for Modern Farming</div>
        <div className="text-[11px]">
          Cryptographically authenticated batch ledger. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
