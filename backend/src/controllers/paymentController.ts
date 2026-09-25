import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { PaymentStage } from "../types";

export const paymentController = {
  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.paymentToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getPaymentById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        res.status(404).json({ success: false, message: "Payment not found" });
        return;
      }

      res.json({ success: true, data: mappers.paymentToDto(data) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updatePaymentStage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { nextStage, transactionRef } = req.body;

    if (!nextStage) {
      res.status(400).json({ success: false, message: "nextStage is required" });
      return;
    }

    try {
      const { data: existing, error: findErr } = await supabase
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();

      if (findErr || !existing) {
        res.status(404).json({ success: false, message: "Payment not found" });
        return;
      }

      const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const timeline = Array.isArray(existing.timeline) ? existing.timeline : [];

      const updatedTimeline = timeline.map((step: any) =>
        step.stage === nextStage
          ? { ...step, completed: true, timestamp: now }
          : step
      );

      const status = nextStage === "Closed" ? "Closed" : existing.status;

      const { data: updated, error: updateErr } = await supabase
        .from("payments")
        .update({
          current_stage: nextStage,
          status,
          timeline: updatedTimeline,
          transaction_ref: transactionRef || existing.transaction_ref,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) {
        res.status(500).json({ success: false, message: updateErr.message });
        return;
      }

      res.json({
        success: true,
        message: `Payment stage advanced to ${nextStage}`,
        data: mappers.paymentToDto(updated),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
