import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { certificateService, traceUrl } from "../services/certificateService";
import { createLotRecord } from "../services/lotService";
import { blockchainService } from "../services/blockchainService";
import { pinataService } from "../services/pinataService";

export const lotController = {
  async getLots(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[getLots] Supabase error:", error);
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        data: (data || []).map(mappers.lotToDto),
      });
    } catch (err: any) {
      console.error("[getLots] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLotById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        res.status(404).json({ success: false, message: "Lot not found" });
        return;
      }

      res.json({
        success: true,
        data: mappers.lotToDto(data),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async createLot(req: Request, res: Response): Promise<void> {
    const b = req.body;
    try {
      const { lot, anchor } = await createLotRecord(
        {
          id: b.id,
          farmerId: b.farmerId,
          farmerName: b.farmerName,
          crop: b.crop,
          variety: b.variety,
          quantity: b.quantity,
          unit: b.unit,
          currentOwner: b.currentOwner,
          qualityGrade: b.qualityGrade,
          status: b.status,
          location: b.location,
          parentLotId: b.parentLotId,
          weighmentScaleId: b.weighmentScaleId,
          certificateRef: b.certificateRef,
          harvestDate: b.harvestDate,
          sowingDate: b.sowingDate,
          farmingMethod: b.farmingMethod,
          organicCertified: b.organicCertified,
          cropCategory: b.cropCategory,
          pricePerKg: b.pricePerKg,
          ipfsHash: b.ipfsHash,
          blockchainHash: b.blockchainHash,
        },
        req.user
      );
      res.status(201).json({
        success: true,
        message: anchor && !anchor.simulated
          ? "Lot minted and recorded on Sepolia & Pinata IPFS successfully"
          : "Lot minted successfully (blockchain/IPFS anchoring not configured)",
        data: {
          ...mappers.lotToDto(lot),
          blockchainAnchor: anchor?.blockchainAnchor ?? null,
          ipfsHash: anchor?.ipfsHash ?? lot.ipfs_hash ?? null,
          ipfsUrl: anchor?.ipfsUrl ?? (lot.ipfs_hash ? pinataService.getGatewayUrl(lot.ipfs_hash) : null),
          anchorSimulated: anchor?.simulated ?? false,
        },
      });
    } catch (err: any) {
      console.error("[createLot] Exception:", err);
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
  },

  async updateLotStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: "Status is required" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("batches")
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
        message: `Lot status updated to ${status}`,
        data: mappers.lotToDto(data),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLotLineage(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { data: lot } = await supabase
        .from("batches")
        .select("*")
        .eq("id", id)
        .single();

      const { data: components } = await supabase
        .from("lot_components")
        .select("*")
        .eq("parent_lot_id", id);

      res.json({
        success: true,
        data: {
          lot: lot ? mappers.lotToDto(lot) : null,
          components: components || [],
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getLotCertificate(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const { data: lot } = await supabase
        .from("batches")
        .select("*")
        .eq("id", id)
        .single();

      if (!lot) {
        res.status(404).json({ success: false, message: "Lot not found" });
        return;
      }

      // Only report certificates that actually exist; never a placeholder hash or issuer.
      let trace = null;
      try {
        trace = await certificateService.getPublicTrace(lot.id);
      } catch (e: any) {
        console.warn("[getLotCertificate] certificate chain unavailable:", e.message);
      }

      res.json({
        success: true,
        data: {
          lot: mappers.lotToDto(lot),
          certificates: trace?.certificates ?? [],
          transfers: trace?.transfers ?? [],
          verificationUrl: traceUrl(lot.id),
          blockchainAnchor: lot.blockchain_hash ? blockchainService.getAnchorDetails(lot.blockchain_hash) : null,
          ipfsHash: lot.ipfs_hash || null,
          ipfsUrl: lot.ipfs_hash ? pinataService.getGatewayUrl(lot.ipfs_hash) : null,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async pinMetadata(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const result = await pinataService.uploadBatchMetadata({
        batchId: payload.batchId || `LT-${Date.now().toString().slice(-6)}`,
        farmerName: payload.farmerName || "Farmer",
        crop: payload.crop || "Crop",
        variety: payload.variety || "Standard",
        quantity: Number(payload.quantity) || 0,
        unit: payload.unit || "kg",
        qualityGrade: payload.qualityGrade || "Standard",
        location: payload.location || "Nashik, Maharashtra",
        certificateRef: payload.certificateRef,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        ipfsHash: result.ipfsHash,
        gatewayUrl: pinataService.getGatewayUrl(result.ipfsHash),
        isMock: result.isMock,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
