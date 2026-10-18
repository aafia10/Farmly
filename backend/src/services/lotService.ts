import { supabase } from "../config/supabase";
import { AuthUser } from "../types";
import { HttpError } from "../utils/httpError";
import { toUuid } from "../utils/uuid";
import { resolveFarmer } from "../utils/farmerRegistry";

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
export async function createLotRecord(input: LotInput, actor: AuthUser | undefined, opts: { insertOnly?: boolean } = {}) {
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

  return { lot: data, created: true };
}
