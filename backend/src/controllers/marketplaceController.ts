import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";

export const marketplaceController = {
  async getListings(req: Request, res: Response): Promise<void> {
    try {
      // Return lots that are either Active or Listed
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .in("status", ["Active", "Listed", "Under Offer"])
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.lotToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
