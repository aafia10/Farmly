"use client";

import React, { use } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Download,
  ShieldCheck,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/contexts/mock-data-context";

export default function LotCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lots } = useMockData();

  const lot = lots.find((l) => l.id === id) || lots[0];
  const certRef = lot.certificateRef || `QC-MH-NSK-2026-${lot.id.slice(-4)}`;
  const sha256Hash = "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4";
  const ipfsCid = lot.ipfsHash || "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const txHash = lot.blockchainHash || "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";
  const isSepoliaTx = txHash.startsWith("0x");

  const handleDownload = () => {
    alert(`Downloading verified digital certificate ${certRef} (PDF format).`);
  };

  return (
    <AppLayout title={`Certificate — ${lot.id}`}>
      <div className="max-w-3xl space-y-6 mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-farmly-muted">
          <Link href={`/lots/${lot.id}`} className="hover:text-farmly-primary flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Lot
          </Link>
          <span>/</span>
          <span className="text-farmly-foreground font-medium">Digital Certificate of Authenticity</span>
        </div>

        {/* Certificate Card */}
        <Card className="p-6 sm:p-8 border-2 border-emerald-500/30 bg-farmly-surface shadow-xl relative overflow-hidden">
          {/* Watermark seal */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full border-4 border-emerald-500/10 flex items-center justify-center pointer-events-none">
            <ShieldCheck className="w-24 h-24 text-emerald-500/15" />
          </div>

          <div className="border-b border-farmly-border pb-5 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-farmly-primary uppercase tracking-wider">
                Farmly Digital Provenance Ledger
              </div>
              <h2 className="text-2xl font-black text-farmly-foreground mt-1">Certificate of Quality &amp; Origin</h2>
              <p className="text-xs text-farmly-muted font-mono mt-0.5">Certificate Ref: {certRef}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold font-mono">VERIFIED</span>
            </div>
          </div>

          {/* Certificate Body Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <span className="text-farmly-muted block mb-0.5">Produce &amp; Variety</span>
              <strong className="text-sm text-farmly-foreground block">{lot.crop} ({lot.variety})</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <span className="text-farmly-muted block mb-0.5">Assigned Grade</span>
              <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                {lot.qualityGrade} (Certified)
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <span className="text-farmly-muted block mb-0.5">Net Measured Weighment</span>
              <strong className="text-sm text-farmly-foreground font-mono block">
                {lot.quantity} {lot.unit}
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <span className="text-farmly-muted block mb-0.5">Origin / Collection Center</span>
              <strong className="text-sm text-farmly-foreground block">{lot.location}</strong>
            </div>
          </div>

          {/* Cryptographic Verification Hashes */}
          <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-2.5 text-xs font-mono mb-6">
            <div className="flex items-center justify-between pb-2 border-b border-farmly-border font-sans">
              <span className="font-bold text-farmly-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Tamper-Evident Integrity Hashes
              </span>
              <span className="text-[11px] text-farmly-muted">SHA-256 / IPFS CID</span>
            </div>

            <div>
              <span className="text-farmly-muted block text-[10px] uppercase font-sans">Document SHA-256 Digest</span>
              <span className="text-farmly-foreground break-all">{sha256Hash}</span>
            </div>

            <div>
              <span className="text-farmly-muted block text-[10px] uppercase font-sans">Immutable IPFS CID (Pinata)</span>
              <a
                href={`https://gateway.pinata.cloud/ipfs/${ipfsCid}`}
                target="_blank"
                rel="noreferrer"
                className="text-farmly-primary hover:underline break-all inline-flex items-center gap-1"
              >
                {ipfsCid} <ExternalLink className="w-3 h-3 inline shrink-0" />
              </a>
            </div>

            <div>
              <span className="text-farmly-muted block text-[10px] uppercase font-sans">Public Blockchain Anchor (Sepolia)</span>
              {isSepoliaTx ? (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline break-all inline-flex items-center gap-1"
                >
                  {txHash} <ExternalLink className="w-3 h-3 inline shrink-0" />
                </a>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">{txHash}</span>
              )}
            </div>
          </div>

          {/* QR Verification preview & buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-farmly-border">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-center">
                <QrCode className="w-8 h-8 text-farmly-primary" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-farmly-foreground">Consumer Verification QR</div>
                <Link href={`/verify/${lot.id}`} className="text-farmly-primary hover:underline flex items-center gap-1">
                  Preview Public QR Page <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <Button onClick={handleDownload} className="bg-farmly-primary text-white flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Certificate PDF
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
