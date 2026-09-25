import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { MixedLotItem } from "../types";

export const fpoController = {
  async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("fpo_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.fpoMemberToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMixedLots(req: Request, res: Response): Promise<void> {
    try {
      // Get composite lots from batches
      const { data: batches, error } = await supabase
        .from("batches")
        .select("*")
        .ilike("id", "%-POOLED%")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      const mixedLots: MixedLotItem[] = [];

      for (const b of (batches || [])) {
        const { data: components } = await supabase
          .from("lot_components")
          .select("*")
          .eq("parent_lot_id", b.id);

        mixedLots.push({
          id: b.id,
          name: b.variety || `Pooled ${b.crop}`,
          outputQuantity: Number(b.quantity || b.harvest_quantity || 0),
          loss: 0,
          components: (components || []).map((c) => ({
            sourceLotId: c.source_lot_id,
            sourceFarmer: c.source_farmer_name,
            quantity: Number(c.quantity),
            percentage: Number(c.percentage),
          })),
        });
      }

      // If empty in DB, return standard initial pooled structure
      if (mixedLots.length === 0) {
        mixedLots.push({
          id: "LT-MIX-01",
          name: "Sinnar Cooperative Blend A1",
          outputQuantity: 950,
          loss: 50,
          components: [
            { sourceLotId: "LT-20391", sourceFarmer: "Ramesh Patil", quantity: 500, percentage: 50 },
            { sourceLotId: "LT-20392", sourceFarmer: "Sunita Deshmukh", quantity: 500, percentage: 50 },
          ],
        });
      }

      res.json({ success: true, data: mixedLots });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createMixedLot(req: Request, res: Response): Promise<void> {
    const { name, outputQuantity, loss, components } = req.body;

    if (!name || !outputQuantity || !components || !Array.isArray(components)) {
      res.status(400).json({
        success: false,
        message: "Missing required pooled lot parameters",
      });
      return;
    }

    const deterministicId = `LT-POOLED-${Date.now().toString().slice(-5)}`;

    try {
      // 1. Create composite batch
      const { error: batchErr } = await supabase.from("batches").insert({
        id: deterministicId,
        crop_type: "Composite Blend",
        crop: "Wheat",
        variety: name,
        quantity: outputQuantity,
        harvest_quantity: outputQuantity + (loss || 0),
        unit: "kg",
        current_owner: "Sahyadri Farmers Producer Co-op",
        current_owner_name: "Sahyadri Farmers Producer Co-op",
        quality_grade: "Grade A",
        status: "Active",
        location: "Nashik Aggregation Warehouse",
      });

      if (batchErr) {
        res.status(500).json({ success: false, message: batchErr.message });
        return;
      }

      // 2. Insert components into lot_components
      for (const comp of components) {
        await supabase.from("lot_components").insert({
          parent_lot_id: deterministicId,
          source_lot_id: comp.sourceLotId,
          source_farmer_name: comp.sourceFarmer,
          quantity: comp.quantity,
          percentage: comp.percentage,
        });
      }

      const createdItem: MixedLotItem = {
        id: deterministicId,
        name,
        outputQuantity,
        loss: loss || 0,
        components,
      };

      res.status(201).json({
        success: true,
        message: "Pooled lot created successfully",
        data: createdItem,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
