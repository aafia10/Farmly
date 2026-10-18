import { supabase } from "../config/supabase";
import { AuthUser } from "../types";
import { HttpError } from "../utils/httpError";
import { toUuid } from "../utils/uuid";
import { resolveFarmer } from "../utils/farmerRegistry";
import { pinataService } from "./pinataService";
import { BlockchainAnchor, blockchainService } from "./blockchainService";

export interface LotInput {
  id?: string;
  farmerId?: string;
  farmerName: string;
  crop: string;
  variety?: string | null;
  quantity: number;
  unit?: string;
  currentOwner?: string;
  qualityGrade?: string;
  status?: string;
  location?: string;
  parentLotId?: string | null;
  weighmentScaleId?: string | null;
  certificateRef?: string | null;
  harvestDate?: string | null; // YYYY-MM-DD
  sowingDate?: string | null;
  farmingMethod?: "Organic" | "Natural" | "Conventional" | null;
  organicCertified?: boolean | null;
  cropCategory?: string | null;
  pricePerKg?: number | null;
  /** Set when the browser already pinned the metadata / signed the Sepolia transaction (MetaMask flow). */
  ipfsHash?: string | null;
  blockchainHash?: string | null;
}

/**
 * Pinata + Sepolia anchoring of a lot:
 * - "await": pin and register before saving (website forms; the response carries the anchor),
 * - "background": save first, anchor afterwards and update the row (phone calls, which can't wait
 *   for a block confirmation inside a webhook),
 * - "none": don't anchor.
 * Placeholder hashes (Pinata or the chain not configured, or a failed call) are never stored.
 */
export type AnchorMode = "await" | "background" | "none";

export interface LotAnchorResult {
  ipfsHash: string | null;
  ipfsUrl: string | null;
  blockchainAnchor: BlockchainAnchor | null;
  /** true when anchoring fell back to placeholders: nothing was really pinned / recorded. */
  simulated: boolean;
}

async function anchorLot(id: string, farmerName: string, input: LotInput, farmerUuid?: string | null): Promise<LotAnchorResult> {
  let ipfsHash = input.ipfsHash || null;
  let ipfsMock = false;
  if (!ipfsHash) {
    const pin = await pinataService.uploadBatchMetadata({
      batchId: id,
      farmerName,
      farmerId: farmerUuid || undefined,
      crop: input.crop,
      variety: input.variety || "Standard",
      quantity: Number(input.quantity),
      unit: input.unit || "kg",
      qualityGrade: input.qualityGrade || "Standard",
      location: input.location || undefined,
      weighmentScaleId: input.weighmentScaleId || undefined,
      certificateRef: input.certificateRef || undefined,
      timestamp: new Date().toISOString(),
      attributes: {
        farmingMethod: input.farmingMethod ?? undefined,
        organicCertified: input.organicCertified ?? undefined,
        cropCategory: input.cropCategory ?? undefined,
        sowingDate: input.sowingDate ?? undefined,
        harvestDate: input.harvestDate ?? undefined,
      },
    });
    ipfsHash = pin.ipfsHash;
    ipfsMock = Boolean(pin.isMock);
  }

  let anchor: BlockchainAnchor | null = input.blockchainHash ? blockchainService.getAnchorDetails(input.blockchainHash) : null;
  // Never write a placeholder CID to the chain: chain records are permanent.
  if (!anchor && !ipfsMock) {
    anchor = await blockchainService.registerBatchOnChain({
      batchId: id,
      farmerName,
      crop: input.crop,
      variety: input.variety || "Standard",
      quantity: Number(input.quantity),
      unit: input.unit || "kg",
      qualityGrade: input.qualityGrade || "Standard",
      location: input.location || undefined,
      ipfsHash: ipfsHash!,
    });
  }
  const chainMock = !anchor || Boolean(anchor.isMock);
  return {
    ipfsHash: ipfsMock ? null : ipfsHash,
    ipfsUrl: ipfsMock || !ipfsHash ? null : pinataService.getGatewayUrl(ipfsHash),
    blockchainAnchor: anchor,
    simulated: ipfsMock || chainMock,
  };
}

/** Columns for the real (non-placeholder) parts of an anchor. */
function anchorColumns(id: string, a: LotAnchorResult) {
  const realTx = a.blockchainAnchor && !a.blockchainAnchor.isMock ? a.blockchainAnchor.hash : null;
  return {
    ...(a.ipfsHash ? { ipfs_hash: a.ipfsHash } : {}),
    ...(realTx ? { blockchain_hash: realTx, initial_transaction_hash: realTx, blockchain_batch_id: id } : {}),
  };
}

function toKgFactor(unit?: string): number {
  return unit === "quintals" ? 100 : unit === "tonnes" ? 1000 : 1;
}

/**
 * Creates a crop lot (batch). Shared by the HTTP lot API and the IVR registration flow so a lot
 * registered by phone is identical to one entered by a field helper.
 * `insertOnly` refuses to overwrite an existing ID and returns the existing row instead
 * (used for idempotent IVR submissions).
 */
