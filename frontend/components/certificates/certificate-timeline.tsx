"use client";

import React from "react";
import { Sprout, Truck, Store } from "lucide-react";
import type { CertificateView, TransferView } from "@/lib/api/traceability";
import { CertificateCard } from "./certificate-card";

const STAGE_ICON = { FARMER_ORIGIN: Sprout, DISTRIBUTOR_PURCHASE: Truck, RETAILER_PURCHASE: Store } as const;

interface CertificateTimelineProps {
  certificates: CertificateView[];
  transfers?: TransferView[];
  canRetry?: (cert: CertificateView) => boolean;
  canViewDocument?: boolean;
  onChanged?: (cert: CertificateView) => void;
  emptyMessage?: string;
}

/**
 * The certificate bucket for a batch in chronological order: the farmer's origin
 * certificate(s) first, then each distributor/retailer transfer certificate.
 */
export function CertificateTimeline({ certificates, transfers = [], canRetry, canViewDocument, onChanged, emptyMessage }: CertificateTimelineProps) {
  if (certificates.length === 0) {
    return (
      <p className="text-sm text-farmly-muted py-6 text-center">
        {emptyMessage || "No certificates have been registered for this batch yet."}
      </p>
    );
  }

  const ordered = [...certificates].sort((a, b) => {
    const rank = (c: CertificateView) => (c.type === "FARMER_ORIGIN" ? 0 : 1);
    return rank(a) - rank(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <ol className="relative space-y-4">
      {ordered.map((cert, i) => {
        const Icon = STAGE_ICON[cert.type];
        const transfer = transfers.find((t) => t.id === cert.transactionId);
        return (
          <li key={cert.id} className="relative pl-10">
            {i < ordered.length - 1 && <span className="absolute left-[15px] top-9 bottom-[-16px] w-px bg-farmly-border" aria-hidden="true" />}
            <span className="absolute left-0 top-3 w-8 h-8 rounded-full bg-farmly-primary/10 text-farmly-primary dark:text-farmly-accent-light flex items-center justify-center">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
            {transfer && (
              <div className="text-[11px] text-farmly-muted mb-1.5">
                {new Date(transfer.createdAt).toLocaleDateString()} · {transfer.quantity} {transfer.unit} transferred from {transfer.sellerRole} to {transfer.buyerRole}
              </div>
            )}
            <CertificateCard
              certificate={cert}
              canRetry={canRetry?.(cert)}
              canViewDocument={canViewDocument}
              onChanged={onChanged}
            />
          </li>
        );
      })}
    </ol>
  );
}
