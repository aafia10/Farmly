import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../config/supabase";
import { env } from "../config/env";
import { AuthUser } from "../types";
import { HttpError } from "../utils/httpError";
import { toUuid } from "../utils/uuid";
import { pinataService, PinataError, PinataNetwork } from "./pinataService";
import { chainService, ChainError, idToBytes32 } from "./chainService";

// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

export type CertificateType = "FARMER_ORIGIN" | "DISTRIBUTOR_PURCHASE" | "RETAILER_PURCHASE";

export interface CertificateRow {
  id: string;
  certificate_type: CertificateType;
  batch_id: string;
  root_batch_id: string;
  transaction_id: string | null;
  source_certificate_id: string | null;
  upstream_certificate_ids: string[];
  version: number;
  supersedes_certificate_id: string | null;
  subject_id: string | null;
  subject_role: string | null;
  subject_display_name: string | null;
  document_kind: string | null;
  issuing_organization: string | null;
  issued_on: string | null;
  expires_on: string | null;
  certification_claim: string | null;
  issuer_verification: "NOT_VERIFIED" | "VERIFIED";
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string;
  visibility: "public" | "private";
  document_body: string | null;
  ipfs_cid: string | null;
  pinata_file_id: string | null;
  storage_status: "PENDING" | "STORED" | "FAILED";
  chain_status: "NOT_SUBMITTED" | "PENDING" | "CONFIRMED" | "FAILED";
  chain_id: string | null;
  contract_address: string | null;
  chain_tx_hash: string | null;
  chain_block_number: number | null;
  chain_registered_at: string | null;
  public_metadata: Record<string, any>;
  private_metadata: Record<string, any>;
  revoked_at: string | null;
  revocation_reason: string | null;
  revocation_tx_hash: string | null;
  last_error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRow {
  id: string;
  idempotency_key: string;
  request_fingerprint: string;
  source_batch_id: string;
  child_batch_id: string | null;
  root_batch_id: string | null;
  seller_id: string | null;
  seller_role: string;
  seller_name: string | null;
  buyer_id: string;
  buyer_role: "distributor" | "retailer";
  buyer_name: string | null;
  quantity: number;
  unit: string;
  price_per_unit: number | null;
  currency: string;
  source_certificate_id: string | null;
  certificate_id: string | null;
  status: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type VerificationStatus =
  | "VERIFIED"
  | "MISMATCH"
  | "NOT_REGISTERED"
  | "PENDING"
  | "UNAVAILABLE"
  | "ISSUER_NOT_VERIFIED"
  | "REVOKED"
  | "EXPIRED";

export interface OriginCertificateInput {
  batchId: string;
  documentKind: string;
  issuingOrganization?: string;
  issuedOn?: string;
  expiresOn?: string;
  certificationClaim?: string;
  visibility: "public" | "private";
  supersedesCertificateId?: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
}

export interface PurchaseInput {
  sourceBatchId: string;
  quantity: number;
  pricePerUnit?: number;
  currency?: string;
}

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

const ALLOWED_DOCUMENT_TYPES: Record<string, (b: Buffer) => boolean> = {
  "application/pdf": (b) => b.subarray(0, 5).toString("latin1") === "%PDF-",
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
};

const PRIVILEGED_ROLES = new Set(["admin"]);

function db(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new HttpError(
      503,
      "Certificate features are not configured: set SUPABASE_SERVICE_ROLE_KEY on the server.",
      "CERTIFICATES_NOT_CONFIGURED"
    );
  }
  return supabaseAdmin;
}

export function sha256Hex(bytes: Buffer | string): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** "Ramesh Patil" -> "Ramesh P." so public pages never show full personal names. */
function publicPersonName(name?: string | null): string | null {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isExpired(cert: Pick<CertificateRow, "expires_on">): boolean {
  return Boolean(cert.expires_on && cert.expires_on < today());
}

async function logEvent(
  entityType: "purchase" | "certificate" | "batch",
  entityId: string,
  eventType: string,
  details: Record<string, any> = {},
  actorId?: string | null
): Promise<void> {
  const { error } = await db()
    .from("traceability_events")
    .insert({ entity_type: entityType, entity_id: entityId, event_type: eventType, details, actor_id: actorId ?? null });
  if (error) console.error(`[traceability] failed to log ${eventType} for ${entityId}:`, error.message);
}

async function getBatch(batchId: string): Promise<any> {
  const { data, error } = await db().from("batches").select("*").eq("id", batchId).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, `Batch ${batchId} not found`, "BATCH_NOT_FOUND");
  return data;
}

async function getCertificateRow(certificateId: string): Promise<CertificateRow> {
  const { data, error } = await db().from("certificates").select("*").eq("id", certificateId).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, `Certificate ${certificateId} not found`, "CERTIFICATE_NOT_FOUND");
  return data as CertificateRow;
}

async function updateCertificate(id: string, patch: Partial<CertificateRow>): Promise<CertificateRow> {
  const { data, error } = await db().from("certificates").update(patch).eq("id", id).select("*").single();
  if (error) throw new HttpError(500, `Could not update certificate ${id}: ${error.message}`);
  return data as CertificateRow;
}

async function updatePurchase(id: string, patch: Partial<PurchaseRow>): Promise<PurchaseRow> {
  const { data, error } = await db().from("purchases").update(patch).eq("id", id).select("*").single();
  if (error) throw new HttpError(500, `Could not update purchase ${id}: ${error.message}`);
  return data as PurchaseRow;
}

