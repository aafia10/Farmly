"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { useMockData } from "@/contexts/mock-data-context";

export default function PublicVerifyPage() {
  const params = useParams<{ id: string }>();
  const { lots, evidence } = useMockData();

  const lotId = params?.id || "LT-20391";
  const lot = lots.find((l) => l.id.toLowerCase() === lotId.toLowerCase()) || lots[0];
  const lotEvidence = evidence.filter((e) => e.lotId === lot?.id);

  const farmerFirstName = lot?.farmerName.split(" ")[0] || "Verified Farmer";
  const stateLocation = lot?.location.split(",").pop()?.trim() || "Gujarat";

  return (
    <div className="min-h-screen bg-farmly-bg text-white font-sans antialiased flex flex-col justify-between">
      {/* Public Header */}
      <header className="border-b border-farmly-border bg-farmly-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" showTagline={false} />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-semibold">Verified Provenance Chain</span>
          </div>
        </div>
      </header>

      {/* Main Public Card */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Verification Success Pill */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Authentic Farmly Verified Batch
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agricultural Provenance Certificate</h1>
          <p className="text-xs text-farmly-muted">
            Scanned directly from consumer product packaging. Cryptographically authenticated against Farmly&apos;s digital ledger.
          </p>
        </div>

        {/* Certificate Card */}
        <Card className="bg-farmly-surface border-farmly-border overflow-hidden shadow-2xl">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-farmly-primary/40 to-emerald-950/40 p-6 border-b border-farmly-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Batch ID: {lot?.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/30">
                {lot?.qualityGrade}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">{lot?.crop}</h2>
            <div className="text-xs text-farmly-muted font-medium">Cultivar: {lot?.variety}</div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Privacy-Safe Origin Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">Registered Grower:</span>
                <span className="font-semibold text-white text-sm mt-0.5 block">{farmerFirstName} (Grower)</span>
                <span className="text-[10px] text-emerald-400">Identity Field-Verified</span>
              </div>

              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">Regional Origin:</span>
                <span className="font-semibold text-white text-sm mt-0.5 block">{stateLocation}, India</span>
                <span className="text-[10px] text-farmly-muted">Geographical Origin</span>
              </div>

              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">Harvest Documentation:</span>
                <span className="font-semibold text-white text-sm mt-0.5 block">{lot?.createdDate}</span>
                <span className="text-[10px] text-farmly-muted">Initial Scale Weighment</span>
              </div>

              <div className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
                <span className="text-farmly-muted block">National Standard:</span>
                <span className="font-mono font-semibold text-emerald-300 text-sm mt-0.5 block">
                  {lot?.certificateRef || "AGMARK-CERT-4410"}
                </span>
                <span className="text-[10px] text-emerald-400">APMC Lab Tested</span>
              </div>
            </div>

            {/* Evidence & Verification Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Verifiable Audit Checkpoints
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-medium">Field Weighment Scaled</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300">Calibrated WS-04</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-medium">Moisture Testing Standard</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300">11.8% (Passed)</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-white font-medium">Fair Escrow Settlement</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-300">Closed & Disbursed</span>
                </div>
              </div>
            </div>

            {/* Privacy Safeguard Notice */}
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated/80 border border-farmly-border flex items-start gap-3 text-xs text-farmly-muted">
              <Lock className="w-4 h-4 text-farmly-accent shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Farmer Privacy Protection:</strong> Sensitive personal information including exact land survey numbers, phone numbers, and bank credentials are confidential and protected by Farmly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Return Button */}
        <div className="text-center pt-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-farmly-muted hover:text-white">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Sign in to Farmly Platform
            </Button>
          </Link>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t border-farmly-border py-6 text-center text-xs text-farmly-muted space-y-1">
        <div>Farmly — The Digital Infrastructure for Modern Farming</div>
        <div className="text-[11px] text-farmly-muted-dark">
          Cryptographically authenticated batch ledger. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