export async function createLotRecord(
  input: LotInput,
  actor: AuthUser | undefined,
  opts: { insertOnly?: boolean; anchor?: AnchorMode } = {}
): Promise<{ lot: any; created: boolean; anchor?: LotAnchorResult }> {
  if (!input.farmerName || !input.crop || input.quantity === undefined) {
    throw new HttpError(400, "Missing required fields for lot creation");
  }

  const id = input.id || `LT-${Date.now().toString().slice(-6)}`;

  // For the farmer role, the lot is created strictly under their own profile/registry.
  const effectiveFarmerId = actor?.role === "farmer" ? actor.id : input.farmerId;
  const effectiveFarmerName = actor?.role === "farmer" ? actor.fullName || input.farmerName : input.farmerName;

  // Resolve the farmer registry ID to avoid violating batches_farmer_registry_id_fkey.
  const resolved = await resolveFarmer(effectiveFarmerId, effectiveFarmerName, actor, input.location);

  // Only associate a helper when the acting user really is a helper.
  const isHelper = actor?.role === "helper";
  const helperUuid = isHelper ? toUuid(actor?.id) : null;

  const payload: any = {
    id,
    farmer_id: resolved.farmerUuid,
    farmer_registry_id: resolved.registryId,
    farmer_name: resolved.farmerName,
    crop_type: input.crop,
    crop: input.crop,
    variety: input.variety || "Standard",
    harvest_quantity: input.quantity,
    quantity: input.quantity,
    unit: input.unit || "kg",
    current_owner: input.currentOwner || `${resolved.farmerName} (Farmer)`,
    current_owner_name: input.currentOwner || `${resolved.farmerName} (Farmer)`,
    quality_grade: input.qualityGrade || "Standard",
    grading: input.qualityGrade || "Standard",
    status: input.status || "Active",
    location: input.location || "Nashik, Maharashtra",
    assisted_by_helper_id: helperUuid,
    parent_lot_id: input.parentLotId || null,
    // null = explicitly not weighed yet (phone registration); undefined keeps the old form default.
    weighment_scale_id: input.weighmentScaleId === null ? null : input.weighmentScaleId || "WB-NSK-01",
    certificate_ref: input.certificateRef || null,
    ...(input.harvestDate ? { harvest_date: input.harvestDate } : {}),
    // Optional crop details (migration 006); only sent when given so older forms keep working.
    ...(input.sowingDate ? { sowing_date: input.sowingDate } : {}),
    ...(input.farmingMethod ? { farming_method: input.farmingMethod } : {}),
    ...(input.organicCertified != null ? { organic_certified: input.organicCertified } : {}),
    ...(input.cropCategory ? { crop_category: input.cropCategory } : {}),
    ...(input.pricePerKg ? { price_per_kg: input.pricePerKg, total_price: Math.round(input.pricePerKg * toKgFactor(input.unit) * input.quantity * 100) / 100 } : {}),
    // Root lots belong to the farmer (a helper registers on the farmer's behalf).
    ...(input.parentLotId
      ? {}
      : {
          owner_id: actor?.role === "farmer" ? actor.id : resolved.registryId,
          owner_role: "farmer",
          original_quantity: input.quantity,
        }),
    created_by: actor?.id || null,
  };

  const anchorMode: AnchorMode = opts.anchor ?? "await";
  let anchor: LotAnchorResult | undefined;
  if (anchorMode === "await") {
    anchor = await anchorLot(id, resolved.farmerName, input, resolved.farmerUuid);
    Object.assign(payload, anchorColumns(id, anchor));
  } else if (input.ipfsHash || input.blockchainHash) {
    // Hashes supplied by the client are stored as given.
    Object.assign(payload, {
      ...(input.ipfsHash ? { ipfs_hash: input.ipfsHash } : {}),
      ...(input.blockchainHash ? { blockchain_hash: input.blockchainHash, initial_transaction_hash: input.blockchainHash, blockchain_batch_id: id } : {}),
    });
  }

  const query = opts.insertOnly
    ? supabase.from("batches").insert(payload).select().single()
    : supabase.from("batches").upsert(payload, { onConflict: "id" }).select().single();
  const { data, error } = await query;

  if (error) {
    if (opts.insertOnly && error.code === "23505") {
      const { data: existing } = await supabase.from("batches").select("*").eq("id", id).maybeSingle();
      if (existing) return { lot: existing, created: false };
    }
    throw new HttpError(500, error.message);
  }

  if (isHelper && helperUuid) {
    try {
      await supabase.from("helper_activities").insert({
        id: `HA-${Date.now().toString().slice(-6)}`,
        helper_id: helperUuid,
        action: `Documented lot ${id} for ${resolved.farmerName}`,
        category: "Lot Creation",
        details: `${input.quantity} ${input.unit || "kg"} of ${input.crop} (${input.qualityGrade || "Standard"})`,
        badge_status: "Completed",
      });
    } catch (e: any) {
      console.warn("[createLot] Helper activity log skipped:", e.message);
    }
  }

  if (anchorMode === "background" && !input.blockchainHash) {
    // Runs after the response; a failure leaves the lot unanchored but registered.
    void anchorLot(id, resolved.farmerName, input, resolved.farmerUuid)
      .then(async (a) => {
        const cols = anchorColumns(id, a);
        if (Object.keys(cols).length) await supabase.from("batches").update(cols).eq("id", id);
      })
      .catch((e) => console.warn(`[createLot] Background anchoring of ${id} failed:`, e.message));
  }

  return { lot: data, created: true, anchor };
}
