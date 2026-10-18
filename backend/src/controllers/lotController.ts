import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { mappers } from "../mappers/entityMappers";
import { blockchainService, FIXED_BLOCKCHAIN_FALLBACK_HASH } from "../services/blockchainService";
import { pinataService } from "../services/pinataService";
import { toUuid } from "../utils/uuid";
import { resolveFarmer } from "../utils/farmerRegistry";

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
    const {
      id: clientId,
      farmerId,
      farmerName,
      crop,
      variety,
      quantity,
      unit,
      currentOwner,
      qualityGrade,
      status,
      location,
      assistedBy,
      parentLotId,
      weighmentScaleId,
      certificateRef,
      blockchainHash: clientBlockchainHash,
      ipfsHash: clientIpfsHash,
    } = req.body;

    if (!farmerName || !crop || quantity === undefined) {
      res.status(400).json({
        success: false,
        message: "Missing required fields for lot creation",
      });
      return;
    }

    const deterministicId = clientId || `LT-${Date.now().toString().slice(-6)}`;
    const certRef = certificateRef || `CERT-MH-${deterministicId.replace("LT-", "")}`;

    // For farmer role, enforce that the lot is created strictly under their own profile/registry
    const effectiveFarmerId = req.user?.role === "farmer" ? req.user.id : farmerId;
    const effectiveFarmerName = req.user?.role === "farmer" ? (req.user.fullName || farmerName) : farmerName;

    // Resolve farmer registry ID to prevent foreign key violation batches_farmer_registry_id_fkey
    const resolved = await resolveFarmer(effectiveFarmerId, effectiveFarmerName, req.user, location);

    // Only associate helper ID if request user is genuinely a helper
    const isHelper = req.user?.role === "helper";
    const resolvedHelperUuid = isHelper ? toUuid(req.user?.id) : null;

    try {
      let activeIpfsHash = clientIpfsHash;
      if (!activeIpfsHash) {
        console.log(`[createLot] Uploading batch ${deterministicId} metadata to Pinata IPFS...`);
        const ipfsResult = await pinataService.uploadBatchMetadata({
          batchId: deterministicId,
          farmerName: resolved.farmerName,
          farmerId: resolved.farmerUuid || undefined,
          crop,
          variety: variety || "Standard",
          quantity: Number(quantity),
          unit: unit || "kg",
          qualityGrade: qualityGrade || "Standard",
          location: location || "Nashik, Maharashtra",
          weighmentScaleId: weighmentScaleId || "WB-NSK-01",
          certificateRef: certRef,
          timestamp: new Date().toISOString(),
        });
        activeIpfsHash = ipfsResult.ipfsHash;
      }

      let activeTxHash = clientBlockchainHash;
      let anchorDetails = activeTxHash ? blockchainService.getAnchorDetails(activeTxHash) : null;

      if (!activeTxHash) {
        console.log(`[createLot] Recording batch ${deterministicId} with IPFS hash ${activeIpfsHash} on Sepolia...`);
        anchorDetails = await blockchainService.registerBatchOnChain({
          batchId: deterministicId,
          farmerName: resolved.farmerName,
          crop,
          variety: variety || "Standard",
          quantity: Number(quantity),
          unit: unit || "kg",
          qualityGrade: qualityGrade || "Standard",
          location: location || "Nashik, Maharashtra",
          ipfsHash: activeIpfsHash,
        });
        activeTxHash = anchorDetails.hash;
      }

      const insertPayload: any = {
        id: deterministicId,
        farmer_id: resolved.farmerUuid,
        farmer_registry_id: resolved.registryId,
        farmer_name: resolved.farmerName,
        crop_type: crop,
        crop,
        variety: variety || "Standard",
        harvest_quantity: quantity,
        quantity,
        unit: unit || "kg",
        current_owner: currentOwner || `${resolved.farmerName} (Farmer)`,
        current_owner_name: currentOwner || `${resolved.farmerName} (Farmer)`,
        quality_grade: qualityGrade || "Standard",
        grading: qualityGrade || "Standard",
        status: status || "Active",
        location: location || "Nashik, Maharashtra",
        assisted_by_helper_id: resolvedHelperUuid,
        parent_lot_id: parentLotId || null,
        weighment_scale_id: weighmentScaleId || "WB-NSK-01",
        certificate_ref: certRef,
        blockchain_hash: activeTxHash,
        blockchain_batch_id: deterministicId,
        initial_transaction_hash: activeTxHash,
        ipfs_hash: activeIpfsHash,
      };

      const { data, error } = await supabase
        .from("batches")
        .upsert(insertPayload, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        console.error("[createLot] Supabase error:", error);
        res.status(500).json({ success: false, message: error.message });
        return;
      }

      // ONLY log to helper_activities if the user is ACTUALLY a helper
      if (isHelper && resolvedHelperUuid) {
        try {
          await supabase.from("helper_activities").insert({
            id: `HA-${Date.now().toString().slice(-6)}`,
            helper_id: resolvedHelperUuid,
            action: `Documented lot ${deterministicId} for ${resolved.farmerName}`,
            category: "Lot Creation",
            details: `${quantity} ${unit || "kg"} of ${crop} (${qualityGrade || "Standard"})`,
            badge_status: "Completed",
          });
        } catch (e: any) {
          console.warn("[createLot] Helper activity log skipped:", e.message);
        }
      }

      res.status(201).json({
        success: true,
        message: "Lot minted and recorded on Sepolia & Pinata IPFS successfully",
        data: {
          ...mappers.lotToDto(data),
          blockchainAnchor: anchorDetails,
          ipfsHash: activeIpfsHash,
          ipfsUrl: pinataService.getGatewayUrl(activeIpfsHash),
        },
      });
    } catch (err: any) {
      console.error("[createLot] Exception:", err);
      res.status(500).json({ success: false, message: err.message });
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

      const hash = lot.blockchain_hash || blockchainService.getFallbackHash();
      const anchor = blockchainService.getAnchorDetails(hash);

      res.json({
        success: true,
        data: {
          certificateRef: lot.certificate_ref || `CERT-MH-${lot.id}`,
          lot: mappers.lotToDto(lot),
          blockchainAnchor: anchor,
          ipfsHash: lot.ipfs_hash || null,
          ipfsUrl: lot.ipfs_hash ? pinataService.getGatewayUrl(lot.ipfs_hash) : null,
          issuedBy: "Maharashtra Quality Certification Bureau & Farmly Ledger",
          issuedAt: lot.created_at,
          verificationUrl: `http://localhost:3000/verify/${lot.id}`,
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
