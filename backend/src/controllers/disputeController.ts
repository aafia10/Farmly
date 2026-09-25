import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";

export const disputeController = {
  async getDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.disputeToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getDisputeById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        res.status(404).json({ success: false, message: "Dispute not found" });
        return;
      }

      res.json({ success: true, data: mappers.disputeToDto(data) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createDispute(req: Request, res: Response): Promise<void> {
    const {
      lotId,
      farmerName,
      buyerName,
      category,
      description,
      evidence,
    } = req.body;

    if (!lotId || !farmerName || !buyerName || !category || !description) {
      res.status(400).json({
        success: false,
        message: "Missing required dispute fields",
      });
      return;
    }

    const deterministicId = `DP-${Date.now().toString().slice(-5)}`;
    const nowFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const initialTimeline = [
      {
        date: nowFormatted,
        actor: req.user?.fullName || "Field Assistant",
        action: "Dispute opened for review",
      },
    ];

    try {
      const { data, error } = await supabase
        .from("disputes")
        .insert({
          id: deterministicId,
          lot_id: lotId,
          farmer_name: farmerName,
          buyer_name: buyerName,
          category,
          description,
          evidence: evidence || [],
          status: "Open",
          resolution_timeline: initialTimeline,
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.status(201).json({
        success: true,
        message: "Dispute opened successfully",
        data: mappers.disputeToDto(data),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateDisputeStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status, actionNote } = req.body;

    try {
      const { data: existing, error: findErr } = await supabase
        .from("disputes")
        .select("*")
        .eq("id", id)
        .single();

      if (findErr || !existing) {
        res.status(404).json({ success: false, message: "Dispute not found" });
        return;
      }

      const targetStatus = status || existing.status || "Open";
      const timeline = Array.isArray(existing.resolution_timeline) ? existing.resolution_timeline : [];
      const nowFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      if (actionNote) {
        timeline.push({
          date: nowFormatted,
          actor: req.user?.fullName || "Authorized Representative",
          action: actionNote,
        });
      }

      const { data: updated, error: updateErr } = await supabase
        .from("disputes")
        .update({
          status: targetStatus,
          resolution_timeline: timeline,
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
        message: `Dispute updated to ${status}`,
        data: mappers.disputeToDto(updated),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
