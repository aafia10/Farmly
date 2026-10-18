import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { createFarmerRecord } from "../services/farmerService";

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
    const b = req.body;
    try {
      const { farmer } = await createFarmerRecord(
        {
          id: b.id,
          name: b.name,
          mobile: b.mobile,
          village: b.village,
          taluka: b.taluka,
          district: b.district,
          state: b.state,
          language: b.language,
          farmingCategory: b.farmingCategory,
          fpo: b.fpo,
          consent: b.consent,
          verificationLevel: b.verificationLevel,
          status: b.status,
        },
        req.user
      );
      res.status(201).json({ success: true, message: "Farmer registered successfully", data: mappers.farmerToDto(farmer) });
    } catch (err: any) {
      console.error("[createFarmer] Exception:", err);
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },
};
