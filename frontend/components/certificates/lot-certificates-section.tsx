"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { traceabilityApi, type BatchTrace } from "@/lib/api/traceability";
import { CertificateTimeline } from "./certificate-timeline";
import { UploadCertificateForm } from "./upload-certificate-form";
import { UnavailableNotice } from "./certificate-status";

/** Certificate bucket for a lot: chain, upload (farmer/helper on original batches), QR. */
export function LotCertificatesSection({ lotId }: { lotId: string }) {
  const { role } = useAuth();
  const [trace, setTrace] = useState<BatchTrace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(() => {
    traceabilityApi
      .batchTrace(lotId)
      .then((t) => {
        setTrace(t);
        setError(null);
      })
      .catch((e) => setError(e?.message || "unavailable"));
  }, [lotId]);

  useEffect(load, [load]);

  if (error) {
    return <UnavailableNotice message={`Certificates could not be loaded (${error}).`} />;
  }
  if (!trace) return <p className="text-sm text-farmly-muted">Loading certificates…</p>;

  const isOriginalBatch = !trace.batch.parentBatchId;
  const canUpload = isOriginalBatch && (role === "farmer" || role === "helper");
  const activeOrigin = trace.certificates.filter((c) => c.type === "FARMER_ORIGIN" && !c.revokedAt);
  const latestOrigin = activeOrigin[activeOrigin.length - 1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-farmly-foreground">Certificate history</h3>
          <p className="text-xs text-farmly-muted">Certificates are append-only: corrections are added as new versions, never overwritten.</p>
        </div>
        <CertificateTimeline
          certificates={trace.certificates}
          transfers={trace.transfers}
          canViewDocument
          canRetry={() => true}
          onChanged={load}
          emptyMessage={
            canUpload
              ? "No certificate yet. Upload the farmer's supporting document to start this batch's traceability record."
              : "No certificates have been registered for this batch yet."
          }
        />
      </div>

      <div className="space-y-4">
        {canUpload && (
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-farmly-foreground">
                {latestOrigin ? "Add a document" : "Upload origin certificate"}
              </h3>
              <p className="text-xs text-farmly-muted mt-0.5">
                {latestOrigin
                  ? `Upload a new version of ${latestOrigin.id}, or another supporting document.`
                  : "Buyers can purchase this batch only after a certificate is attached."}
              </p>
            </div>
            {showUpload || !latestOrigin ? (
              <UploadCertificateForm batchId={lotId} onUploaded={load} />
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>Add document</Button>
            )}
          </Card>
        )}

        <Card className="p-5 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={traceabilityApi.qrImageUrl(lotId)} alt={`QR code for batch ${lotId}`} className="w-36 h-36 rounded-lg bg-white p-2" />
          <p className="text-xs text-farmly-muted">Opens this batch&apos;s public traceability page.</p>
          <Link href={`/verify/${encodeURIComponent(lotId)}`} target="_blank">
            <Button size="sm" variant="outline" className="gap-1.5">
              Public page <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
