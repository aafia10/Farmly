import crypto from "crypto";
import { env } from "../config/env";

/**
 * Pinata (IPFS) integration using the v3 Files API. Credentials stay on the server.
 * - Public files are retrievable by anyone through an IPFS gateway.
 * - Private files are only retrievable through short-lived signed URLs created here.
 */

const UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";
const SIGN_URL = "https://api.pinata.cloud/v3/files/private/download_link";
const PUBLIC_GATEWAY_FALLBACK = "https://gateway.pinata.cloud";
const REQUEST_TIMEOUT_MS = 30_000;

export type PinataNetwork = "public" | "private";

export class PinataError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "PinataError";
  }
}

export interface PinataUploadResult {
  cid: string;
  fileId: string;
  network: PinataNetwork;
  size: number;
}

function gatewayBase(): string {
  const configured = env.PINATA_GATEWAY_URL;
  if (!configured) return PUBLIC_GATEWAY_FALLBACK;
  // Accept "my-gw.mypinata.cloud", "https://my-gw.mypinata.cloud" and ".../ipfs" forms.
  const base = configured.replace(/\/+$/, "").replace(/\/ipfs$/, "");
  return base.startsWith("http") ? base : `https://${base}`;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    throw new PinataError(`Pinata request failed: ${err?.name === "AbortError" ? "timeout" : err?.message}`, true);
  } finally {
    clearTimeout(timer);
  }
}

/** Lot (batch) metadata pinned when a lot is created; its CID is registered on Sepolia. */
export interface BatchMetadataPayload {
  batchId: string;
  farmerName: string;
  farmerId?: string;
  crop: string;
  variety?: string;
  quantity: number;
  unit: string;
  qualityGrade: string;
  location?: string;
  weighmentScaleId?: string;
  certificateRef?: string;
  timestamp: string;
  attributes?: Record<string, any>;
}

export interface BatchPinResult {
  ipfsHash: string;
  pinSize?: number;
  timestamp?: string;
  /** true when Pinata is not configured or failed: the hash is a placeholder and must not be stored as real. */
  isMock?: boolean;
}

export const pinataService = {
  isConfigured(): boolean {
    return Boolean(env.PINATA_JWT);
  },

  async upload(
    bytes: Buffer,
    options: { fileName: string; mimeType: string; network: PinataNetwork }
  ): Promise<PinataUploadResult> {
    if (!env.PINATA_JWT) throw new PinataError("Pinata is not configured (PINATA_JWT missing)", false);

    const form = new FormData();
    form.append("file", new Blob([bytes], { type: options.mimeType }), options.fileName);
    form.append("network", options.network);
    form.append("name", options.fileName);

    const res = await fetchWithTimeout(UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.PINATA_JWT}` },
      body: form,
    });

    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new PinataError(`Pinata upload failed (${res.status}): ${detail}`, res.status >= 500 || res.status === 429);
    }

    const body: any = await res.json();
    const data = body?.data;
    if (!data?.cid || !data?.id) {
      throw new PinataError("Pinata did not confirm the upload (no CID returned)", true);
    }
    return { cid: data.cid, fileId: data.id, network: options.network, size: Number(data.size) || bytes.length };
  },

  /** Public gateway URL. Only meaningful for public files. */
  publicUrl(cid: string): string {
    return `${gatewayBase()}/ipfs/${cid}`;
  },

  /** Short-lived signed URL for a private file. Requires a dedicated Pinata gateway. */
  async signedUrl(cid: string, expiresInSeconds = 300): Promise<string> {
    if (!env.PINATA_JWT) throw new PinataError("Pinata is not configured (PINATA_JWT missing)", false);
    if (!env.PINATA_GATEWAY_URL) {
      throw new PinataError("PINATA_GATEWAY_URL is required to read private files", false);
    }
    const res = await fetchWithTimeout(SIGN_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.PINATA_JWT}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `${gatewayBase()}/files/${cid}`,
        expires: expiresInSeconds,
        date: Math.floor(Date.now() / 1000),
        method: "GET",
      }),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new PinataError(`Could not create signed URL (${res.status}): ${detail}`, res.status >= 500);
    }
    const body: any = await res.json();
    if (typeof body?.data !== "string") throw new PinataError("Pinata returned no signed URL", true);
    return body.data;
  },

  /** Downloads the exact stored bytes, used for hash verification. */
  async download(cid: string, network: PinataNetwork): Promise<Buffer> {
    const url = network === "private" ? await this.signedUrl(cid) : this.publicUrl(cid);
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new PinataError(`IPFS retrieval failed (${res.status})`, res.status >= 500 || res.status === 429);
    return Buffer.from(await res.arrayBuffer());
  },
  // ---------------------------------------------------------------------------
  // Lot (batch) metadata, used by lot creation and POST /lots/pin-metadata
  // ---------------------------------------------------------------------------

  /**
   * Pins a lot's metadata JSON to IPFS. Without Pinata credentials, or if Pinata fails, it returns a
   * deterministic placeholder flagged `isMock` so lot creation still completes; callers must not
   * present or store a mock hash as a real IPFS record.
   */
  async uploadBatchMetadata(payload: BatchMetadataPayload): Promise<BatchPinResult> {
    const jwt = env.PINATA_JWT;
    const apiKey = env.PINATA_API_KEY;
    const secret = env.PINATA_SECRET_API_KEY;
    const hasJwt = Boolean(jwt && jwt !== "your-pinata-jwt-here");
    const hasKeys = Boolean(apiKey && secret && apiKey !== "your-pinata-api-key");

    const placeholder = (): BatchPinResult => ({
      ipfsHash: `QmFarmly${crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 38)}`,
      isMock: true,
      timestamp: new Date().toISOString(),
    });

    if (!hasJwt && !hasKeys) {
      console.warn("[PinataService] Pinata credentials missing; lot metadata not pinned.");
      return placeholder();
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (hasJwt) headers.Authorization = `Bearer ${jwt}`;
      else {
        headers.pinata_api_key = apiKey!;
        headers.pinata_secret_api_key = secret!;
      }
      const res = await fetchWithTimeout("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers,
        body: JSON.stringify({
          pinataMetadata: {
            name: `Farmly-Batch-${payload.batchId}`,
            keyvalues: { batchId: payload.batchId, crop: payload.crop, farmer: payload.farmerName, platform: "Farmly" },
          },
          pinataContent: { ...payload, standard: "Farmly-Provenance-v1.0", schema: "https://farmly.io/schemas/batch-v1.json" },
        }),
      });
      if (!res.ok) throw new Error(`Pinata API responded with ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = (await res.json()) as { IpfsHash: string; PinSize: number; Timestamp: string };
      return { ipfsHash: data.IpfsHash, pinSize: data.PinSize, timestamp: data.Timestamp, isMock: false };
    } catch (error: any) {
      console.error("[PinataService] Failed to pin lot metadata:", error.message);
      return placeholder();
    }
  },

  /** Public gateway URL for a CID. */
  getGatewayUrl(ipfsHash: string): string {
    return this.publicUrl(ipfsHash);
  },
};
