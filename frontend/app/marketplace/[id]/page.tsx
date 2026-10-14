"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, QrCode } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";
import { traceabilityApi, type BatchTrace } from "@/lib/api/traceability";
import { CertificateTimeline } from "@/components/certificates/certificate-timeline";
import { PurchasePanel } from "@/components/certificates/purchase-panel";
import { UnavailableNotice } from "@/components/certificates/certificate-status";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-farmly-muted">{label}</dt>
      <dd className="text-sm font-medium text-farmly-foreground mt-0.5 break-words">{value ?? "—"}</dd>
    </div>
  );
}

export default function MarketplaceLotDetailPage() {
  const params = useParams<{ id: string }>();
  const lotId = decodeURIComponent(params?.id || "");
  const { lots } = useMockData();
  const { role } = useAuth();
  const { t } = useTranslation();

  const [trace, setTrace] = useState<BatchTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTrace(await traceabilityApi.batchTrace(lotId));
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || "Certificate service unavailable");
    } finally {
      setLoading(false);
    }
  }, [lotId]);

  useEffect(() => {
    load();
  }, [load]);

  // Fallback: the lot as known to the app when the certificate service cannot be reached.
  const fallbackLot = lots.find((l) => l.id === lotId);
  const batch = trace?.batch;

  const crop = batch?.crop ?? fallbackLot?.crop;
  const activeCertificates = (trace?.certificates ?? []).filter((c) => c.batchId === batch?.id && !c.revokedAt);
  const sourcePending = activeCertificates.length > 0 && activeCertificates.every((c) => c.chainStatus !== "CONFIRMED");

  const canBuy =
    batch &&
    ((role === "distributor" && batch.ownerRole === "farmer") || (role === "retailer" && batch.ownerRole === "distributor")) &&
    batch.availableQuantity > 0;

  return (
    <AppLayout title={t("marketplace.inspect", "Inspect")}>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/marketplace" aria-label="Back to marketplace">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-farmly-foreground tracking-tight truncate">{crop || "Batch"}</h1>
            <p className="text-xs text-farmly-muted font-mono truncate">{lotId}</p>
          </div>
        </div>

        {loadError && (
          <UnavailableNotice
            message={`Certificate and traceability records could not be loaded (${loadError}). Showing the basic lot details only; purchasing is disabled.`}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-base font-semibold text-farmly-foreground">Batch details</h2>
                <StatusBadge status={batch?.status ?? fallbackLot?.status ?? "Unknown"} size="sm" />
              </div>
              {loading ? (
                <p className="text-sm text-farmly-muted">Loading…</p>
              ) : (
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                  <Detail label="Crop" value={[crop, batch?.variety ?? fallbackLot?.variety].filter(Boolean).join(" · ")} />
                  <Detail label="Original quantity" value={batch ? `${batch.originalQuantity} ${batch.unit}` : fallbackLot && `${fallbackLot.quantity} ${fallbackLot.unit}`} />
                  <Detail label="Available now" value={batch ? `${batch.availableQuantity} ${batch.unit}` : "—"} />
                  <Detail label="Harvest date" value={batch?.harvestDate} />
                  <Detail label="Recorded grade" value={batch?.qualityGrade ?? fallbackLot?.qualityGrade} />
                  <Detail label="Current custodian" value={batch ? `${batch.ownerDisplayName ?? "—"} (${batch.ownerRole ?? "unknown"})` : "—"} />
                  {batch && batch.lineagePath.length > 1 && (
                    <div className="col-span-2 sm:col-span-3">
                      <Detail label="Lineage" value={<span className="font-mono text-xs">{batch.lineagePath.join(" → ")}</span>} />
                    </div>
                  )}
                </dl>
              )}
            </Card>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-farmly-foreground">Certificates</h2>
                  <p className="text-xs text-farmly-muted">The farmer&apos;s origin certificate first, then each recorded transfer.</p>
                </div>
                {batch && (
                  <a href={traceabilityApi.qrImageUrl(batch.id)} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5" type="button">
                      <QrCode className="w-3.5 h-3.5" /> Batch QR
                    </Button>
                  </a>
                )}
              </div>
              {trace ? (
                <CertificateTimeline certificates={trace.certificates} transfers={trace.transfers} canViewDocument />
              ) : (
                !loading && <p className="text-sm text-farmly-muted">Certificates are unavailable right now.</p>
              )}
            </section>

            {trace && trace.outgoingTransfers.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-farmly-foreground">Sales from this batch</h2>
                <Card className="divide-y divide-farmly-border">
                  {trace.outgoingTransfers.map((tr) => (
                    <div key={tr.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium text-farmly-foreground">{tr.quantity} {tr.unit} to {tr.buyerName ?? tr.buyerRole}</div>
                        <div className="text-xs text-farmly-muted font-mono truncate">{tr.id}</div>
                      </div>
                      <StatusBadge status={tr.status === "TRACEABILITY_UPDATED" ? "Completed" : "Pending"} size="sm" />
                    </div>
                  ))}
                </Card>
              </section>
            )}
          </div>

          <Card className="p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-farmly-foreground mb-4">
              {canBuy ? "Purchase" : "Inspection"}
            </h2>
            {canBuy && batch ? (
              <PurchasePanel
                batchId={batch.id}
                availableQuantity={batch.availableQuantity}
                unit={batch.unit}
                sellerLabel={`${batch.ownerDisplayName ?? "seller"} (${batch.ownerRole})`}
                hasCertificate={activeCertificates.length > 0}
                sourceCertificatePending={sourcePending}
                onPurchased={() => load()}
              />
            ) : (
              <p className="text-sm text-farmly-muted leading-relaxed">
                {!batch
                  ? "Purchasing becomes available once the certificate service is reachable."
                  : batch.availableQuantity <= 0
                    ? "This batch has no quantity left."
                    : role === "distributor" || role === "retailer"
                      ? "Distributors buy from farmers and retailers buy from distributors, so this batch isn't available to your role."
                      : "Review the batch details and certificates. Verify any certificate to check its integrity."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
