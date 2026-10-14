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
  return configured.startsWith("http") ? configured.replace(/\/$/, "") : `https://${configured.replace(/\/$/, "")}`;
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
};