/** A farmer owns a root batch through any of the identifiers the existing lot APIs store. */
async function isBatchOwner(batch: any, user: AuthUser): Promise<boolean> {
  const ids = new Set([batch.owner_id, batch.farmer_id, batch.user_id, batch.farmer_registry_id].filter(Boolean));
  if (ids.has(user.id)) return true;
  if (batch.farmer_registry_id) {
    const { data } = await db().from("farmers").select("profile_id").eq("id", batch.farmer_registry_id).maybeSingle();
    if (data?.profile_id && data.profile_id === user.id) return true;
  }
  return false;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_ID_RE = /^[\w.@-]+$/;

/** PostgREST `or` filter matching the batches a farmer owns (same identifiers as isBatchOwner). */
async function farmerOwnershipFilter(user: AuthUser): Promise<string> {
  if (!SAFE_ID_RE.test(user.id)) throw new HttpError(400, "Invalid user identifier");
  const clauses = [`owner_id.eq.${user.id}`, `farmer_registry_id.eq.${user.id}`];
  if (UUID_RE.test(user.id)) {
    clauses.push(`farmer_id.eq.${user.id}`, `user_id.eq.${user.id}`);
    const { data: registries } = await db().from("farmers").select("id").eq("profile_id", user.id);
    for (const r of registries || []) if (SAFE_ID_RE.test(r.id)) clauses.push(`farmer_registry_id.eq.${r.id}`);
  }
  return clauses.join(",");
}

function isParty(cert: CertificateRow, user?: AuthUser | null): boolean {
  if (!user) return false;
  return PRIVILEGED_ROLES.has(user.role) || cert.subject_id === user.id || cert.created_by === user.id;
}

// ------------------------------------------------------------------------------
// Storage + chain processing (shared by origin and purchase certificates)
// ------------------------------------------------------------------------------

/** Uploads a generated certificate document that is still pending storage. */
async function storeGeneratedDocument(cert: CertificateRow, actorId?: string | null): Promise<CertificateRow> {
  if (cert.storage_status === "STORED" || !cert.document_body) return cert;
  if (!pinataService.isConfigured()) {
    return updateCertificate(cert.id, { last_error: "IPFS storage pending: Pinata is not configured" });
  }

  try {
    const upload = await pinataService.upload(Buffer.from(cert.document_body, "utf8"), {
      fileName: cert.file_name || `${cert.id}.json`,
      mimeType: cert.mime_type || "application/json",
      network: cert.visibility as PinataNetwork,
    });
    const updated = await updateCertificate(cert.id, {
      ipfs_cid: upload.cid,
      pinata_file_id: upload.fileId,
      storage_status: "STORED",
      last_error: null,
    });
    await logEvent("certificate", cert.id, "IPFS_STORED", { cid: upload.cid, network: upload.network }, actorId);
    return updated;
  } catch (err) {
    const message = errorMessage(err);
    await logEvent("certificate", cert.id, "IPFS_FAILED", { error: message }, actorId);
    return updateCertificate(cert.id, {
      storage_status: err instanceof PinataError && !err.retryable ? "FAILED" : "PENDING",
      last_error: message,
    });
  }
}

/** Registers the certificate proof on-chain, reconciling with chain state first. */
async function registerOnChain(cert: CertificateRow, actorId?: string | null): Promise<CertificateRow> {
  if (cert.chain_status === "CONFIRMED") return cert;
  if (cert.storage_status !== "STORED" || !cert.ipfs_cid) return cert;
  if (!chainService.isWritable()) {
    return updateCertificate(cert.id, {
      last_error: "Blockchain registration pending: chain is not configured on the server",
    });
  }

  // A previous attempt may have reached the chain without the database being updated.
  try {
    const existing = await chainService.getRecord(cert.id);
    if (existing.exists) {
      if (existing.certificateHash !== cert.sha256) {
        const message = "On-chain record exists with a different hash; manual review required";
        await logEvent("certificate", cert.id, "CHAIN_CONFLICT", { onChainHash: existing.certificateHash }, actorId);
        return updateCertificate(cert.id, { chain_status: "FAILED", last_error: message });
      }
      const reconciled = await updateCertificate(cert.id, {
        chain_status: "CONFIRMED",
        chain_registered_at: new Date(existing.registeredAt * 1000).toISOString(),
        contract_address: env.CERT_REGISTRY_ADDRESS || null,
        chain_id: env.CHAIN_ID || null,
        last_error: null,
      });
      await logEvent("certificate", cert.id, "CHAIN_RECONCILED", { registeredAt: existing.registeredAt }, actorId);
      return reconciled;
    }
  } catch (err) {
    return updateCertificate(cert.id, { last_error: errorMessage(err) });
  }

  await updateCertificate(cert.id, { chain_status: "PENDING", last_error: null });
  await logEvent("certificate", cert.id, "CHAIN_SUBMITTED", {}, actorId);

  try {
    const reg = await chainService.register({
      certificateId: cert.id,
      batchId: cert.batch_id,
      transactionId: cert.transaction_id,
      sourceCertificateId: cert.source_certificate_id,
      sha256Hex: cert.sha256,
      ipfsCid: cert.ipfs_cid,
    });
    const updated = await updateCertificate(cert.id, {
      chain_status: "CONFIRMED",
      chain_tx_hash: reg.txHash,
      chain_block_number: reg.blockNumber,
      chain_id: reg.chainId,
      contract_address: reg.contractAddress,
      chain_registered_at: new Date().toISOString(),
      last_error: null,
    });
    await logEvent("certificate", cert.id, "CHAIN_CONFIRMED", { txHash: reg.txHash, block: reg.blockNumber }, actorId);
    return updated;
  } catch (err) {
    const message = errorMessage(err);
    await logEvent("certificate", cert.id, "CHAIN_FAILED", { error: message }, actorId);
    return updateCertificate(cert.id, {
      chain_status: err instanceof ChainError && !err.retryable ? "FAILED" : "PENDING",
      last_error: message,
    });
  }
}

/** Keeps the purchase lifecycle status in step with its certificate. */
async function syncPurchaseStatus(purchaseId: string, cert: CertificateRow, actorId?: string | null) {
  let status = "CERTIFICATE_GENERATED";
  if (cert.storage_status === "STORED") status = "IPFS_STORED";
  if (cert.chain_status === "CONFIRMED") status = "TRACEABILITY_UPDATED";
  const purchase = await updatePurchase(purchaseId, {
    status,
    last_error: cert.last_error,
  });
  if (status === "TRACEABILITY_UPDATED") {
    await logEvent("purchase", purchaseId, "TRACEABILITY_UPDATED", { certificateId: cert.id }, actorId);
  }
  return purchase;
}

async function processCertificate(cert: CertificateRow, actorId?: string | null): Promise<CertificateRow> {
  let current = await storeGeneratedDocument(cert, actorId);
  current = await registerOnChain(current, actorId);
  if (current.transaction_id) await syncPurchaseStatus(current.transaction_id, current, actorId);
  return current;
}

// ------------------------------------------------------------------------------
// Origin (farmer) certificates
// ------------------------------------------------------------------------------

async function createOriginCertificate(user: AuthUser, input: OriginCertificateInput) {
  const batch = await getBatch(input.batchId);
  if (batch.parent_lot_id) {
    throw new HttpError(400, "Origin certificates can only be attached to an original (farmer) batch");
  }

  const allowed =
    PRIVILEGED_ROLES.has(user.role) ||
    (user.role === "farmer" && (await isBatchOwner(batch, user))) ||
    (user.role === "helper" &&
      (batch.created_by === user.id || (Boolean(batch.assisted_by_helper_id) && batch.assisted_by_helper_id === toUuid(user.id))));
  if (!allowed) throw new HttpError(403, "Only the batch's farmer or an assisting field helper can add its certificate");

  const mime = input.mimeType.toLowerCase();
  const signatureCheck = ALLOWED_DOCUMENT_TYPES[mime];
  if (!signatureCheck) throw new HttpError(400, "Unsupported file type. Upload a PDF, PNG, JPEG or WebP document.");

  const bytes = Buffer.from(input.contentBase64, "base64");
  const maxBytes = env.CERT_MAX_FILE_MB * 1024 * 1024;
  if (bytes.length === 0) throw new HttpError(400, "The uploaded file is empty");
  if (bytes.length > maxBytes) throw new HttpError(413, `File exceeds the ${env.CERT_MAX_FILE_MB} MB limit`);
  if (!signatureCheck(bytes)) throw new HttpError(400, "File content does not match its declared type");
  if (input.expiresOn && input.issuedOn && input.expiresOn < input.issuedOn) {
    throw new HttpError(400, "Expiry date cannot be before the issue date");
  }

  const hash = sha256Hex(bytes);

  // Duplicate submission of the same document: return the existing record (and resume any pending steps).
  const { data: duplicate } = await db()
    .from("certificates")
    .select("*")
    .eq("batch_id", batch.id)
    .eq("certificate_type", "FARMER_ORIGIN")
    .eq("sha256", hash)
    .maybeSingle();
  if (duplicate) {
    const resumed = await processCertificate(duplicate as CertificateRow, user.id);
    return { certificate: resumed, duplicate: true };
  }

  let version = 1;
  if (input.supersedesCertificateId) {
    const previous = await getCertificateRow(input.supersedesCertificateId);
    if (previous.batch_id !== batch.id || previous.certificate_type !== "FARMER_ORIGIN") {
      throw new HttpError(400, "A new version must replace an origin certificate of the same batch");
    }
    version = previous.version + 1;
  }

  if (!pinataService.isConfigured()) {
    throw new HttpError(503, "Certificate storage is unavailable: Pinata is not configured on the server", "IPFS_UNAVAILABLE");
  }

  // Upload first: nothing is recorded as stored unless Pinata confirms it with a CID.
  let upload;
  try {
    upload = await pinataService.upload(bytes, {
      fileName: input.fileName,
      mimeType: mime,
      network: input.visibility,
    });
  } catch (err) {
    await logEvent("batch", batch.id, "ORIGIN_UPLOAD_FAILED", { error: errorMessage(err), sha256: hash }, user.id);
    throw new HttpError(502, `Certificate upload failed: ${errorMessage(err)}`, "IPFS_UPLOAD_FAILED");
  }

  let farmer: any = null;
  if (batch.farmer_registry_id) {
    const { data } = await db()
      .from("farmers")
      .select("id, name, village, district, state, farming_category")
      .eq("id", batch.farmer_registry_id)
      .maybeSingle();
    farmer = data;
  }

  const certificateId = newId("CERT-FARM");
  const row = {
    id: certificateId,
    certificate_type: "FARMER_ORIGIN",
    batch_id: batch.id,
    root_batch_id: batch.root_batch_id || batch.id,
    upstream_certificate_ids: [],
    version,
    supersedes_certificate_id: input.supersedesCertificateId || null,
    subject_id: batch.owner_id || batch.farmer_registry_id,
    subject_role: "farmer",
    subject_display_name: batch.farmer_name || farmer?.name || null,
    document_kind: input.documentKind,
    issuing_organization: input.issuingOrganization || null,
    issued_on: input.issuedOn || null,
    expires_on: input.expiresOn || null,
    certification_claim: input.certificationClaim || null,
    file_name: input.fileName,
    mime_type: mime,
    size_bytes: bytes.length,
    sha256: hash,
    visibility: input.visibility,
    ipfs_cid: upload.cid,
    pinata_file_id: upload.fileId,
    storage_status: "STORED",
    public_metadata: {
      crop: batch.crop || batch.crop_type,
      variety: batch.variety,
      originalQuantity: Number(batch.original_quantity ?? batch.harvest_quantity ?? batch.quantity),
      unit: batch.unit || "kg",
      harvestDate: batch.harvest_date || null,
      qualityGrade: batch.quality_grade || null,
      farmerPublicName: publicPersonName(batch.farmer_name || farmer?.name),
      farmerPublicId: batch.farmer_registry_id || null,
      district: farmer?.district || null,
      state: farmer?.state || null,
      farmingCategory: farmer?.farming_category || null,
      registeredAt: batch.created_at,
    },
    private_metadata: {
      farmerName: batch.farmer_name || farmer?.name || null,
      village: farmer?.village || null,
      location: batch.location || null,
    },
    created_by: user.id,
  };

  const { data: inserted, error } = await db().from("certificates").insert(row).select("*").single();
  if (error) {
    if (error.code === "23505") {
      // Concurrent duplicate submission of the same document.
      const { data: existing } = await db()
        .from("certificates")
        .select("*")
        .eq("batch_id", batch.id)
        .eq("certificate_type", "FARMER_ORIGIN")
        .eq("sha256", hash)
        .single();
      return { certificate: existing as CertificateRow, duplicate: true };
    }
    throw new HttpError(500, `Uploaded to IPFS (CID ${upload.cid}) but could not save the record: ${error.message}`);
  }

  await logEvent("certificate", certificateId, "CREATED", { type: "FARMER_ORIGIN", batchId: batch.id, sha256: hash }, user.id);
  await logEvent("certificate", certificateId, "IPFS_STORED", { cid: upload.cid, network: upload.network }, user.id);
  if (input.supersedesCertificateId) {
    await logEvent("certificate", input.supersedesCertificateId, "SUPERSEDED", { by: certificateId }, user.id);
  }

  const certificate = await registerOnChain(inserted as CertificateRow, user.id);
  return { certificate, duplicate: false };
}

// ------------------------------------------------------------------------------
// Purchases and transaction certificates
// ------------------------------------------------------------------------------

const PURCHASE_ERRORS: Record<string, [number, string]> = {
  FARMLY_INVALID_QUANTITY: [400, "Quantity must be greater than zero"],
  FARMLY_BUYER_ROLE_NOT_ALLOWED: [403, "Only distributors and retailers can purchase"],
  FARMLY_BATCH_NOT_FOUND: [404, "Batch not found"],
  FARMLY_SELLER_NOT_ALLOWED: [403, "Distributors buy from farmers; retailers buy from distributors"],
  FARMLY_SELF_PURCHASE: [400, "You cannot purchase your own batch"],
  FARMLY_INSUFFICIENT_QUANTITY: [409, "Not enough quantity available in this batch"],
  FARMLY_SOURCE_CERTIFICATE_REQUIRED: [409, "This batch has no active certificate yet and cannot be purchased"],
  FARMLY_IDEMPOTENCY_CONFLICT: [409, "This idempotency key was already used for a different purchase"],
  FARMLY_IDEMPOTENCY_KEY_REQUIRED: [400, "A valid Idempotency-Key header is required"],
};

function purchaseCertificateDocument(input: {
  certificateId: string;
  certificateType: CertificateType;
  purchase: PurchaseRow;
  childBatch: any;
  sourceCertificate: CertificateRow;
  upstream: string[];
}): string {
  const { purchase, childBatch } = input;
  // Fixed key order: this exact string is hashed, stored on IPFS and registered on-chain.
  const document = {
    schema: "farmly.transaction-certificate/v1",
    certificateId: input.certificateId,
    certificateType: input.certificateType,
    transactionId: purchase.id,
    recordedAt: purchase.created_at,
    product: {
      crop: childBatch.crop || childBatch.crop_type,
      variety: childBatch.variety,
    },
    batch: {
      batchId: purchase.child_batch_id,
      sourceBatchId: purchase.source_batch_id,
      rootBatchId: purchase.root_batch_id,
      quantity: Number(purchase.quantity),
      unit: purchase.unit,
    },
    custody: {
      previousCustodianRole: purchase.seller_role,
      newCustodianRole: purchase.buyer_role,
      newCustodianName: purchase.buyer_name,
    },
    references: {
      sourceCertificateId: input.sourceCertificate.id,
      originCertificateId: input.upstream[0],
      upstreamCertificateIds: input.upstream,
    },
    statement:
      "This certificate records a transfer of custody between Farmly participants. It does not independently " +
      "certify the origin, quality, organic status or government approval of the produce; those claims rest on " +
      "the referenced origin certificate.",
  };
  return JSON.stringify(document, null, 2);
}

async function ensurePurchaseCertificate(purchase: PurchaseRow, actorId: string): Promise<CertificateRow> {
  if (purchase.certificate_id) return getCertificateRow(purchase.certificate_id);

  if (!purchase.source_certificate_id || !purchase.child_batch_id) {
    throw new HttpError(500, `Purchase ${purchase.id} is missing its source certificate or child batch`);
  }
  const [sourceCertificate, childBatch] = await Promise.all([
    getCertificateRow(purchase.source_certificate_id),
    getBatch(purchase.child_batch_id),
  ]);

  const upstream = [...(sourceCertificate.upstream_certificate_ids || []), sourceCertificate.id];
  const certificateType: CertificateType = purchase.buyer_role === "distributor" ? "DISTRIBUTOR_PURCHASE" : "RETAILER_PURCHASE";
  const certificateId = newId(certificateType === "DISTRIBUTOR_PURCHASE" ? "CERT-DIST" : "CERT-RET");
  const body = purchaseCertificateDocument({ certificateId, certificateType, purchase, childBatch, sourceCertificate, upstream });

  const row = {
    id: certificateId,
    certificate_type: certificateType,
    batch_id: purchase.child_batch_id,
    root_batch_id: purchase.root_batch_id || purchase.source_batch_id,
    transaction_id: purchase.id,
    source_certificate_id: sourceCertificate.id,
    upstream_certificate_ids: upstream,
    subject_id: purchase.buyer_id,
    subject_role: purchase.buyer_role,
    subject_display_name: purchase.buyer_name,
    document_kind: "Transaction certificate",
    file_name: `${certificateId}.json`,
    mime_type: "application/json",
    size_bytes: Buffer.byteLength(body, "utf8"),
    sha256: sha256Hex(body),
    visibility: "public",
    document_body: body,
    storage_status: "PENDING",
    public_metadata: {
      crop: childBatch.crop || childBatch.crop_type,
      variety: childBatch.variety,
      quantity: Number(purchase.quantity),
      unit: purchase.unit,
      sourceBatchId: purchase.source_batch_id,
      previousCustodianRole: purchase.seller_role,
      newCustodianRole: purchase.buyer_role,
      newCustodianName: purchase.buyer_name,
      transferredAt: purchase.created_at,
    },
    private_metadata: {
      pricePerUnit: purchase.price_per_unit,
      currency: purchase.currency,
      sellerId: purchase.seller_id,
      sellerName: purchase.seller_name,
    },
    created_by: actorId,
  };

  const { data, error } = await db().from("certificates").insert(row).select("*").single();
  if (error) {
    if (error.code === "23505") {
      // Another request created the certificate for this transaction first.
      const { data: existing } = await db().from("certificates").select("*").eq("transaction_id", purchase.id).single();
      return existing as CertificateRow;
    }
    throw new HttpError(500, `Could not create certificate for ${purchase.id}: ${error.message}`);
  }

  await updatePurchase(purchase.id, { certificate_id: certificateId, status: "CERTIFICATE_GENERATED" });
  await logEvent("certificate", certificateId, "CREATED", { type: certificateType, transactionId: purchase.id }, actorId);
  return data as CertificateRow;
}

async function createPurchase(user: AuthUser, input: PurchaseInput, idempotencyKey: string) {
  if (user.role !== "distributor" && user.role !== "retailer") {
    throw new HttpError(403, "Only distributors and retailers can purchase");
  }

  const fingerprint = sha256Hex(
    JSON.stringify([user.id, input.sourceBatchId, input.quantity, input.pricePerUnit ?? null, input.currency ?? "INR"])
  );

  const { data, error } = await db().rpc("farmly_purchase_batch", {
    p_idempotency_key: `${user.id}:${idempotencyKey}`,
    p_fingerprint: fingerprint,
    p_source_batch_id: input.sourceBatchId,
    p_buyer_id: user.id,
    p_buyer_role: user.role,
    p_buyer_name: user.organization || user.fullName,
    p_quantity: input.quantity,
    p_price_per_unit: input.pricePerUnit ?? null,
    p_currency: input.currency || "INR",
  });

  if (error) {
    const known = Object.keys(PURCHASE_ERRORS).find((code) => error.message?.includes(code));
    if (known) {
      const [status, message] = PURCHASE_ERRORS[known];
      throw new HttpError(status, message, known);
    }
    if (error.code === "23505") {
      // Concurrent request with the same idempotency key won the race; return its result.
      const { data: existing } = await db()
        .from("purchases")
        .select("*")
        .eq("idempotency_key", `${user.id}:${idempotencyKey}`)
        .maybeSingle();
      if (existing) return finishPurchase(existing as PurchaseRow, user);
    }
    throw new HttpError(500, `Purchase failed: ${error.message}`);
  }

  return finishPurchase(data as PurchaseRow, user);
}

async function finishPurchase(purchase: PurchaseRow, user: AuthUser) {
  let certificate: CertificateRow | null = null;
  try {
    certificate = await ensurePurchaseCertificate(purchase, user.id);
    certificate = await processCertificate(certificate, user.id);
  } catch (err) {
    // The purchase itself is committed; record the failure so it can be retried.
    const message = errorMessage(err);
    await updatePurchase(purchase.id, { last_error: message }).catch(() => undefined);
    await logEvent("purchase", purchase.id, "CERTIFICATE_STEP_FAILED", { error: message }, user.id);
  }

  const { data: fresh } = await db().from("purchases").select("*").eq("id", purchase.id).single();
  const childBatch = purchase.child_batch_id ? await getBatch(purchase.child_batch_id) : null;
  return { purchase: fresh as PurchaseRow, certificate, childBatch };
}

// ------------------------------------------------------------------------------
// Retry, revoke
// ------------------------------------------------------------------------------

async function retryCertificate(certificateId: string, user: AuthUser) {
  const cert = await getCertificateRow(certificateId);
  if (!isParty(cert, user)) throw new HttpError(403, "Only the certificate holder can retry its registration");
  if (cert.revoked_at) throw new HttpError(409, "Revoked certificates are not re-registered");
  await logEvent("certificate", cert.id, "RETRY_REQUESTED", {}, user.id);
  return processCertificate(cert, user.id);
}

async function retryPurchase(purchaseId: string, user: AuthUser) {
  const { data, error } = await db().from("purchases").select("*").eq("id", purchaseId).maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(404, "Purchase not found");
  const purchase = data as PurchaseRow;
  if (purchase.buyer_id !== user.id && !PRIVILEGED_ROLES.has(user.role)) {
    throw new HttpError(403, "Only the buyer can retry this purchase's certificate");
  }
  return finishPurchase(purchase, user);
}

async function revokeCertificate(certificateId: string, reason: string, user: AuthUser) {
  const cert = await getCertificateRow(certificateId);
  if (!isParty(cert, user)) throw new HttpError(403, "Only the certificate holder can revoke it");
  if (cert.revoked_at) return cert;

  let updated = await updateCertificate(cert.id, { revoked_at: new Date().toISOString(), revocation_reason: reason });
  await logEvent("certificate", cert.id, "REVOKED", { reason }, user.id);

  if (cert.chain_status === "CONFIRMED") {
    if (chainService.isWritable()) {
      try {
        const txHash = await chainService.revoke(cert.id, reason);
        updated = await updateCertificate(cert.id, { revocation_tx_hash: txHash, last_error: null });
        await logEvent("certificate", cert.id, "CHAIN_REVOKED", { txHash }, user.id);
      } catch (err) {
        updated = await updateCertificate(cert.id, { last_error: `Revocation not yet on-chain: ${errorMessage(err)}` });
        await logEvent("certificate", cert.id, "CHAIN_REVOCATION_FAILED", { error: errorMessage(err) }, user.id);
      }
    } else {
      updated = await updateCertificate(cert.id, { last_error: "Revocation recorded; on-chain revocation pending configuration" });
    }
  }
  return updated;
}

// ------------------------------------------------------------------------------
// Verification
// ------------------------------------------------------------------------------

async function verifyCertificate(certificateId: string, providedFile?: Buffer) {
  const cert = await getCertificateRow(certificateId);
  const notes: string[] = [];

  // 1. File integrity: hash the stored document (or a file supplied by the user).
  let fileIntegrity: { status: "MATCH" | "MISMATCH" | "UNAVAILABLE" | "NOT_CHECKED"; computedHash: string | null; source: string; detail?: string } = {
    status: "NOT_CHECKED",
    computedHash: null,
    source: providedFile ? "uploaded-file" : "ipfs",
  };
  let computed: string | null = null;
  if (providedFile) {
    computed = sha256Hex(providedFile);
  } else if (cert.ipfs_cid) {
    try {
      computed = sha256Hex(await pinataService.download(cert.ipfs_cid, cert.visibility));
    } catch (err) {
      fileIntegrity = { ...fileIntegrity, status: "UNAVAILABLE", detail: errorMessage(err) };
    }
  } else {
    fileIntegrity = { ...fileIntegrity, status: "UNAVAILABLE", detail: "Document has not been stored on IPFS yet" };
  }

  // 2. Blockchain registration.
  let blockchain: Record<string, any> = {
    status: "NOT_REGISTERED",
    txHash: cert.chain_tx_hash,
    explorerUrl: chainService.explorerTxUrl(cert.chain_tx_hash),
    chainId: cert.chain_id,
  };
  let onChainHash: string | null = null;
  let referencesMatch = true;
  let revokedOnChain = false;
  if (!chainService.isReadable()) {
    blockchain = { ...blockchain, status: "UNAVAILABLE", detail: "Blockchain is not configured on the server" };
  } else {
    try {
      const record = await chainService.getRecord(cert.id);
      if (record.exists) {
        onChainHash = record.certificateHash;
        revokedOnChain = record.revoked;
        referencesMatch =
          record.batchId === idToBytes32(cert.batch_id) &&
          record.transactionId === idToBytes32(cert.transaction_id) &&
          record.sourceCertificateId === idToBytes32(cert.source_certificate_id) &&
          record.ipfsCid === cert.ipfs_cid;
        blockchain = {
          ...blockchain,
          status: "CONFIRMED",
          onChainHash,
          registeredAt: new Date(record.registeredAt * 1000).toISOString(),
          registeredBy: record.registeredBy,
          referencesMatch,
          revokedOnChain,
        };
      } else {
        blockchain = {
          ...blockchain,
          status: cert.chain_status === "CONFIRMED" ? "NOT_REGISTERED" : "PENDING",
          detail:
            cert.chain_status === "CONFIRMED"
              ? "Database says registered, but no on-chain record was found"
              : "Registration has not completed yet",
        };
      }
    } catch (err) {
      blockchain = { ...blockchain, status: "UNAVAILABLE", detail: errorMessage(err) };
    }
  }

  const expectedHash = onChainHash ?? cert.sha256;
  if (computed) {
    fileIntegrity = { ...fileIntegrity, computedHash: computed, status: computed === expectedHash ? "MATCH" : "MISMATCH" };
  }

  // 3. Issuer authenticity and 4. certification validity are reported separately.
  const issuer = {
    status: cert.issuer_verification,
    organization: cert.issuing_organization,
    detail:
      cert.certificate_type === "FARMER_ORIGIN"
        ? cert.issuer_verification === "VERIFIED"
          ? "Issuer independently verified by the platform"
          : "The issuing organization has not been independently verified; the claim is as uploaded by the farmer"
        : "Generated by Farmly to record a transfer; it makes no quality or certification claim",
  };
  const revoked = Boolean(cert.revoked_at) || revokedOnChain;
  const validity = {
    status: revoked ? "REVOKED" : isExpired(cert) ? "EXPIRED" : cert.expires_on ? "VALID" : "NO_EXPIRY",
    expiresOn: cert.expires_on,
    revokedAt: cert.revoked_at,
    revocationReason: cert.revocation_reason,
  };

  // Overall status, most severe first. VERIFIED needs both a matching file hash and a confirmed on-chain record.
  let status: VerificationStatus;
  if (revoked) status = "REVOKED";
  else if (fileIntegrity.status === "MISMATCH" || (onChainHash && onChainHash !== cert.sha256) || !referencesMatch) status = "MISMATCH";
  else if (blockchain.status === "NOT_REGISTERED") status = "NOT_REGISTERED";
  else if (blockchain.status === "PENDING" || cert.storage_status !== "STORED") status = "PENDING";
  else if (blockchain.status === "UNAVAILABLE" || fileIntegrity.status === "UNAVAILABLE") status = "UNAVAILABLE";
  else if (validity.status === "EXPIRED") status = "EXPIRED";
  else if (cert.certificate_type === "FARMER_ORIGIN" && cert.issuer_verification !== "VERIFIED") status = "ISSUER_NOT_VERIFIED";
  else status = "VERIFIED";

  if (!referencesMatch) notes.push("On-chain batch/transaction references do not match this record");
  if (status === "ISSUER_NOT_VERIFIED") {
    notes.push("The document is intact and registered, but its issuer has not been independently verified.");
  }
  if (cert.certificate_type !== "FARMER_ORIGIN") {
    notes.push("A transaction certificate proves a recorded transfer, not the produce's quality or certification.");
  }

  return {
    certificateId: cert.id,
    certificateType: cert.certificate_type,
    batchId: cert.batch_id,
    transactionId: cert.transaction_id,
    status,
    checks: {
      fileIntegrity: { ...fileIntegrity, expectedHash },
      blockchain,
      issuer,
      validity,
    },
    notes,
    checkedAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------------------
// Queries: certificate chain, public journey, dashboards
// ------------------------------------------------------------------------------

/**
 * Restricted metadata for signed-in participants. Commercial terms (price, seller) are only
 * shown to the parties of that transfer.
 */
function privateMetadataFor(cert: CertificateRow, viewer?: AuthUser | null) {
  const meta = { ...(cert.private_metadata || {}) };
  if (cert.certificate_type !== "FARMER_ORIGIN") {
    const isPartyToTransfer = Boolean(
      viewer &&
        (PRIVILEGED_ROLES.has(viewer.role) ||
          viewer.id === cert.subject_id ||
          viewer.id === cert.created_by ||
          viewer.id === meta.sellerId)
    );
    if (!isPartyToTransfer) {
      delete meta.pricePerUnit;
      delete meta.currency;
      delete meta.sellerId;
      delete meta.sellerName;
    }
  }
  return meta;
}

function certificateView(cert: CertificateRow, opts: { includePrivate: boolean; viewer?: AuthUser | null }) {
  return {
    id: cert.id,
    type: cert.certificate_type,
    batchId: cert.batch_id,
    rootBatchId: cert.root_batch_id,
    transactionId: cert.transaction_id,
    sourceCertificateId: cert.source_certificate_id,
    upstreamCertificateIds: cert.upstream_certificate_ids,
    version: cert.version,
    supersedesCertificateId: cert.supersedes_certificate_id,
    subjectRole: cert.subject_role,
    subjectDisplayName: cert.subject_role === "farmer" ? cert.public_metadata?.farmerPublicName ?? null : cert.subject_display_name,
    documentKind: cert.document_kind,
    issuingOrganization: cert.issuing_organization,
    issuedOn: cert.issued_on,
    expiresOn: cert.expires_on,
    certificationClaim: cert.certification_claim,
    issuerVerification: cert.issuer_verification,
    fileName: cert.file_name,
    mimeType: cert.mime_type,
    sizeBytes: cert.size_bytes,
    sha256: cert.sha256,
    visibility: cert.visibility,
    ipfsCid: cert.visibility === "public" || opts.includePrivate ? cert.ipfs_cid : null,
    storageStatus: cert.storage_status,
    chainStatus: cert.chain_status,
    chainId: cert.chain_id,
    contractAddress: cert.contract_address,
    chainTxHash: cert.chain_tx_hash,
    explorerUrl: chainService.explorerTxUrl(cert.chain_tx_hash),
    chainRegisteredAt: cert.chain_registered_at,
    revokedAt: cert.revoked_at,
    revocationReason: cert.revocation_reason,
    expired: isExpired(cert),
    lastError: opts.includePrivate ? cert.last_error : null,
    createdAt: cert.created_at,
    publicMetadata: cert.public_metadata,
    privateMetadata: opts.includePrivate ? privateMetadataFor(cert, opts.viewer) : undefined,
    qrUrl: traceUrl(cert.id),
  };
}

function batchView(batch: any) {
  return {
    id: batch.id,
    parentBatchId: batch.parent_lot_id,
    rootBatchId: batch.root_batch_id || batch.id,
    lineagePath: batch.lineage_path || [batch.id],
    crop: batch.crop || batch.crop_type,
    variety: batch.variety,
    originalQuantity: Number(batch.original_quantity ?? batch.harvest_quantity ?? batch.quantity ?? 0),
    availableQuantity: Number(batch.quantity ?? 0),
    unit: batch.unit || "kg",
    ownerRole: batch.owner_role,
    ownerDisplayName: batch.owner_role === "farmer" ? publicPersonName(batch.farmer_name) : batch.current_owner_name,
    status: batch.status,
    qualityGrade: batch.quality_grade,
    harvestDate: batch.harvest_date,
    createdAt: batch.created_at,
    qrUrl: traceUrl(batch.id),
  };
}

function purchaseView(p: PurchaseRow, user?: AuthUser | null) {
  const canSeeTerms = Boolean(
    user && (PRIVILEGED_ROLES.has(user.role) || user.id === p.buyer_id || user.id === p.seller_id)
  );
  return {
    id: p.id,
    sourceBatchId: p.source_batch_id,
    childBatchId: p.child_batch_id,
    sellerRole: p.seller_role,
    buyerRole: p.buyer_role,
    buyerName: p.buyer_name,
    quantity: Number(p.quantity),
    unit: p.unit,
    pricePerUnit: canSeeTerms ? p.price_per_unit : undefined,
    currency: canSeeTerms ? p.currency : undefined,
    certificateId: p.certificate_id,
    status: p.status,
    lastError: canSeeTerms ? p.last_error : undefined,
    createdAt: p.created_at,
  };
}

export function traceUrl(id: string): string {
  const base = (env.PUBLIC_APP_URL || env.FRONTEND_URL).replace(/\/$/, "");
  return `${base}/verify/${encodeURIComponent(id)}`;
}

/** Full chain for authenticated users: ancestors' certificates, purchases and (for holders) descendants. */
async function getBatchTrace(batchId: string, user: AuthUser) {
  const batch = await getBatch(batchId);
  const lineage: string[] = batch.lineage_path || [batch.id];
  const rootId = batch.root_batch_id || batch.id;

  const [{ data: ancestors }, { data: certs }, { data: purchases }, { data: descendants }] = await Promise.all([
    db().from("batches").select("*").in("id", lineage),
    db().from("certificates").select("*").in("batch_id", lineage).order("created_at", { ascending: true }),
    db().from("purchases").select("*").eq("root_batch_id", rootId).order("created_at", { ascending: true }),
    db().from("batches").select("*").contains("lineage_path", [batch.id]).neq("id", batch.id),
  ]);

  const includePrivate = ["farmer", "helper", "distributor", "retailer", "admin"].includes(user.role);
  const pathPurchases = (purchases as PurchaseRow[] | null)?.filter((p) => p.child_batch_id && lineage.includes(p.child_batch_id)) ?? [];
  const isHolder = batch.owner_id === user.id || PRIVILEGED_ROLES.has(user.role) || (await isBatchOwner(batch, user));
  const childPurchases = isHolder
    ? (purchases as PurchaseRow[] | null)?.filter((p) => p.source_batch_id === batch.id) ?? []
    : [];

  return {
    batch: batchView(batch),
    lineage: lineage.map((id) => (ancestors || []).find((b: any) => b.id === id)).filter(Boolean).map(batchView),
    certificates: ((certs as CertificateRow[]) || []).map((c) => certificateView(c, { includePrivate, viewer: user })),
    transfers: pathPurchases.map((p) => purchaseView(p, user)),
    outgoingTransfers: childPurchases.map((p) => purchaseView(p, user)),
    childBatches: isHolder ? (descendants || []).filter((b: any) => b.parent_lot_id === batch.id).map(batchView) : [],
  };
}

/** Public-safe journey for QR pages. Accepts a batch ID or a certificate ID. */
async function getPublicTrace(id: string) {
  let batchId = id;
  let focusCertificateId: string | null = null;
  if (id.startsWith("CERT-")) {
    const cert = await getCertificateRow(id);
    batchId = cert.batch_id;
    focusCertificateId = cert.id;
  }

  const batch = await getBatch(batchId);
  const lineage: string[] = batch.lineage_path || [batch.id];
  const rootId = batch.root_batch_id || batch.id;

  const [{ data: ancestors }, { data: certs }, { data: purchases }] = await Promise.all([
    db().from("batches").select("*").in("id", lineage),
    db().from("certificates").select("*").in("batch_id", lineage).order("created_at", { ascending: true }),
    db().from("purchases").select("*").eq("root_batch_id", rootId).order("created_at", { ascending: true }),
  ]);

  const root = (ancestors || []).find((b: any) => b.id === rootId) || batch;
  const transfers = ((purchases as PurchaseRow[]) || [])
    .filter((p) => p.child_batch_id && lineage.includes(p.child_batch_id))
    .map((p) => purchaseView(p, null));

  return {
    focusCertificateId,
    product: {
      crop: batch.crop || batch.crop_type,
      variety: batch.variety,
      batchId: batch.id,
      rootBatchId: rootId,
      quantity: Number(batch.original_quantity ?? batch.quantity ?? 0),
      unit: batch.unit || "kg",
      harvestDate: root.harvest_date,
      registeredAt: root.created_at,
      qualityGrade: root.quality_grade,
    },
    currentCustodian: {
      role: batch.owner_role,
      displayName: batch.owner_role === "farmer" ? publicPersonName(batch.farmer_name) : batch.current_owner_name,
    },
    certificates: ((certs as CertificateRow[]) || []).map((c) => certificateView(c, { includePrivate: false })),
    transfers,
    qrUrl: traceUrl(batch.id),
  };
}

async function getCertificateDetail(certificateId: string, user?: AuthUser | null) {
  const cert = await getCertificateRow(certificateId);
  const includePrivate = Boolean(user && ["farmer", "helper", "distributor", "retailer", "admin"].includes(user.role));
  const { data: events } = includePrivate
    ? await db()
        .from("traceability_events")
        .select("event_type, details, created_at")
        .eq("entity_type", "certificate")
        .eq("entity_id", cert.id)
        .order("created_at", { ascending: true })
    : { data: [] as any[] };
  return { certificate: certificateView(cert, { includePrivate, viewer: user }), events: events || [] };
}

/** Link to the document: gateway URL for public files, short-lived signed URL for private ones. */
async function getDocumentLink(certificateId: string, user?: AuthUser | null) {
  const cert = await getCertificateRow(certificateId);
  if (!cert.ipfs_cid) throw new HttpError(409, "The document has not been stored yet");
  if (cert.visibility === "public") return { url: pinataService.publicUrl(cert.ipfs_cid), expiresInSeconds: null };
  if (!user || !["farmer", "helper", "distributor", "retailer", "admin"].includes(user.role)) {
    throw new HttpError(403, "This document is private");
  }
  return { url: await pinataService.signedUrl(cert.ipfs_cid, 300), expiresInSeconds: 300 };
}

/** Batches the user can buy: farmer lots for distributors, distributor stock for retailers. */
async function getAvailableBatches(user: AuthUser) {
  const sellerRole = user.role === "retailer" ? "distributor" : "farmer";
  const { data: batches, error } = await db()
    .from("batches")
    .select("*")
    .eq("owner_role", sellerRole)
    .gt("quantity", 0)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new HttpError(500, error.message);

  const ids = (batches || []).map((b: any) => b.id);
  const { data: certs } = ids.length
    ? await db().from("certificates").select("*").in("batch_id", ids).is("revoked_at", null)
    : { data: [] as any[] };

  return (batches || [])
    .filter((b: any) => b.owner_id !== user.id)
    .map((b: any) => {
      const batchCerts = ((certs as CertificateRow[]) || []).filter((c) => c.batch_id === b.id);
      const latest = batchCerts[batchCerts.length - 1];
      return {
        ...batchView(b),
        certificateCount: batchCerts.length,
        latestCertificate: latest ? certificateView(latest, { includePrivate: false }) : null,
      };
    });
}

async function getDashboard(user: AuthUser) {
  const client = db();
  if (!SAFE_ID_RE.test(user.id)) throw new HttpError(400, "Invalid user identifier");
  if (user.role === "farmer") {
    const { data: mine, error } = await client
      .from("batches")
      .select("*")
      .is("parent_lot_id", null)
      .or(await farmerOwnershipFilter(user))
      .order("created_at", { ascending: false });
    if (error) throw new HttpError(500, error.message);
    const ids = (mine || []).map((b: any) => b.id);
    const [{ data: certs }, { data: sales }] = await Promise.all([
      ids.length ? client.from("certificates").select("*").in("batch_id", ids) : Promise.resolve({ data: [] as any[] }),
      ids.length ? client.from("purchases").select("*").in("source_batch_id", ids).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    ]);
    return {
      role: user.role,
      batches: (mine || []).map((b: any) => {
        const batchCerts = ((certs as CertificateRow[]) || []).filter((c) => c.batch_id === b.id && !c.revoked_at);
        return { ...batchView(b), certificate: batchCerts.length ? certificateView(batchCerts[batchCerts.length - 1], { includePrivate: true, viewer: user }) : null };
      }),
      transfers: ((sales as PurchaseRow[]) || []).map((p) => purchaseView(p, user)),
    };
  }

  if (user.role === "distributor" || user.role === "retailer") {
    const [{ data: holdings }, { data: purchases }, available] = await Promise.all([
      client.from("batches").select("*").eq("owner_id", user.id).eq("owner_role", user.role).order("created_at", { ascending: false }),
      client.from("purchases").select("*").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false }),
      getAvailableBatches(user),
    ]);
    const certIds = ((purchases as PurchaseRow[]) || []).map((p) => p.certificate_id).filter(Boolean) as string[];
    const { data: certs } = certIds.length
      ? await client.from("certificates").select("*").in("id", certIds)
      : { data: [] as any[] };
    return {
      role: user.role,
      holdings: (holdings || []).map(batchView),
      transfers: ((purchases as PurchaseRow[]) || []).map((p) => purchaseView(p, user)),
      certificates: ((certs as CertificateRow[]) || []).map((c) => certificateView(c, { includePrivate: true, viewer: user })),
      availableCount: available.length,
      available: available.slice(0, 5),
    };
  }

  return { role: user.role };
}

export const certificateService = {
  createOriginCertificate,
  createPurchase,
  retryCertificate,
  retryPurchase,
  revokeCertificate,
  verifyCertificate,
  getBatchTrace,
  getPublicTrace,
  getCertificateDetail,
  getDocumentLink,
  getAvailableBatches,
  getDashboard,
};
