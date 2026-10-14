"use client";

import React, { useState } from "react";
import { ExternalLink, FileText, QrCode, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { traceabilityApi, type CertificateView } from "@/lib/api/traceability";
import {
  CERTIFICATE_TYPE_LABEL,
  StatusPill,
  certificateStatePill,
  chainPill,
  shortHash,
  storagePill,
} from "./certificate-status";
import { VerifyPanel } from "./verify-panel";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-farmly-muted">{label}</dt>
      <dd className="text-xs text-farmly-foreground font-medium break-words">{children}</dd>
    </div>
  );
}

interface CertificateCardProps {
  certificate: CertificateView;
  /** Show retry for holders when storage/registration is incomplete. */
  canRetry?: boolean;
  /** Allow opening the document (private documents need an authenticated session). */
  canViewDocument?: boolean;
  onChanged?: (cert: CertificateView) => void;
  defaultOpen?: boolean;
}

export function CertificateCard({ certificate: cert, canRetry, canViewDocument, onChanged, defaultOpen }: CertificateCardProps) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [busy, setBusy] = useState<"doc" | "retry" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isOrigin = cert.type === "FARMER_ORIGIN";
  const incomplete = !cert.revokedAt && (cert.storageStatus !== "STORED" || cert.chainStatus !== "CONFIRMED");

  const openDocument = async () => {
    setBusy("doc");
    setMessage(null);
    try {
      const { url } = await traceabilityApi.documentLink(cert.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setMessage(e?.message || "Document unavailable");
    } finally {
      setBusy(null);
    }
  };

  const retry = async () => {
    setBusy("retry");
    setMessage(null);
    try {
      const updated = await traceabilityApi.retryCertificate(cert.id);
      onChanged?.(updated);
      setMessage(updated.lastError ? `Still pending: ${updated.lastError}` : "Registration updated");
    } catch (e: any) {
      setMessage(e?.message || "Retry failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-farmly-border bg-farmly-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-farmly-muted">{CERTIFICATE_TYPE_LABEL[cert.type]}</div>
          <div className="text-sm font-semibold text-farmly-foreground font-mono truncate">{cert.id}</div>
          <div className="text-xs text-farmly-muted mt-0.5">
            {isOrigin
              ? [cert.documentKind, cert.certificationClaim].filter(Boolean).join(" · ") || "Supporting document"
              : `${cert.publicMetadata?.quantity ?? ""} ${cert.publicMetadata?.unit ?? ""} to ${cert.subjectDisplayName ?? cert.subjectRole}`}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {certificateStatePill(cert)}
          <ChevronDown className={cn("w-4 h-4 text-farmly-muted transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-farmly-border pt-4">
          <div className="flex flex-wrap gap-1.5">
            {storagePill(cert.storageStatus)}
            {chainPill(cert.chainStatus)}
            {isOrigin && (cert.issuerVerification === "VERIFIED" ? (
              <StatusPill tone="success" label="Issuer verified" />
            ) : (
              <StatusPill tone="info" label="Issuer not verified" />
            ))}
            {cert.version > 1 && <StatusPill tone="neutral" label={`Version ${cert.version}`} />}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {isOrigin ? (
              <>
                <Field label="Batch">{cert.batchId}</Field>
                <Field label="Crop">{[cert.publicMetadata?.crop, cert.publicMetadata?.variety].filter(Boolean).join(" · ") || "—"}</Field>
                <Field label="Registered quantity">
                  {cert.publicMetadata?.originalQuantity ?? "—"} {cert.publicMetadata?.unit ?? ""}
                </Field>
                <Field label="Harvest date">{cert.publicMetadata?.harvestDate || "—"}</Field>
                <Field label="Farmer">
                  {cert.privateMetadata?.farmerName || cert.subjectDisplayName || "—"}
                  {cert.publicMetadata?.district ? `, ${cert.publicMetadata.district}` : ""}
                  {cert.publicMetadata?.state ? `, ${cert.publicMetadata.state}` : ""}
                </Field>
                <Field label="Issuing organization (as stated)">{cert.issuingOrganization || "Not stated"}</Field>
                <Field label="Issued / expires">{[cert.issuedOn, cert.expiresOn].map((d) => d || "—").join(" / ")}</Field>
                <Field label="Document">{cert.fileName || "—"} ({cert.visibility})</Field>
              </>
            ) : (
              <>
                <Field label="Transaction">{cert.transactionId}</Field>
                <Field label="Batch / source batch">{cert.batchId} ← {cert.publicMetadata?.sourceBatchId}</Field>
                <Field label="Custody">
                  {cert.publicMetadata?.previousCustodianRole} → {cert.publicMetadata?.newCustodianRole}
                </Field>
                <Field label="Transferred">{cert.publicMetadata?.transferredAt ? new Date(cert.publicMetadata.transferredAt).toLocaleString() : "—"}</Field>
                {cert.privateMetadata?.pricePerUnit != null && (
                  <Field label="Price (private)">
                    {cert.privateMetadata.currency} {cert.privateMetadata.pricePerUnit} / {cert.publicMetadata?.unit}
                  </Field>
                )}
                <Field label="References">{cert.upstreamCertificateIds.join(" → ") || "—"}</Field>
              </>
            )}
            <Field label="SHA-256">{<span className="font-mono">{shortHash(cert.sha256, 12)}</span>}</Field>
            <Field label="IPFS CID">{<span className="font-mono">{cert.ipfsCid ? shortHash(cert.ipfsCid, 12) : cert.visibility === "private" ? "Private" : "—"}</span>}</Field>
            <Field label="Blockchain transaction">
              {cert.chainTxHash ? (
                cert.explorerUrl ? (
                  <a href={cert.explorerUrl} target="_blank" rel="noopener noreferrer" className="font-mono underline inline-flex items-center gap-1">
                    {shortHash(cert.chainTxHash, 10)} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="font-mono">{shortHash(cert.chainTxHash, 10)}</span>
                )
              ) : (
                "—"
              )}
            </Field>
          </dl>

          {cert.revokedAt && (
            <p className="text-xs text-red-700 dark:text-red-400">
              Revoked {new Date(cert.revokedAt).toLocaleDateString()}: {cert.revocationReason}
            </p>
          )}
          {!isOrigin && (
            <p className="text-[11px] text-farmly-muted">
              Transfer certificates record a change of custody. They do not certify the produce&apos;s quality or origin claims.
            </p>
          )}
          {cert.lastError && incomplete && <p className="text-[11px] text-amber-800 dark:text-amber-300">{cert.lastError}</p>}

          <div className="flex flex-wrap items-center gap-2">
            {canViewDocument && cert.ipfsCid && (
              <Button size="sm" variant="outline" onClick={openDocument} isLoading={busy === "doc"} className="gap-1.5">
                <FileText className="w-3.5 h-3.5" /> View document
              </Button>
            )}
            <a href={traceabilityApi.qrImageUrl(cert.id)} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5" type="button">
                <QrCode className="w-3.5 h-3.5" /> QR code
              </Button>
            </a>
            {canRetry && incomplete && (
              <Button size="sm" variant="secondary" onClick={retry} isLoading={busy === "retry"} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Retry registration
              </Button>
            )}
          </div>
          {message && <p className="text-xs text-farmly-muted">{message}</p>}

          <VerifyPanel certificateId={cert.id} />
        </div>
      )}
    </div>
  );
}
