import { supabase } from "../config/supabase";
import { AuthUser } from "../types";
import { HttpError } from "../utils/httpError";
import { toUuid } from "../utils/uuid";

export interface FarmerInput {
  id?: string;
  name: string;
  mobile: string;
  village: string;
  taluka?: string | null;
  district: string;
  state: string;
  language?: string;
  farmingCategory?: string;
  fpo?: string | null;
  consent?: boolean;
  verificationLevel?: "Basic" | "Field Verified" | "Identity Confirmed";
  status?: "Active" | "Pending" | "Needs Review";
}

/**
 * Registers a farmer profile. Shared by the helper "Register farmer" form (POST /farmers) and the
 * phone agent, so a farmer registered by phone is stored exactly like one entered by a helper.
 * `insertOnly` never overwrites an existing ID and returns the stored row instead (idempotent retries).
 */
export async function createFarmerRecord(input: FarmerInput, actor: AuthUser | undefined, opts: { insertOnly?: boolean } = {}) {
  if (!input.name || !input.mobile || !input.village || !input.district || !input.state) {
    throw new HttpError(400, "Missing required farmer registration fields");
  }

  const id = input.id || `FM-${Date.now().toString().slice(-6)}`;
  const isHelper = actor?.role === "helper";
  const helperUuid = isHelper ? toUuid(actor?.id) : null;

  const payload = {
    id,
    name: input.name,
    mobile: input.mobile,
    village: input.village,
    taluka: input.taluka || "",
    district: input.district,
    state: input.state,
    language: input.language || "English",
    farming_category: input.farmingCategory || "Crops",
    fpo: input.fpo || null,
    consent: input.consent ?? true,
    verification_level: input.verificationLevel || "Field Verified",
    status: input.status || "Active",
    assisted_by_helper_id: helperUuid,
    last_activity: new Date().toISOString(),
  };

  const query = opts.insertOnly
    ? supabase.from("farmers").insert(payload).select().single()
    : supabase.from("farmers").upsert(payload, { onConflict: "id" }).select().single();
  const { data, error } = await query;

  if (error) {
    if (opts.insertOnly && error.code === "23505") {
      const { data: existing } = await supabase.from("farmers").select("*").eq("id", id).maybeSingle();
      if (existing) return { farmer: existing, created: false };
    }
    throw new HttpError(500, error.message);
  }

  if (isHelper && helperUuid) {
    try {
      await supabase.from("helper_activities").insert({
        id: `HA-${Date.now().toString().slice(-6)}`,
        helper_id: helperUuid,
        action: `Registered farmer ${id} (${input.name})`,
        category: "Registration",
        details: `Village: ${input.village}, District: ${input.district}`,
        badge_status: "Completed",
      });
    } catch (e: any) {
      console.warn("[createFarmer] Helper activity log skipped:", e.message);
    }
  }

  return { farmer: data, created: true };
}
