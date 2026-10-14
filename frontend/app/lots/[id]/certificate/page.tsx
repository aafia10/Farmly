"use client";

import React, { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { LotCertificatesSection } from "@/components/certificates/lot-certificates-section";

export default function LotCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lotId = decodeURIComponent(id);

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
        <LotCertificatesSection lotId={lotId} />
      </div>
    </AppLayout>
  );
}
