import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { toUuid } from "../utils/uuid";

export const qualityController = {
  async getAssessments(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("quality_assessments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.qualityAssessmentToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createAssessment(req: Request, res: Response): Promise<void> {
    const {
      lotId,
      crop,
      moisturePercent,
      foreignMatterPercent,
      visibleSpoilage,
      assignedGrade,
      method,
      assessorName,
      reportNotes,
      status,
    } = req.body;

    if (!lotId || !crop || moisturePercent === undefined || foreignMatterPercent === undefined || !assignedGrade) {
      res.status(400).json({
        success: false,
        message: "Missing required quality assessment parameters",
      });
      return;
    }

    const deterministicId = `QA-${Date.now().toString().slice(-5)}`;

    try {
      const { data, error } = await supabase
        .from("quality_assessments")
        .insert({
          id: deterministicId,
          lot_id: lotId,
          crop,
          moisture_percent: moisturePercent,
          foreign_matter_percent: foreignMatterPercent,
          visible_spoilage: visibleSpoilage || "None",
          assigned_grade: assignedGrade,
          method: method || "NIR Spectroscopy",
          assessed_by: toUuid(req.user?.id) || "e1000000-0000-0000-0000-000000000005",
          report_notes: reportNotes || null,
          status: status || "Certified",
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      // Also update the lot quality_grade in batches table
      await supabase
        .from("batches")
        .update({
          quality_grade: assignedGrade,
          grading: assignedGrade,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lotId);

      res.status(201).json({
        success: true,
        message: "Quality assessment certified and logged",
        data: mappers.qualityAssessmentToDto(data),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
