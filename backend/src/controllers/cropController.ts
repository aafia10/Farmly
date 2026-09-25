import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { toUuid } from "../utils/uuid";
import { resolveFarmer } from "../utils/farmerRegistry";

export const cropController = {
  async getCropAvailabilities(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("crop_availabilities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.cropAvailabilityToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createCropAvailability(req: Request, res: Response): Promise<void> {
    const {
      id: clientId,
      farmerId,
      farmerName,
      crop,
      variety,
      estimatedQuantity,
      unit,
      expectedHarvestDate,
      location,
      notes,
      status,
    } = req.body;

    if (!farmerName || !crop || !variety || !estimatedQuantity || !expectedHarvestDate || !location) {
      res.status(400).json({
        success: false,
        message: "Missing required fields for crop availability",
      });
      return;
    }

    const deterministicId = clientId || `CA-${Date.now().toString().slice(-5)}`;
    const resolved = await resolveFarmer(farmerId, farmerName, req.user, location);
    const isHelper = req.user?.role === "helper";
    const resolvedHelperUuid = isHelper ? toUuid(req.user?.id) : null;

    try {
      const { data, error } = await supabase
        .from("crop_availabilities")
        .upsert({
          id: deterministicId,
          farmer_id: resolved.farmerUuid,
          farmer_registry_id: resolved.registryId,
          farmer_name: resolved.farmerName,
          crop,
          variety,
          estimated_quantity: estimatedQuantity,
          unit: unit || "kg",
          expected_harvest_date: expectedHarvestDate,
          location,
          notes: notes || null,
          status: status || "Available",
        }, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.error("[createCropAvailability] Supabase error:", error);
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      // ONLY log to helper_activities if the user is ACTUALLY a helper
      if (isHelper && resolvedHelperUuid) {
        try {
          await supabase.from("helper_activities").insert({
            id: `HA-${Date.now().toString().slice(-6)}`,
            helper_id: resolvedHelperUuid,
            action: `Recorded crop availability for ${resolved.farmerName}`,
            category: "Crop Availability",
            details: `${estimatedQuantity} ${unit || "kg"} of ${crop} (${variety})`,
            badge_status: "Completed",
          });
        } catch (e: any) {
          console.warn("[createCropAvailability] Helper activity log skipped:", e.message);
        }
      }

      res.status(201).json({
        success: true,
        message: "Crop availability recorded successfully",
        data: mappers.cropAvailabilityToDto(data),
      });
    } catch (err: any) {
      console.error("[createCropAvailability] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
