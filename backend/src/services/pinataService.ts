import crypto from "crypto";

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

export interface PinataUploadResult {
  ipfsHash: string;
  pinSize?: number;
  timestamp?: string;
  isMock?: boolean;
}

export const pinataService = {
  /**
   * Uploads batch metadata JSON to IPFS via Pinata.
   * If Pinata API credentials are not set, falls back gracefully to a deterministic mock CID.
   */
  async uploadBatchMetadata(payload: BatchMetadataPayload): Promise<PinataUploadResult> {
    const pinataJwt = process.env.PINATA_JWT;
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_API_KEY;

    // Check if live Pinata credentials are available
    const hasJwt = Boolean(pinataJwt && pinataJwt !== "your-pinata-jwt-here");
    const hasApiKeys = Boolean(
      pinataApiKey &&
      pinataSecretKey &&
      pinataApiKey !== "your-pinata-api-key"
    );

    if (!hasJwt && !hasApiKeys) {
      // Deterministic fallback CID based on payload hash
      const hashDigest = crypto
        .createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");
      const fallbackCid = `QmFarmly${hashDigest.substring(0, 38)}`;
      
      console.warn(
        `[PinataService] Pinata credentials missing in .env. Using mock IPFS CID: ${fallbackCid}`
      );
      return {
        ipfsHash: fallbackCid,
        isMock: true,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (hasJwt) {
        headers["Authorization"] = `Bearer ${pinataJwt}`;
      } else {
        headers["pinata_api_key"] = pinataApiKey!;
        headers["pinata_secret_api_key"] = pinataSecretKey!;
      }

      const body = {
        pinataMetadata: {
          name: `Farmly-Batch-${payload.batchId}`,
          keyvalues: {
            batchId: payload.batchId,
            crop: payload.crop,
            farmer: payload.farmerName,
            platform: "Farmly",
          },
        },
        pinataContent: {
          ...payload,
          standard: "Farmly-Provenance-v1.0",
          schema: "https://farmly.io/schemas/batch-v1.json",
        },
      };

      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata API responded with ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as { IpfsHash: string; PinSize: number; Timestamp: string };
      console.log(`[PinataService] Successfully pinned batch ${payload.batchId} to IPFS: ${data.IpfsHash}`);

      return {
        ipfsHash: data.IpfsHash,
        pinSize: data.PinSize,
        timestamp: data.Timestamp,
        isMock: false,
      };
    } catch (error: any) {
      console.error("[PinataService] Failed to pin JSON to Pinata:", error.message);
      // Fallback CID to ensure registration flow doesn't halt
      const fallbackCid = `QmFallback${crypto.randomBytes(18).toString("hex")}`;
      return {
        ipfsHash: fallbackCid,
        isMock: true,
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Constructs the public gateway URL for an IPFS hash.
   */
  getGatewayUrl(ipfsHash: string): string {
    const gateway = process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs";
    const cleanGateway = gateway.replace(/\/+$/, "");
    return `${cleanGateway}/${ipfsHash}`;
  },
};
