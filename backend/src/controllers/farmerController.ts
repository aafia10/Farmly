import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { toUuid } from "../utils/uuid";

export const farmerController = {
  async getFarmers(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      const farmers = (data || []).map(mappers.farmerToDto);
      res.json({ success: true, data: farmers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getFarmerById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        res.status(404).json({ success: false, message: "Farmer not found" });
        return;
      }

      res.json({ success: true, data: mappers.farmerToDto(data) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createFarmer(req: Request, res: Response): Promise<void> {
    const {
      id: clientId,
      name,
      mobile,
      village,
      taluka,
      district,
      state,
      language,
      farmingCategory,
      fpo,
      consent,
      verificationLevel,
      status,
    } = req.body;

    if (!name || !mobile || !village || !district || !state) {
      res.status(400).json({
        success: false,
        message: "Missing required farmer registration fields",
      });
      return;
    }

    const deterministicId = clientId || `FM-${Date.now().toString().slice(-6)}`;
    const isHelper = req.user?.role === "helper";
    const resolvedHelperUuid = isHelper ? toUuid(req.user?.id) : null;

    try {
      const { data, error } = await supabase
        .from("farmers")
        .upsert({
          id: deterministicId,
          name,
          mobile,
          village,
          taluka: taluka || "",
          district,
          state,
          language: language || "English",
          farming_category: farmingCategory || "Crops",
          fpo: fpo || null,
          consent: consent ?? true,
          verification_level: verificationLevel || "Field Verified",
          status: status || "Active",
          assisted_by_helper_id: resolvedHelperUuid,
          last_activity: new Date().toISOString(),
        }, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.error("[createFarmer] Supabase error:", error);
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      // ONLY log to helper_activities if created by an ACTUAL helper
      if (isHelper && resolvedHelperUuid) {
        try {
          await supabase.from("helper_activities").insert({
            id: `HA-${Date.now().toString().slice(-6)}`,
            helper_id: resolvedHelperUuid,
            action: `Registered farmer ${deterministicId} (${name})`,
            category: "Registration",
            details: `Village: ${village}, District: ${district}`,
            badge_status: "Completed",
          });
        } catch (e: any) {
          console.warn("[createFarmer] Helper activity log skipped:", e.message);
        }
      }

      res.status(201).json({
        success: true,
        message: "Farmer registered successfully",
        data: mappers.farmerToDto(data),
      });
    } catch (err: any) {
      console.error("[createFarmer] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
