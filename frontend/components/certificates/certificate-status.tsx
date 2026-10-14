import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldQuestion, CircleSlash, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CertificateType, CertificateView, ChainStatus, StorageStatus, VerificationStatus } from "@/lib/api/traceability";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const TONES: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30",
  warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-500/30",
  danger: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-500/30",
  info: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-500/30",
  neutral: "bg-farmly-surface-elevated text-farmly-muted border-farmly-border",
};

const ICONS: Record<Tone, React.ElementType> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  info: ShieldQuestion,
  neutral: CircleSlash,
};

export function StatusPill({ tone, label, className }: { tone: Tone; label: string; className?: string }) {
  const Icon = ICONS[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium whitespace-nowrap", TONES[tone], className)}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

export const CERTIFICATE_TYPE_LABEL: Record<CertificateType, string> = {
  FARMER_ORIGIN: "Farmer origin certificate",
  DISTRIBUTOR_PURCHASE: "Distributor transfer certificate",
  RETAILER_PURCHASE: "Retailer transfer certificate",
};

export function storagePill(status: StorageStatus) {
  if (status === "STORED") return <StatusPill tone="success" label="Stored on IPFS" />;
  if (status === "FAILED") return <StatusPill tone="danger" label="IPFS upload failed" />;
  return <StatusPill tone="warning" label="IPFS upload pending" />;
}

export function chainPill(status: ChainStatus) {
  if (status === "CONFIRMED") return <StatusPill tone="success" label="Registered on-chain" />;
  if (status === "FAILED") return <StatusPill tone="danger" label="Chain registration failed" />;
  if (status === "PENDING") return <StatusPill tone="warning" label="Chain registration pending" />;
  return <StatusPill tone="neutral" label="Not yet registered" />;
}

/** Summary pill for a certificate's recorded state (not a fresh verification). */
export function certificateStatePill(cert: Pick<CertificateView, "revokedAt" | "expired" | "storageStatus" | "chainStatus">) {
  if (cert.revokedAt) return <StatusPill tone="danger" label="Revoked" />;
  if (cert.expired) return <StatusPill tone="danger" label="Expired" />;
  if (cert.chainStatus === "CONFIRMED" && cert.storageStatus === "STORED") {
    return <StatusPill tone="success" label="Registered" />;
  }
  if (cert.chainStatus === "FAILED" || cert.storageStatus === "FAILED") return <StatusPill tone="danger" label="Registration failed" />;
  return <StatusPill tone="warning" label="Pending" />;
}

export const VERIFICATION_COPY: Record<VerificationStatus, { tone: Tone; label: string; description: string }> = {
  VERIFIED: {
    tone: "success",
    label: "Verified",
    description: "The document's SHA-256 hash matches the hash registered on the blockchain.",
  },
  ISSUER_NOT_VERIFIED: {
    tone: "info",
    label: "Issuer not verified",
    description: "The file is intact and registered on-chain, but its issuer has not been independently verified.",
  },
  MISMATCH: {
    tone: "danger",
    label: "Mismatch",
    description: "The document's hash does not match the registered hash. It may have been altered.",
  },
  NOT_REGISTERED: {
    tone: "danger",
    label: "Not registered",
    description: "No matching blockchain registration was found for this certificate.",
  },
  PENDING: {
    tone: "warning",
    label: "Pending",
    description: "Upload or blockchain registration has not completed yet.",
  },
  UNAVAILABLE: {
    tone: "neutral",
    label: "Unavailable",
    description: "IPFS or the blockchain could not be reached, so verification could not be completed.",
  },
  REVOKED: {
    tone: "danger",
    label: "Revoked",
    description: "This certificate has been revoked.",
  },
  EXPIRED: {
    tone: "danger",
    label: "Expired",
    description: "The certificate's expiry date has passed.",
  },
};

export function verificationPill(status: VerificationStatus) {
  const copy = VERIFICATION_COPY[status];
  return <StatusPill tone={copy.tone} label={copy.label} />;
}

export function UnavailableNotice({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-farmly-border bg-farmly-surface-elevated text-xs text-farmly-muted">
      <CloudOff className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function WarningNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function shortHash(hash?: string | null, size = 10) {
  if (!hash) return "—";
  return hash.length <= size * 2 ? hash : `${hash.slice(0, size)}…${hash.slice(-6)}`;
}
