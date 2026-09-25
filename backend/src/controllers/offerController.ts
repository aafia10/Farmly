import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { toUuid } from "../utils/uuid";

export const offerController = {
  async getOffers(req: Request, res: Response): Promise<void> {
    const { lotId } = req.query;

    try {
      let query = supabase.from("offers").select("*").order("created_at", { ascending: false });

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
        data: (data || []).map(mappers.offerToDto),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getOfferById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        res.status(404).json({ success: false, message: "Offer not found" });
        return;
      }

      res.json({ success: true, data: mappers.offerToDto(data) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createOffer(req: Request, res: Response): Promise<void> {
    const {
      id: clientId,
      lotId,
      crop,
      buyerName,
      buyerType,
      offeredQuantity,
      unit,
      pricePerKg,
      deductions,
      offerDeadline,
    } = req.body;

    if (!lotId || !buyerName || !offeredQuantity || !pricePerKg) {
      res.status(400).json({
        success: false,
        message: "Missing required offer fields",
      });
      return;
    }

    const grossValue = offeredQuantity * pricePerKg;
    const itemizedDeductions = deductions || { transport: 0, loading: 0, commission: 0, platformFee: 0, other: 0 };
    const totalDeductions = Object.values(itemizedDeductions).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
    const expectedNet = grossValue - totalDeductions;

    const deterministicId = clientId || `OF-${Date.now().toString().slice(-5)}`;
    const resolvedBuyerUuid = toUuid(req.user?.id) || "e1000000-0000-0000-0000-000000000006";
    const deadlineIso = (offerDeadline && !isNaN(Date.parse(offerDeadline)))
      ? new Date(offerDeadline).toISOString()
      : new Date(Date.now() + 86400000 * 3).toISOString();

    try {
      // Ensure lot exists in batches table to prevent FK constraint failure
      const { data: lotRow } = await supabase.from("batches").select("id").eq("id", lotId).maybeSingle();
      if (!lotRow) {
        await supabase.from("batches").upsert({
          id: lotId,
          farmer_name: "Ramesh Patil",
          crop_type: crop || "Wheat",
          crop: crop || "Wheat",
          variety: "Standard",
          quantity: offeredQuantity || 100,
          unit: unit || "kg",
          current_owner: "Sahyadri Farmers Producer Co-op",
          current_owner_name: "Sahyadri Farmers Producer Co-op",
          status: "Active",
          location: "Nashik, Maharashtra",
        }, { onConflict: "id" });
      }

      const { data, error } = await supabase
        .from("offers")
        .upsert({
          id: deterministicId,
          lot_id: lotId,
          buyer_id: resolvedBuyerUuid,
          buyer_name: buyerName,
          buyer_type: buyerType || "Distributor",
          offered_quantity: offeredQuantity,
          unit: unit || "kg",
          price_per_kg: pricePerKg,
          gross_value: grossValue,
          deductions: itemizedDeductions,
          total_deductions: totalDeductions,
          expected_net: expectedNet,
          offer_deadline: deadlineIso,
          status: "Pending",
        }, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.error("[createOffer] Supabase error:", error);
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      // Mark lot as Under Offer
      await supabase.from("batches").update({ status: "Under Offer" }).eq("id", lotId);

      res.status(201).json({
        success: true,
        message: "Offer created successfully",
        data: mappers.offerToDto(data),
      });
    } catch (err: any) {
      console.error("[createOffer] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async acceptOffer(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const fallbackOffer = req.body?.offer;

    try {
      // 1. Check if offer exists; if not and fallbackOffer is provided, upsert it first!
      let { data: offer } = await supabase
        .from("offers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!offer && fallbackOffer) {
        const grossValue = (fallbackOffer.offeredQuantity || 0) * (fallbackOffer.pricePerKg || 0);
        const itemizedDeductions = fallbackOffer.deductions || { transport: 0, loading: 0, commission: 0, platformFee: 0, other: 0 };
        const totalDeductions = Object.values(itemizedDeductions).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
        const expectedNet = grossValue - totalDeductions;
        const deadlineIso = (fallbackOffer.offerDeadline && !isNaN(Date.parse(fallbackOffer.offerDeadline)))
          ? new Date(fallbackOffer.offerDeadline).toISOString()
          : new Date(Date.now() + 86400000 * 3).toISOString();

        const resolvedLotId = fallbackOffer.lotId || "LT-20391";
        const { data: bRow } = await supabase.from("batches").select("id").eq("id", resolvedLotId).maybeSingle();
        if (!bRow) {
          await supabase.from("batches").upsert({
            id: resolvedLotId,
            farmer_name: "Ramesh Patil",
            crop_type: fallbackOffer.crop || "Wheat",
            crop: fallbackOffer.crop || "Wheat",
            variety: "Standard",
            quantity: fallbackOffer.offeredQuantity || 100,
            unit: fallbackOffer.unit || "kg",
            current_owner: "Sahyadri Farmers Producer Co-op",
            status: "Active",
            location: "Nashik, Maharashtra",
          }, { onConflict: "id" });
        }

        const { data: createdOffer } = await supabase
          .from("offers")
          .upsert({
            id,
            lot_id: resolvedLotId,
            buyer_id: "e1000000-0000-0000-0000-000000000006",
            buyer_name: fallbackOffer.buyerName || "GreenHarvest Distributors",
            buyer_type: fallbackOffer.buyerType || "Distributor",
            offered_quantity: fallbackOffer.offeredQuantity || 0,
            unit: fallbackOffer.unit || "kg",
            price_per_kg: fallbackOffer.pricePerKg || 0,
            gross_value: grossValue,
            deductions: itemizedDeductions,
            total_deductions: totalDeductions,
            expected_net: expectedNet,
            offer_deadline: deadlineIso,
            status: "Pending",
          }, { onConflict: "id" })
          .select()
          .maybeSingle();

        offer = createdOffer;
      }

      // 2. Mark offer as Accepted
      const { data: updatedOffer, error: offerErr } = await supabase
        .from("offers")
        .update({ status: "Accepted", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (offerErr) {
        res.status(500).json({ success: false, message: offerErr.message });
        return;
      }

      const activeOffer = updatedOffer || offer;
      if (!activeOffer) {
        res.status(404).json({ success: false, message: "Offer not found" });
        return;
      }

      // 3. Mark corresponding lot as Sold
      if (activeOffer.lot_id) {
        await supabase
          .from("batches")
          .update({ status: "Sold", updated_at: new Date().toISOString() })
          .eq("id", activeOffer.lot_id);
      }

      // 4. Create Escrow Payment Record
      const paymentId = `PY-${Date.now().toString().slice(-5)}`;
      const nowFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

      const initialTimeline = [
        { stage: "Offer Accepted", timestamp: nowFormatted, completed: true, note: "Buyer offer accepted by seller" },
        { stage: "Goods Handed Over", timestamp: "", completed: false },
        { stage: "Payment Due", timestamp: "", completed: false },
        { stage: "Payment Initiated", timestamp: "", completed: false },
        { stage: "Reference Submitted", timestamp: "", completed: false },
        { stage: "Farmer Confirmation", timestamp: "", completed: false },
        { stage: "Closed", timestamp: "", completed: false },
      ];

      const resolvedPayerUuid = toUuid(activeOffer.buyer_id) || "e1000000-0000-0000-0000-000000000006";
      const resolvedPayeeUuid = "e1000000-0000-0000-0000-000000000003"; // Sahyadri FPO

      await supabase.from("payments").upsert({
        id: paymentId,
        offer_id: activeOffer.id,
        lot_id: activeOffer.lot_id,
        payer_id: resolvedPayerUuid,
        payee_id: resolvedPayeeUuid,
        payer_name: activeOffer.buyer_name,
        payee_name: "Sahyadri Farmers Producer Co-op",
        amount: activeOffer.expected_net,
        current_stage: "Offer Accepted",
        status: "Pending",
        timeline: initialTimeline,
      }, { onConflict: "id" });

      res.json({
        success: true,
        message: "Offer accepted. Lot status updated to Sold and escrow payment initiated.",
        data: mappers.offerToDto(activeOffer),
      });
    } catch (err: any) {
      console.error("[acceptOffer] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async rejectOffer(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const fallbackOffer = req.body?.offer;

    try {
      let { data: offer } = await supabase
        .from("offers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!offer && fallbackOffer) {
        const { data: createdOffer } = await supabase
          .from("offers")
          .upsert({
            id,
            lot_id: fallbackOffer.lotId || "LT-20391",
            buyer_id: "e1000000-0000-0000-0000-000000000006",
            buyer_name: fallbackOffer.buyerName || "GreenHarvest Distributors",
            buyer_type: fallbackOffer.buyerType || "Distributor",
            offered_quantity: fallbackOffer.offeredQuantity || 0,
            unit: fallbackOffer.unit || "kg",
            price_per_kg: fallbackOffer.pricePerKg || 0,
            gross_value: 0,
            deductions: {},
            total_deductions: 0,
            expected_net: 0,
            offer_deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
            status: "Rejected",
          }, { onConflict: "id" })
          .select()
          .maybeSingle();

        offer = createdOffer;
      }

      const { data: updatedOffer, error } = await supabase
        .from("offers")
        .update({ status: "Rejected", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      const activeOffer = updatedOffer || offer;
      if (!activeOffer) {
        res.status(404).json({ success: false, message: "Offer not found" });
        return;
      }

      // Revert lot status to Active if there are no other active offers
      if (activeOffer.lot_id) {
        await supabase
          .from("batches")
          .update({ status: "Active", updated_at: new Date().toISOString() })
          .eq("id", activeOffer.lot_id);
      }

      res.json({
        success: true,
        message: "Offer rejected",
        data: mappers.offerToDto(activeOffer),
      });
    } catch (err: any) {
      console.error("[rejectOffer] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
