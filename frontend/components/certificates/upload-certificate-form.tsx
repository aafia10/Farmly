"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { traceabilityApi, type CertificateView } from "@/lib/api/traceability";
import { chainPill, storagePill } from "./certificate-status";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";
const MAX_MB = 10;

interface UploadCertificateFormProps {
  batchId: string;
  /** When set, the upload creates a new version of this certificate. */
  supersedesCertificateId?: string;
  onUploaded?: (cert: CertificateView) => void;
}

export function UploadCertificateForm({ batchId, supersedesCertificateId, onUploaded }: UploadCertificateFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentKind, setDocumentKind] = useState("Harvest record");
  const [issuingOrganization, setIssuingOrganization] = useState("");
  const [certificationClaim, setCertificationClaim] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ certificate: CertificateView; duplicate: boolean } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) return setError("Choose a document to upload.");
    if (!ACCEPT.split(",").includes(file.type)) return setError("Upload a PDF, PNG, JPEG or WebP file.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`The file must be smaller than ${MAX_MB} MB.`);
    if (issuedOn && expiresOn && expiresOn < issuedOn) return setError("Expiry date cannot be before the issue date.");

    setSubmitting(true);
    try {
      const res = await traceabilityApi.uploadOriginCertificate({
        batchId,
        documentKind,
        issuingOrganization: issuingOrganization || undefined,
        certificationClaim: certificationClaim || undefined,
        issuedOn: issuedOn || undefined,
        expiresOn: expiresOn || undefined,
        visibility,
        supersedesCertificateId,
        file,
      });
      setResult(res);
      onUploaded?.(res.certificate);
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cert-file">Certificate document</Label>
        <input
          id="cert-file"
          type="file"
          accept={ACCEPT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-xs text-farmly-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-farmly-surface-elevated file:text-farmly-foreground file:font-medium"
        />
        <p className="text-[11px] text-farmly-muted">PDF or image, up to {MAX_MB} MB. Its SHA-256 fingerprint is registered on the blockchain.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cert-kind">Document type</Label>
          <select
            id="cert-kind"
            value={documentKind}
            onChange={(e) => setDocumentKind(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-sm text-farmly-input-text"
          >
            {["Harvest record", "Organic certificate", "Lab test report", "Quality grading report", "Land record", "Other"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cert-claim">Certification claim (optional)</Label>
          <Input id="cert-claim" placeholder="e.g. Organic (NPOP)" value={certificationClaim} onChange={(e) => setCertificationClaim(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cert-issuer">Issuing organization (optional)</Label>
          <Input id="cert-issuer" placeholder="As printed on the document" value={issuingOrganization} onChange={(e) => setIssuingOrganization(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cert-issued">Issued on</Label>
          <Input id="cert-issued" type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cert-expires">Expires on</Label>
          <Input id="cert-expires" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold text-farmly-foreground">Document visibility</legend>
        {(
          [
            ["private", "Private", "Only signed-in buyers on Farmly can open the file. Recommended if it contains personal details."],
            ["public", "Public", "Anyone scanning the QR code can open the file. Only choose this if it contains nothing private."],
          ] as const
        ).map(([value, label, hint]) => (
          <label key={value} className="flex items-start gap-2.5 text-xs cursor-pointer">
            <input type="radio" name="visibility" value={value} checked={visibility === value} onChange={() => setVisibility(value)} className="mt-0.5 accent-farmly-primary" />
            <span>
              <span className="font-medium text-farmly-foreground">{label}</span>
              <span className="block text-farmly-muted">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <p className="text-[11px] text-farmly-muted">
        Farmly records the document and its claims as you provide them. It does not verify the issuer or the certification itself.
      </p>

      {error && <p role="alert" className="text-xs text-red-700 dark:text-red-400">{error}</p>}

      {result && (
        <div className="p-3 rounded-xl border border-farmly-border bg-farmly-surface-elevated text-xs space-y-2">
          <div className="font-medium text-farmly-foreground">
            {result.duplicate ? "This document was already registered as" : "Saved as"} {result.certificate.id}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {storagePill(result.certificate.storageStatus)}
            {chainPill(result.certificate.chainStatus)}
          </div>
          {result.certificate.chainStatus !== "CONFIRMED" && (
            <p className="text-farmly-muted">
              Blockchain registration is not complete{result.certificate.lastError ? `: ${result.certificate.lastError}` : ""}. You can retry from the certificate card.
            </p>
          )}
        </div>
      )}

      <Button type="submit" isLoading={submitting} className="gap-1.5">
        <Upload className="w-4 h-4" /> {supersedesCertificateId ? "Upload new version" : "Upload certificate"}
      </Button>
    </form>
  );
}
