import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { createCropAvailabilityRecord } from "../services/cropAvailabilityService";

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
    const b = req.body;
    try {
      const { availability } = await createCropAvailabilityRecord(
        {
          id: b.id,
          farmerId: b.farmerId,
          farmerName: b.farmerName,
          crop: b.crop,
          variety: b.variety,
          estimatedQuantity: b.estimatedQuantity,
          unit: b.unit,
          expectedHarvestDate: b.expectedHarvestDate,
          location: b.location,
          notes: b.notes,
          status: b.status,
          sowingDate: b.sowingDate,
          farmingMethod: b.farmingMethod,
          organicCertified: b.organicCertified,
          cropCategory: b.cropCategory,
          expectedPricePerKg: b.expectedPricePerKg,
        },
        req.user
      );
      res.status(201).json({ success: true, message: "Crop availability recorded successfully", data: mappers.cropAvailabilityToDto(availability) });
    } catch (err: any) {
      console.error("[createCropAvailability] Exception:", err);
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },
};
