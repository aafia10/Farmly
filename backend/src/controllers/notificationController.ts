import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";

export const notificationController = {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.notificationToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAsRead(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({ success: true, message: "Notification marked as read" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({ success: true, message: "All notifications marked as read" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
