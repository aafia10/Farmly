import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { toUuid } from "../utils/uuid";

export const collectionController = {
  async getArrivals(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("collection_arrivals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.collectionArrivalToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createArrival(req: Request, res: Response): Promise<void> {
    const {
      farmerId,
      farmerName,
      crop,
      variety,
      declaredQuantity,
      measuredQuantity,
      unit,
      scaleId,
      scalePhotoUrl,
      moisturePercent,
      qualityGrade,
      status,
      recordedBy,
    } = req.body;

    if (!farmerName || !crop || !variety || declaredQuantity === undefined || measuredQuantity === undefined) {
      res.status(400).json({
        success: false,
        message: "Missing required collection intake weighment fields",
      });
      return;
    }

    const deterministicId = `ARR-${Date.now().toString().slice(-5)}`;

    try {
      const { data, error } = await supabase
        .from("collection_arrivals")
        .insert({
          id: deterministicId,
          farmer_registry_id: farmerId || null,
          farmer_name: farmerName,
          crop,
          variety,
          declared_quantity: declaredQuantity,
          measured_quantity: measuredQuantity,
          unit: unit || "kg",
          scale_id: scaleId || "WB-NSK-01",
          scale_photo_url: scalePhotoUrl || null,
          moisture_percent: moisturePercent || null,
          quality_grade: qualityGrade || "Standard",
          status: status || "Checked In",
          recorded_by: toUuid(req.user?.id) || "e1000000-0000-0000-0000-000000000004",
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Collection arrival logged successfully",
        data: mappers.collectionArrivalToDto(data),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
