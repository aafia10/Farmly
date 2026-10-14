"use client";

import React, { use, useEffect, useState } from "react";
import { Sprout, Truck, Store, Info } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { UnavailableNotice, WarningNotice, StatusPill } from "@/components/certificates/certificate-status";
import { traceabilityApi, type CertificateView, type PublicTrace } from "@/lib/api/traceability";

const STAGE = {
  FARMER_ORIGIN: { icon: Sprout, title: "Grown and registered by the farmer" },
  DISTRIBUTOR_PURCHASE: { icon: Truck, title: "Bought by a distributor" },
  RETAILER_PURCHASE: { icon: Store, title: "Bought by a retailer" },
} as const;

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export default function PublicVerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const recordId = decodeURIComponent(id);
  const [trace, setTrace] = useState<PublicTrace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    traceabilityApi
      .publicTrace(recordId)
      .then(setTrace)
      .catch((e) => setError(e?.message || "This record could not be loaded."));
  }, [recordId]);

  const ordered: CertificateView[] = trace
    ? [...trace.certificates].sort((a, b) => {
        const rank = (c: CertificateView) => (c.type === "FARMER_ORIGIN" ? 0 : 1);
        return rank(a) - rank(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
    : [];
  const hasOrigin = ordered.some((c) => c.type === "FARMER_ORIGIN" && !c.revokedAt);
  const problems = ordered.filter((c) => c.revokedAt || c.expired);
  const pending = ordered.filter((c) => !c.revokedAt && (c.chainStatus !== "CONFIRMED" || c.storageStatus !== "STORED"));

  return (
    <div className="min-h-screen bg-farmly-bg text-farmly-foreground flex flex-col">
      <header className="border-b border-farmly-border bg-farmly-surface">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" showTagline={false} />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-farmly-muted uppercase tracking-wide">Product journey</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {trace ? [trace.product.crop, trace.product.variety].filter(Boolean).join(" · ") : error ? "Record not found" : "Loading…"}
          </h1>
          <p className="text-xs font-mono text-farmly-muted break-all">{recordId}</p>
        </div>

        {error && <UnavailableNotice message={`We could not load this traceability record: ${error}`} />}

        {trace && (
          <>
            <section className="rounded-2xl border border-farmly-border bg-farmly-surface p-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-farmly-muted">Batch</dt>
                  <dd className="font-medium font-mono text-xs break-all">{trace.product.batchId}</dd>
                </div>
                <div>
                  <dt className="text-xs text-farmly-muted">Quantity in this batch</dt>
                  <dd className="font-medium">{trace.product.quantity} {trace.product.unit}</dd>
                </div>
                <div>
                  <dt className="text-xs text-farmly-muted">Harvested</dt>
                  <dd className="font-medium">{formatDate(trace.product.harvestDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-farmly-muted">Registered</dt>
                  <dd className="font-medium">{formatDate(trace.product.registeredAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-farmly-muted">Recorded grade</dt>
                  <dd className="font-medium">{trace.product.qualityGrade || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-farmly-muted">Current custodian</dt>
                  <dd className="font-medium capitalize">
                    {trace.currentCustodian.displayName ?? "—"}
                    {trace.currentCustodian.role ? ` (${trace.currentCustodian.role})` : ""}
                  </dd>
                </div>
              </dl>
            </section>

            {!hasOrigin && <WarningNotice>No active farmer origin certificate is recorded for this product.</WarningNotice>}
            {problems.length > 0 && (
              <WarningNotice>
                {problems.map((c) => `${c.id} is ${c.revokedAt ? `revoked (${c.revocationReason})` : "expired"}`).join(". ")}.
              </WarningNotice>
            )}
            {pending.length > 0 && (
              <WarningNotice>
                {pending.length === 1 ? "One certificate is" : `${pending.length} certificates are`} not fully registered yet, so they cannot be verified.
              </WarningNotice>
            )}

            <section className="space-y-4">
              <h2 className="text-base font-semibold">Journey</h2>
              {ordered.length === 0 ? (
                <p className="text-sm text-farmly-muted">No certificates are recorded for this product yet.</p>
              ) : (
                <ol className="space-y-5">
                  {ordered.map((cert, i) => {
                    const stage = STAGE[cert.type];
                    const Icon = stage.icon;
                    const transfer = trace.transfers.find((t) => t.id === cert.transactionId);
                    return (
                      <li key={cert.id} className="relative pl-11">
                        {i < ordered.length - 1 && <span className="absolute left-[17px] top-10 bottom-[-20px] w-px bg-farmly-border" aria-hidden="true" />}
                        <span className="absolute left-0 top-0 w-9 h-9 rounded-full bg-farmly-primary text-white flex items-center justify-center">
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <div className="mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{stage.title}</span>
                            {cert.id === trace.focusCertificateId && <StatusPill tone="info" label="Scanned certificate" />}
                          </div>
                          <p className="text-xs text-farmly-muted">
                            {cert.type === "FARMER_ORIGIN"
                              ? `${cert.subjectDisplayName ?? "Farmer"}${cert.publicMetadata?.district ? `, ${cert.publicMetadata.district}` : ""}${cert.publicMetadata?.state ? `, ${cert.publicMetadata.state}` : ""} · ${formatDate(cert.createdAt)}`
                              : `${transfer ? `${transfer.quantity} ${transfer.unit}` : ""} to ${cert.subjectDisplayName ?? cert.subjectRole} · ${formatDate(transfer?.createdAt ?? cert.createdAt)}`}
                          </p>
                        </div>
                        <CertificateCard certificate={cert} canViewDocument={cert.visibility === "public"} />
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="flex items-start gap-3 p-4 rounded-xl border border-farmly-border bg-farmly-surface text-xs text-farmly-muted leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-farmly-primary dark:text-farmly-accent-light" />
              <div className="space-y-1.5">
                <p>
                  Scanning a QR code only opens this record. Use <strong className="text-farmly-foreground">Verify certificate</strong> to check that a
                  document&apos;s fingerprint matches the one registered on the blockchain.
                </p>
                <p>
                  The farmer&apos;s origin certificate carries the claims about how the crop was grown, as provided by the farmer. Distributor and
                  retailer certificates only record transfers of custody. They do not certify quality, organic status or government approval.
                </p>
              </div>
            </section>

            <section className="flex flex-col items-center gap-2 pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={traceabilityApi.qrImageUrl(trace.product.batchId)} alt={`QR code for batch ${trace.product.batchId}`} className="w-36 h-36 rounded-lg bg-white p-2" />
              <span className="text-[11px] text-farmly-muted">QR code for this batch</span>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-farmly-border py-4 text-center text-[11px] text-farmly-muted">Farmly traceability record</footer>
    </div>
  );
}
