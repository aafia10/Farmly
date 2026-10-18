"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Link2 } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { LotCertificatesSection } from "@/components/certificates/lot-certificates-section";
import { useMockData } from "@/contexts/mock-data-context";

const PUBLIC_GATEWAY = "https://gateway.pinata.cloud/ipfs";

/** Lot-level Pinata + Sepolia anchor, shown only when the lot really has one. */
function LotAnchor({ ipfsHash, txHash }: { ipfsHash?: string; txHash?: string }) {
  if (!ipfsHash && !txHash) return null;
  return (
    <Card className="bg-farmly-surface border-farmly-border p-4 space-y-2.5 text-xs">
      <div className="font-bold text-farmly-foreground flex items-center gap-1.5">
        <Link2 className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light" /> Lot record anchor
      </div>
      {ipfsHash && (
        <div>
          <span className="text-farmly-muted block text-[10px] uppercase">Lot metadata on IPFS (Pinata)</span>
          <a href={`${PUBLIC_GATEWAY}/${ipfsHash}`} target="_blank" rel="noreferrer" className="font-mono text-farmly-primary dark:text-farmly-accent-light hover:underline break-all inline-flex items-center gap-1">
            {ipfsHash} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      )}
      {txHash && (
        <div>
          <span className="text-farmly-muted block text-[10px] uppercase">Sepolia registration transaction</span>
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="font-mono text-emerald-700 dark:text-emerald-400 hover:underline break-all inline-flex items-center gap-1">
            {txHash} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      )}
    </Card>
  );
}

export default function LotCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lotId = decodeURIComponent(id);
  const { lots } = useMockData();
  const lot = lots.find((l) => l.id === lotId);

  return (
    <AppLayout title="Certificates">
      <div className="space-y-6">
        <div className="space-y-1">
          <Link
            href={`/lots/${encodeURIComponent(lotId)}`}
            className="inline-flex items-center gap-1 text-xs text-farmly-muted hover:text-farmly-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to lot
          </Link>
          <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">Certificates</h1>
          <p className="text-xs font-mono text-farmly-muted">{lotId}</p>
        </div>
        <LotAnchor ipfsHash={lot?.ipfsHash} txHash={lot?.blockchainHash} />
        <LotCertificatesSection lotId={lotId} />
      </div>
    </AppLayout>
  );
}
