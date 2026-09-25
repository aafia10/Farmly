import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";

export const transactionController = {
  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.transactionToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
