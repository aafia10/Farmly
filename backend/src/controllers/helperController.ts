import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { toUuid } from "../utils/uuid";

export const helperController = {
  async getActivities(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("helper_activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.helperActivityToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createActivity(req: Request, res: Response): Promise<void> {
    const { action, category, details, badgeStatus } = req.body;

    if (!action || !category) {
      res.status(400).json({ success: false, message: "Missing required activity fields" });
      return;
    }

    if (req.user && req.user.role !== "helper") {
      res.status(403).json({ success: false, message: "Only users with helper role can log helper activities" });
      return;
    }

    const deterministicId = `HA-${Date.now().toString().slice(-6)}`;
    const resolvedHelperId = toUuid(req.user?.id) || "e1000000-0000-0000-0000-000000000002";

    try {
      const { data, error } = await supabase
        .from("helper_activities")
        .insert({
          id: deterministicId,
          helper_id: resolvedHelperId,
          action,
          category,
          details: details || "",
          badge_status: badgeStatus || "Completed",
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Activity logged successfully",
        data: mappers.helperActivityToDto(data),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
