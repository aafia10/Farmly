import { supabase } from "../config/supabase";
import { toUuid } from "./uuid";

export interface ResolvedFarmer {
  registryId: string | null; // e.g. "FM-785349" (for batches.farmer_registry_id FK)
  farmerUuid: string | null; // UUID (for batches.farmer_id)
  farmerName: string;
}

/**
 * Resolves a farmer registry ID (FM-XXXXXX) and profile UUID for batch and crop inserts.
 * Prevents foreign key constraint violations against public.farmers(id).
 */
export async function resolveFarmer(
  farmerId?: string | null,
  farmerName?: string | null,
  reqUser?: any,
  fallbackLocation?: string
): Promise<ResolvedFarmer> {
  const targetUuid = toUuid(farmerId) || toUuid(reqUser?.id);

  // 1. If farmerId starts with FM- or FMR-, lookup in farmers by id directly
  if (farmerId && (farmerId.startsWith("FM-") || farmerId.startsWith("FMR-"))) {
    try {
      const { data } = await supabase
        .from("farmers")
        .select("id, profile_id, name")
        .eq("id", farmerId)
        .maybeSingle();

      if (data) {
        return {
          registryId: data.id,
          farmerUuid: data.profile_id || toUuid(data.id) || targetUuid,
          farmerName: data.name || farmerName || "Farmer",
        };
      }
    } catch {
      // Continue to next check
    }
  }

  // 2. If targetUuid is a valid UUID, lookup in farmers by profile_id
  if (targetUuid) {
    try {
      const { data } = await supabase
        .from("farmers")
        .select("id, profile_id, name")
        .eq("profile_id", targetUuid)
        .maybeSingle();

      if (data) {
        return {
          registryId: data.id,
          farmerUuid: data.profile_id || targetUuid,
          farmerName: data.name || farmerName || "Farmer",
        };
      }
    } catch {
      // Continue to next check
    }
  }

  // 3. If farmerId is provided without standard prefix, check farmers by id
  if (farmerId) {
    try {
      const { data } = await supabase
        .from("farmers")
        .select("id, profile_id, name")
        .eq("id", farmerId)
        .maybeSingle();

      if (data) {
        return {
          registryId: data.id,
          farmerUuid: data.profile_id || toUuid(data.id) || targetUuid,
          farmerName: data.name || farmerName || "Farmer",
        };
      }
    } catch {
      // Continue to next check
    }
  }

  // 4. Try matching by farmerName if provided
  if (farmerName && farmerName.trim()) {
    try {
      const { data } = await supabase
        .from("farmers")
        .select("id, profile_id, name")
        .ilike("name", farmerName.trim())
        .maybeSingle();

      if (data) {
        return {
          registryId: data.id,
          farmerUuid: data.profile_id || targetUuid,
          farmerName: data.name,
        };
      }
    } catch {
      // Continue to auto-create
    }
  }

  // 5. If no row exists in farmers table yet, auto-insert one to satisfy FK constraint
  try {
    const generatedRegistryId = `FM-${Date.now().toString().slice(-6)}`;
    const effectiveName = farmerName || reqUser?.fullName || "Registered Farmer";
    const newFarmer = {
      id: generatedRegistryId,
      profile_id: targetUuid || null,
      name: effectiveName,
      mobile: reqUser?.mobile || "9876500000",
      village: fallbackLocation || "Nashik",
      taluka: "Nashik",
      district: "Nashik",
      state: "Maharashtra",
      farming_category: "Crops",
      consent: true,
      verification_level: "Field Verified",
      status: "Active",
      last_activity: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from("farmers")
      .upsert(newFarmer, { onConflict: "id" })
      .select("id, profile_id, name")
      .maybeSingle();

    if (!error && created) {
      return {
        registryId: created.id,
        farmerUuid: created.profile_id || targetUuid,
        farmerName: created.name,
      };
    }
  } catch (err: any) {
    console.warn("[resolveFarmer] Auto-create farmer notice:", err.message);
  }

  // 6. Safe fallback: null (since batches.farmer_registry_id allows null without FK violation)
  return {
    registryId: null,
    farmerUuid: targetUuid,
    farmerName: farmerName || "Farmer",
  };
}
