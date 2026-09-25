import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { toUuid } from "../utils/uuid";

export const evidenceController = {
  async getEvidence(req: Request, res: Response): Promise<void> {
    const { lotId } = req.query;

    try {
      let query = supabase.from("evidence_items").select("*").order("created_at", { ascending: false });

      if (lotId && typeof lotId === "string") {
        query = query.eq("lot_id", lotId);
      }

      const { data, error } = await query;

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.evidenceToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async addEvidence(req: Request, res: Response): Promise<void> {
    const { id: clientId, lotId, farmerId, farmerName, type, category, title, value, source, issuer, documentRef, fileUrl, status } = req.body;

    if (!lotId || !type || !title || !value) {
      res.status(400).json({
        success: false,
        message: "Missing required evidence fields",
      });
      return;
    }

    const deterministicId = clientId || `EV-${Date.now().toString().slice(-5)}`;
    const resolvedFarmerUuid = toUuid(farmerId);

    try {
      let { data, error } = await supabase
        .from("evidence_items")
        .upsert({
          id: deterministicId,
          lot_id: lotId,
          farmer_id: resolvedFarmerUuid,
          farmer_name: farmerName || "Farmer",
          type,
          category: category || "Evidence Backed",
          title,
          value,
          source: source || "Assessor-recorded",
          issuer: issuer || null,
          document_ref: documentRef || null,
          file_url: fileUrl || null,
          status: status || "Pending",
        }, { onConflict: "id" })
        .select()
        .single();

      // If foreign key race condition occurred (batch row still committing), retry after 350ms
      if (error && (error.code === "23503" || error.message?.includes("batches"))) {
        console.warn(`[addEvidence] FK race condition detected for lot ${lotId}. Retrying in 350ms...`);
        await new Promise((resolve) => setTimeout(resolve, 350));
        const retryRes = await supabase
          .from("evidence_items")
          .upsert({
            id: deterministicId,
            lot_id: lotId,
            farmer_id: resolvedFarmerUuid,
            farmer_name: farmerName || "Farmer",
            type,
            category: category || "Evidence Backed",
            title,
            value,
            source: source || "Assessor-recorded",
            issuer: issuer || null,
            document_ref: documentRef || null,
            file_url: fileUrl || null,
            status: status || "Pending",
          }, { onConflict: "id" })
          .select()
          .single();

        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.error("[addEvidence] Supabase error:", error);
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      // ONLY log to helper_activities if the user is ACTUALLY a helper
      if (req.user?.role === "helper") {
        const resolvedHelperUuid = toUuid(req.user.id);
        if (resolvedHelperUuid) {
          try {
            await supabase.from("helper_activities").insert({
              id: `HA-${Date.now().toString().slice(-6)}`,
              helper_id: resolvedHelperUuid,
              action: `Uploaded ${type} evidence for lot ${lotId}`,
              category: "Evidence",
              details: `${title}: ${value}`,
              badge_status: "Completed",
            });
          } catch (e: any) {
            console.warn("[addEvidence] Helper activity log skipped:", e.message);
          }
        }
      }

      res.status(201).json({
        success: true,
        message: "Evidence recorded successfully",
        data: mappers.evidenceToDto(data),
      });
    } catch (err: any) {
      console.error("[addEvidence] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateEvidenceStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: "Status is required" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("evidence_items")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        message: `Evidence status updated to ${status}`,
        data: mappers.evidenceToDto(data),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
