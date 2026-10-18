import { supabase } from "../config/supabase";
import { AuthUser } from "../types";
import { HttpError } from "../utils/httpError";
import { toUuid } from "../utils/uuid";
import { resolveFarmer } from "../utils/farmerRegistry";

export interface CropAvailabilityInput {
  id?: string;
  farmerId?: string;
  farmerName: string;
  crop: string;
  variety: string;
  estimatedQuantity: number;
  unit?: string;
  expectedHarvestDate: string;
  location: string;
  notes?: string | null;
  status?: string;
  sowingDate?: string | null;
  farmingMethod?: "Organic" | "Natural" | "Conventional" | null;
  organicCertified?: boolean | null;
  cropCategory?: string | null;
  expectedPricePerKg?: number | null;
}

/**
 * Records an upcoming harvest (crop availability). Shared by POST /crop-availability and the phone
 * agent. `insertOnly` never overwrites an existing ID (idempotent retries).
 */
export async function createCropAvailabilityRecord(
  input: CropAvailabilityInput,
  actor: AuthUser | undefined,
  opts: { insertOnly?: boolean } = {}
) {
  if (!input.farmerName || !input.crop || !input.variety || !input.estimatedQuantity || !input.expectedHarvestDate || !input.location) {
    throw new HttpError(400, "Missing required fields for crop availability");
  }

  const id = input.id || `CA-${Date.now().toString().slice(-5)}`;
  const resolved = await resolveFarmer(input.farmerId, input.farmerName, actor, input.location);
  const isHelper = actor?.role === "helper";
  const helperUuid = isHelper ? toUuid(actor?.id) : null;

  const payload = {
    id,
    farmer_id: resolved.farmerUuid,
    farmer_registry_id: resolved.registryId,
    farmer_name: resolved.farmerName,
    crop: input.crop,
    variety: input.variety,
    estimated_quantity: input.estimatedQuantity,
    unit: input.unit || "kg",
    expected_harvest_date: input.expectedHarvestDate,
    location: input.location,
    notes: input.notes || null,
    status: input.status || "Available",
    // Optional crop details (migration 006); only sent when given so older forms keep working.
    ...(input.sowingDate ? { sowing_date: input.sowingDate } : {}),
    ...(input.farmingMethod ? { farming_method: input.farmingMethod } : {}),
    ...(input.organicCertified != null ? { organic_certified: input.organicCertified } : {}),
    ...(input.cropCategory ? { crop_category: input.cropCategory } : {}),
    ...(input.expectedPricePerKg ? { expected_price_per_kg: input.expectedPricePerKg } : {}),
  };

  const query = opts.insertOnly
    ? supabase.from("crop_availabilities").insert(payload).select().single()
    : supabase.from("crop_availabilities").upsert(payload, { onConflict: "id" }).select().single();
  const { data, error } = await query;

  if (error) {
    if (opts.insertOnly && error.code === "23505") {
      const { data: existing } = await supabase.from("crop_availabilities").select("*").eq("id", id).maybeSingle();
      if (existing) return { availability: existing, created: false };
    }
    throw new HttpError(500, error.message);
  }

  if (isHelper && helperUuid) {
    try {
      await supabase.from("helper_activities").insert({
        id: `HA-${Date.now().toString().slice(-6)}`,
        helper_id: helperUuid,
        action: `Recorded crop availability for ${resolved.farmerName}`,
        category: "Crop Availability",
        details: `${input.estimatedQuantity} ${input.unit || "kg"} of ${input.crop} (${input.variety})`,
        badge_status: "Completed",
      });
    } catch (e: any) {
      console.warn("[createCropAvailability] Helper activity log skipped:", e.message);
    }
  }

  return { availability: data, created: true };
}
