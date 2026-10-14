"use client";

import React, { useRef, useState } from "react";
import { ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { traceabilityApi, type VerificationResult } from "@/lib/api/traceability";
import { StatusPill, VERIFICATION_COPY, shortHash, verificationPill } from "./certificate-status";

const CHECK_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  MATCH: "success",
  CONFIRMED: "success",
  VERIFIED: "success",
  VALID: "success",
  NO_EXPIRY: "neutral",
  MISMATCH: "danger",
  NOT_REGISTERED: "danger",
  REVOKED: "danger",
  EXPIRED: "danger",
  PENDING: "warning",
  NOT_VERIFIED: "info",
  UNAVAILABLE: "neutral",
  NOT_CHECKED: "neutral",
};

function CheckRow({ title, status, children }: { title: string; status: string; children?: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-farmly-foreground">{title}</span>
        <StatusPill tone={CHECK_TONE[status] ?? "neutral"} label={status.replace(/_/g, " ").toLowerCase()} className="capitalize" />
      </div>
      {children && <div className="mt-1 text-[11px] text-farmly-muted leading-relaxed break-all">{children}</div>}
    </div>
  );
}

export function VerifyPanel({ certificateId }: { certificateId: string }) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (file?: File) => {
    setLoading(true);
    setError(null);
    try {
      setResult(await traceabilityApi.verifyCertificate(certificateId, file));
    } catch (e: any) {
      setError(e?.message || "Verification could not be completed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => run()} isLoading={loading} className="gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Verify certificate
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={loading} className="gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Compare a file
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) run(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-xs text-red-700 dark:text-red-400">{error}</p>}

      {result && (
        <div className="rounded-xl border border-farmly-border bg-farmly-surface-elevated/60 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-farmly-foreground">Result</div>
              <p className="text-xs text-farmly-muted mt-0.5">{VERIFICATION_COPY[result.status].description}</p>
            </div>
            {verificationPill(result.status)}
          </div>

          <div className="divide-y divide-farmly-border">
            <CheckRow title="File integrity (SHA-256)" status={result.checks.fileIntegrity.status}>
              {result.checks.fileIntegrity.source === "uploaded-file" ? "Your file" : "Stored document"}: {shortHash(result.checks.fileIntegrity.computedHash, 12)}
              <br />
              Registered: {shortHash(result.checks.fileIntegrity.expectedHash, 12)}
              {result.checks.fileIntegrity.detail && <><br />{result.checks.fileIntegrity.detail}</>}
            </CheckRow>
            <CheckRow title="Blockchain registration" status={result.checks.blockchain.status}>
              {result.checks.blockchain.txHash ? (
                result.checks.blockchain.explorerUrl ? (
                  <a href={result.checks.blockchain.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    Tx {shortHash(result.checks.blockchain.txHash, 10)}
                  </a>
                ) : (
                  <>Tx {shortHash(result.checks.blockchain.txHash, 10)}</>
                )
              ) : null}
              {result.checks.blockchain.detail && <> {result.checks.blockchain.detail}</>}
            </CheckRow>
            <CheckRow title="Issuer authenticity" status={result.checks.issuer.status}>
              {result.checks.issuer.organization ? `${result.checks.issuer.organization}. ` : ""}
              {result.checks.issuer.detail}
            </CheckRow>
            <CheckRow title="Certification validity" status={result.checks.validity.status}>
              {result.checks.validity.revokedAt && `Revoked: ${result.checks.validity.revocationReason ?? ""}`}
              {!result.checks.validity.revokedAt && result.checks.validity.expiresOn && `Expires ${result.checks.validity.expiresOn}`}
            </CheckRow>
          </div>

          {result.notes.length > 0 && (
            <ul className="text-[11px] text-farmly-muted list-disc pl-4 space-y-0.5">
              {result.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-farmly-muted-dark">Checked {new Date(result.checkedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
