import { backendClient } from "@/lib/api/backendClient";

// Mirrors the backend's certificate/traceability views (backend/src/services/certificateService.ts).

export type CertificateType = "FARMER_ORIGIN" | "DISTRIBUTOR_PURCHASE" | "RETAILER_PURCHASE";
export type StorageStatus = "PENDING" | "STORED" | "FAILED";
export type ChainStatus = "NOT_SUBMITTED" | "PENDING" | "CONFIRMED" | "FAILED";
export type VerificationStatus =
  | "VERIFIED"
  | "MISMATCH"
  | "NOT_REGISTERED"
  | "PENDING"
  | "UNAVAILABLE"
  | "ISSUER_NOT_VERIFIED"
  | "REVOKED"
  | "EXPIRED";

export interface CertificateView {
  id: string;
  type: CertificateType;
  batchId: string;
  rootBatchId: string;
  transactionId: string | null;
  sourceCertificateId: string | null;
  upstreamCertificateIds: string[];
  version: number;
  supersedesCertificateId: string | null;
  subjectRole: string | null;
  subjectDisplayName: string | null;
  documentKind: string | null;
  issuingOrganization: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  certificationClaim: string | null;
  issuerVerification: "NOT_VERIFIED" | "VERIFIED";
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  sha256: string;
  visibility: "public" | "private";
  ipfsCid: string | null;
  storageStatus: StorageStatus;
  chainStatus: ChainStatus;
  chainId: string | null;
  contractAddress: string | null;
  chainTxHash: string | null;
  explorerUrl: string | null;
  chainRegisteredAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  expired: boolean;
  lastError: string | null;
  createdAt: string;
  publicMetadata: Record<string, any>;
  privateMetadata?: Record<string, any>;
  qrUrl: string;
}

export interface BatchView {
  id: string;
  parentBatchId: string | null;
  rootBatchId: string;
  lineagePath: string[];
  crop: string;
  variety: string | null;
  originalQuantity: number;
  availableQuantity: number;
  unit: string;
  ownerRole: string | null;
  ownerDisplayName: string | null;
  status: string;
  qualityGrade: string | null;
  harvestDate: string | null;
  createdAt: string;
  qrUrl: string;
}

export interface TransferView {
  id: string;
  sourceBatchId: string;
  childBatchId: string | null;
  sellerRole: string;
  buyerRole: "distributor" | "retailer";
  buyerName: string | null;
  quantity: number;
  unit: string;
  pricePerUnit?: number | null;
  currency?: string;
  certificateId: string | null;
  status: string;
  lastError?: string | null;
  createdAt: string;
}

export interface BatchTrace {
  batch: BatchView;
  lineage: BatchView[];
  certificates: CertificateView[];
  transfers: TransferView[];
  outgoingTransfers: TransferView[];
  childBatches: BatchView[];
}

export interface PublicTrace {
  focusCertificateId: string | null;
  product: {
    crop: string;
    variety: string | null;
    batchId: string;
    rootBatchId: string;
    quantity: number;
    unit: string;
    harvestDate: string | null;
    registeredAt: string | null;
    qualityGrade: string | null;
  };
  currentCustodian: { role: string | null; displayName: string | null };
  certificates: CertificateView[];
  transfers: TransferView[];
  qrUrl: string;
}

export interface AvailableBatch extends BatchView {
  certificateCount: number;
  latestCertificate: CertificateView | null;
}

export interface VerificationResult {
  certificateId: string;
  certificateType: CertificateType;
  batchId: string;
  transactionId: string | null;
  status: VerificationStatus;
  checks: {
    fileIntegrity: { status: "MATCH" | "MISMATCH" | "UNAVAILABLE" | "NOT_CHECKED"; computedHash: string | null; expectedHash: string; source: string; detail?: string };
    blockchain: { status: string; txHash?: string | null; explorerUrl?: string | null; onChainHash?: string; registeredAt?: string; detail?: string; referencesMatch?: boolean };
    issuer: { status: "NOT_VERIFIED" | "VERIFIED"; organization: string | null; detail: string };
    validity: { status: "VALID" | "REVOKED" | "EXPIRED" | "NO_EXPIRY"; expiresOn: string | null; revokedAt: string | null; revocationReason: string | null };
  };
  notes: string[];
  checkedAt: string;
}

export interface PurchaseResult {
  purchase: TransferView & { idempotency_key?: string };
  certificate: CertificateView | null;
  childBatch: unknown;
}

export interface OriginCertificateRequest {
  batchId: string;
  documentKind: string;
  issuingOrganization?: string;
  issuedOn?: string;
  expiresOn?: string;
  certificationClaim?: string;
  visibility: "public" | "private";
  supersedesCertificateId?: string;
  file: File;
}

export type DashboardData =
  | { role: "farmer"; batches: (BatchView & { certificate: CertificateView | null })[]; transfers: TransferView[] }
  | {
      role: "distributor" | "retailer";
      holdings: BatchView[];
      transfers: TransferView[];
      certificates: CertificateView[];
      availableCount: number;
      available: AvailableBatch[];
    }
  | { role: string };

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function newIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const traceabilityApi = {
  newIdempotencyKey,

  async uploadOriginCertificate(req: OriginCertificateRequest) {
    const { file, ...meta } = req;
    return backendClient.fetchApi<{ certificate: CertificateView; duplicate: boolean }>("/certificates/origin", {
      method: "POST",
      body: JSON.stringify({
        ...meta,
        fileName: file.name,
        mimeType: file.type,
        contentBase64: await fileToBase64(file),
      }),
    });
  },

  /** The idempotency key must be reused when retrying the same purchase. */
  purchase(input: { sourceBatchId: string; quantity: number; pricePerUnit?: number; currency?: string }, idempotencyKey: string) {
    return backendClient.fetchApi<PurchaseResult>("/purchases", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    });
  },

  retryPurchase(purchaseId: string) {
    return backendClient.fetchApi<PurchaseResult>(`/purchases/${encodeURIComponent(purchaseId)}/retry`, { method: "POST" });
  },

  async verifyCertificate(certificateId: string, file?: File) {
    return backendClient.fetchApi<VerificationResult>(`/certificates/${encodeURIComponent(certificateId)}/verify`, {
      method: "POST",
      body: JSON.stringify(file ? { contentBase64: await fileToBase64(file) } : {}),
    });
  },

  retryCertificate(certificateId: string) {
    return backendClient.fetchApi<CertificateView>(`/certificates/${encodeURIComponent(certificateId)}/retry`, { method: "POST" });
  },

  revokeCertificate(certificateId: string, reason: string) {
    return backendClient.fetchApi<CertificateView>(`/certificates/${encodeURIComponent(certificateId)}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  documentLink(certificateId: string) {
    return backendClient.fetchApi<{ url: string; expiresInSeconds: number | null }>(
      `/certificates/${encodeURIComponent(certificateId)}/document`
    );
  },

  batchTrace(batchId: string) {
    return backendClient.fetchApi<BatchTrace>(`/traceability/batches/${encodeURIComponent(batchId)}`);
  },

  publicTrace(id: string) {
    return backendClient.fetchApi<PublicTrace>(`/traceability/public/${encodeURIComponent(id)}`);
  },

  available() {
    return backendClient.fetchApi<AvailableBatch[]>("/traceability/available");
  },

  dashboard() {
    return backendClient.fetchApi<DashboardData>("/traceability/dashboard");
  },

  qrImageUrl(id: string) {
    return `${backendClient.apiBaseUrl()}/traceability/qr/${encodeURIComponent(id)}`;
  },
};
