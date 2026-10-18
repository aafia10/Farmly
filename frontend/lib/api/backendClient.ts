import {
  Farmer,
  CropAvailability,
  Lot,
  EvidenceItem,
  Offer,
  Payment,
  Dispute,
  TransactionRecord,
  NotificationItem,
  HelperActivity,
  CollectionArrival,
  QualityAssessment,
  FPOMember,
  AdminAuditAlert,
  MixedLotComponent,
} from "@/types";
import { supabase } from "@/lib/supabase";
import { FIXED_BLOCKCHAIN_FALLBACK_HASH } from "@/lib/constants";

export interface MixedLotItem {
  id: string;
  name: string;
  outputQuantity: number;
  loss: number;
  components: MixedLotComponent[];
}

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL;
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:5001/api/v1`;
  }
  return "http://localhost:5001/api/v1";
};

// Database Row to DTO Mappers for resilient Supabase direct fallback
const mappers = {
  lotToDto(row: any): Lot {
    return {
      id: row.id,
      farmerId: row.farmer_registry_id || row.farmer_id || "",
      farmerName: row.farmer_name || "Ramesh Patil",
      crop: row.crop || row.crop_type || "Wheat",
      variety: row.variety || "Standard",
      quantity: Number(row.quantity ?? row.harvest_quantity ?? 0),
      unit: row.unit || "kg",
      currentOwner: row.current_owner_name || row.current_owner || "Sahyadri Farmers Producer Co-op",
      status: row.status || "Active",
      qualityGrade: row.quality_grade || row.grading || "Standard",
      createdDate: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "17 Sep 2026",
      location: row.location || "Nashik, Maharashtra",
      parentLotId: row.parent_lot_id || undefined,
      weighmentScaleId: row.weighment_scale_id || undefined,
      certificateRef: row.certificate_ref || undefined,
      blockchainHash: row.blockchain_hash || FIXED_BLOCKCHAIN_FALLBACK_HASH,
      ipfsHash: row.ipfs_hash || undefined,
    };
  },

  farmerToDto(row: any): Farmer {
    return {
      id: row.id,
      profileId: row.profile_id || undefined,
      name: row.name || "",
      mobile: row.mobile || "",
      village: row.village || "",
      taluka: row.taluka || "",
      district: row.district || "",
      state: row.state || "",
      language: row.language || "English",
      farmingCategory: row.farming_category || "Crops",
      fpo: row.fpo || undefined,
      consent: Boolean(row.consent),
      verificationLevel: row.verification_level || "Field Verified",
      status: row.status || "Active",
      assistedByHelperId: row.assisted_by_helper_id || undefined,
      assistedBy: row.assisted_by || (row.assisted_by_helper_id ? {
        helperName: row.assisted_by_helper_id === "e1000000-0000-0000-0000-000000000002" ? "Priya Sharma" : (row.helper_name || "Field Helper"),
        date: row.assisted_at ? new Date(row.assisted_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
      } : undefined),
      lastActivity: row.last_activity ? new Date(row.last_activity).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
    };
  },

  cropAvailabilityToDto(row: any): CropAvailability {
    return {
      id: row.id,
      farmerId: row.farmer_registry_id || row.farmer_id || "",
      farmerName: row.farmer_name || "",
      crop: row.crop || "",
      variety: row.variety || "",
      estimatedQuantity: Number(row.estimated_quantity) || 0,
      unit: row.unit || "kg",
      expectedHarvestDate: row.expected_harvest_date || "",
      location: row.location || "",
      notes: row.notes || undefined,
      status: row.status || "Available",
      createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
    };
  },

  evidenceToDto(row: any): EvidenceItem {
    return {
      id: row.id,
      lotId: row.lot_id,
      farmerId: row.farmer_id || "",
      farmerName: row.farmer_name || "Farmer",
      type: row.type || "Weighment",
      category: row.category || "Evidence Backed",
      title: row.title || "",
      value: row.value || "",
      source: row.source || "Assessor-recorded",
      timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Just now",
      status: row.status || "Verified",
      issuer: row.issuer || undefined,
      documentRef: row.document_ref || undefined,
    };
  },

  offerToDto(row: any): Offer {
    const deductions = typeof row.deductions === "object" && row.deductions !== null
      ? row.deductions
      : { transport: 0, loading: 0, commission: 0, platformFee: 0, other: 0 };

    return {
      id: row.id,
      lotId: row.lot_id,
      crop: row.crop || "Agricultural Produce",
      buyerName: row.buyer_name || "",
      buyerType: row.buyer_type || "Distributor",
      offeredQuantity: Number(row.offered_quantity) || 0,
      unit: row.unit || "kg",
      pricePerKg: Number(row.price_per_kg) || 0,
      grossValue: Number(row.gross_value) || 0,
      deductions: {
        transport: Number(deductions.transport) || 0,
        loading: Number(deductions.loading) || 0,
        commission: Number(deductions.commission) || 0,
        platformFee: Number(deductions.platformFee) || 0,
        other: Number(deductions.other) || 0,
      },
      totalDeductions: Number(row.total_deductions) || 0,
      expectedNet: Number(row.expected_net) || 0,
      offerDeadline: row.offer_deadline || "",
      status: row.status || "Pending",
      createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
    };
  },

  paymentToDto(row: any): Payment {
    const timeline = Array.isArray(row.timeline) ? row.timeline : [];
    return {
      id: row.id,
      offerId: row.offer_id,
      lotId: row.lot_id,
      payerName: row.payer_name || "",
      payeeName: row.payee_name || "",
      amount: Number(row.amount) || 0,
      currentStage: row.current_stage || "Offer Accepted",
      status: row.status || "Pending",
      timeline,
      transactionRef: row.transaction_ref || undefined,
      createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
    };
  },

  disputeToDto(row: any): Dispute {
    return {
      id: row.id,
      lotId: row.lot_id,
      farmerName: row.farmer_name || "",
      buyerName: row.buyer_name || "",
      category: row.category || "Weight Mismatch",
      description: row.description || "",
      evidence: Array.isArray(row.evidence) ? row.evidence : [],
      status: row.status || "Open",
      createdDate: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
      resolutionTimeline: Array.isArray(row.resolution_timeline) ? row.resolution_timeline : [],
    };
  },

  transactionToDto(row: any): TransactionRecord {
    return {
      id: row.transaction_id || `TX-${row.id}`,
      type: row.type || "Sale",
      lotId: row.batch_id || "",
      crop: row.crop || "Wheat",
      quantity: Number(row.quantity) || 0,
      counterparty: row.counterparty || "",
      amount: Number(row.amount ?? row.price ?? 0),
      status: row.status || "Completed",
      date: row.date || (row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today"),
    };
  },

  notificationToDto(row: any): NotificationItem {
    return {
      id: row.id,
      category: row.category || "System",
      title: row.title || "",
      message: row.message || "",
      timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Just now",
      read: Boolean(row.read),
      link: row.link || "/dashboard",
    };
  },

  helperActivityToDto(row: any): HelperActivity {
    return {
      id: row.id,
      timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Just now",
      action: row.action || "",
      category: row.category || "Registration",
      details: row.details || "",
      badgeStatus: row.badge_status || "Completed",
    };
  },

  collectionArrivalToDto(row: any): CollectionArrival {
    return {
      id: row.id,
      farmerId: row.farmer_registry_id || row.farmer_id || "",
      farmerName: row.farmer_name || "",
      crop: row.crop || "",
      variety: row.variety || "",
      declaredQuantity: Number(row.declared_quantity) || 0,
      measuredQuantity: Number(row.measured_quantity) || 0,
      unit: row.unit || "kg",
      scaleId: row.scale_id || "WB-NSK-01",
      scalePhotoUrl: row.scale_photo_url || undefined,
      moisturePercent: Number(row.moisture_percent) || 0,
      qualityGrade: row.quality_grade || "Standard",
      status: row.status || "Checked In",
      timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
      recordedBy: row.recorded_by || "Collector",
    };
  },

  qualityAssessmentToDto(row: any): QualityAssessment {
    return {
      id: row.id,
      lotId: row.lot_id,
      crop: row.crop || "",
      moisturePercent: Number(row.moisture_percent) || 0,
      foreignMatterPercent: Number(row.foreign_matter_percent) || 0,
      visibleSpoilage: row.visible_spoilage || "None",
      assignedGrade: row.assigned_grade || "Standard",
      method: row.method || "NIR Spectroscopy",
      assessedBy: row.assessed_by || "QA Assessor",
      reportNotes: row.report_notes || "",
      status: row.status === "Certified" ? "Certified" : row.status === "Rejected" ? "Rejected" : "Pending",
      timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
    };
  },

  fpoMemberToDto(row: any): FPOMember {
    return {
      id: row.id,
      farmerId: row.farmer_registry_id || row.farmer_id || "",
      name: row.name || "",
      village: row.village || "",
      crops: Array.isArray(row.crops) ? row.crops : [],
      shareHolding: Number(row.share_holding) || 1,
      totalContributedKg: Number(row.total_contributed_kg) || 0,
      status: row.status || "Active",
      joinedDate: row.joined_date || "2026-01-15",
    };
  },

  adminAlertToDto(row: any): AdminAuditAlert {
    return {
      id: row.id,
      severity: row.severity || "Medium",
      category: row.category || "Payment Delay",
      description: row.description || "",
      relatedEntityId: row.related_entity_id || "",
      timestamp: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
      status: row.status || "Investigating",
    };
  },
};

export const backendClient = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("farmly_token");
  },

  setToken(token: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("farmly_token", token);
    }
  },

  clearToken() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("farmly_token");
    }
  },

  async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${getApiBaseUrl()}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || `API request failed with status ${res.status}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  },

  // ----------------------------------------------------
  // Lots
  // ----------------------------------------------------
  async getLots(): Promise<Lot[]> {
    try {
      return await this.fetchApi<Lot[]>("/lots");
    } catch {
      // Direct Supabase extraction fallback
      const { data, error } = await supabase.from("batches").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch lots from Supabase");
      return data.map(mappers.lotToDto);
    }
  },

  async createLot(lot: Partial<Lot>): Promise<Lot> {
    try {
      return await this.fetchApi<Lot>("/lots", {
        method: "POST",
        body: JSON.stringify(lot),
      });
    } catch {
      // Direct Supabase storage fallback
      const lotId = lot.id || `LT-${Date.now().toString().slice(-6)}`;
      const certRef = lot.certificateRef || `CERT-MH-${lotId.replace("LT-", "")}`;
      let resolvedFarmerId: string | null = null;
      if (lot.farmerId) {
        const { data: fRow } = await supabase
          .from("farmers")
          .select("id")
          .or(`id.eq.${lot.farmerId},profile_id.eq.${lot.farmerId}`)
          .maybeSingle();
        if (fRow?.id) {
          resolvedFarmerId = fRow.id;
        }
      }
      if (!resolvedFarmerId) {
        const { data: anyF } = await supabase.from("farmers").select("id").limit(1).maybeSingle();
        resolvedFarmerId = anyF?.id || null;
      }

      const { data, error } = await supabase
        .from("batches")
        .upsert({
          id: lotId,
          farmer_registry_id: resolvedFarmerId,
          farmer_name: lot.farmerName || "Ramesh Patil",
          crop_type: lot.crop || "Wheat",
          crop: lot.crop || "Wheat",
          variety: lot.variety || "Standard",
          harvest_quantity: lot.quantity || 0,
          quantity: lot.quantity || 0,
          unit: lot.unit || "kg",
          current_owner: lot.currentOwner || "Sahyadri Farmers Producer Co-op",
          current_owner_name: lot.currentOwner || "Sahyadri Farmers Producer Co-op",
          quality_grade: lot.qualityGrade || "Standard",
          grading: lot.qualityGrade || "Standard",
          status: lot.status || "Active",
          location: lot.location || "Nashik, Maharashtra",
          weighment_scale_id: lot.weighmentScaleId || "WB-NSK-01",
          certificate_ref: certRef,
          blockchain_hash: lot.blockchainHash || FIXED_BLOCKCHAIN_FALLBACK_HASH,
          ipfs_hash: lot.ipfsHash || null,
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create lot in Supabase");
      return mappers.lotToDto(data);
    }
  },

  async updateLotStatus(id: string, status: Lot["status"]): Promise<void> {
    try {
      await this.fetchApi(`/lots/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      await supabase.from("batches").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    }
  },

  // ----------------------------------------------------
  // Farmers
  // ----------------------------------------------------
  async getFarmers(): Promise<Farmer[]> {
    try {
      return await this.fetchApi<Farmer[]>("/farmers");
    } catch {
      const { data, error } = await supabase.from("farmers").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch farmers from Supabase");
      return data.map(mappers.farmerToDto);
    }
  },

  async createFarmer(farmer: Partial<Farmer>): Promise<Farmer> {
    try {
      return await this.fetchApi<Farmer>("/farmers", {
        method: "POST",
        body: JSON.stringify(farmer),
      });
    } catch {
      const farmerId = farmer.id || `FM-${Date.now().toString().slice(-6)}`;
      let resolvedHelperId = farmer.assistedByHelperId || null;
      if (!resolvedHelperId && typeof window !== "undefined") {
        try {
          const sess = JSON.parse(localStorage.getItem("farmly_session") || "{}");
          if (sess.role === "helper" && sess.id) {
            resolvedHelperId = sess.id;
          }
        } catch {}
      }

      const { data, error } = await supabase
        .from("farmers")
        .upsert({
          id: farmerId,
          name: farmer.name || "",
          mobile: farmer.mobile || "",
          village: farmer.village || "",
          taluka: farmer.taluka || "",
          district: farmer.district || "",
          state: farmer.state || "",
          language: farmer.language || "English",
          farming_category: farmer.farmingCategory || "Crops",
          fpo: farmer.fpo || null,
          consent: farmer.consent ?? true,
          verification_level: farmer.verificationLevel || "Field Verified",
          status: farmer.status || "Active",
          assisted_by_helper_id: resolvedHelperId,
          last_activity: new Date().toISOString(),
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create farmer in Supabase");
      return mappers.farmerToDto(data);
    }
  },

  // ----------------------------------------------------
  // Crop Availability
  // ----------------------------------------------------
  async getCropAvailabilities(): Promise<CropAvailability[]> {
    try {
      return await this.fetchApi<CropAvailability[]>("/crop-availability");
    } catch {
      const { data, error } = await supabase.from("crop_availabilities").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch crop availabilities from Supabase");
      return data.map(mappers.cropAvailabilityToDto);
    }
  },

  async createCropAvailability(item: Partial<CropAvailability>): Promise<CropAvailability> {
    try {
      return await this.fetchApi<CropAvailability>("/crop-availability", {
        method: "POST",
        body: JSON.stringify(item),
      });
    } catch {
      const id = item.id || `CA-${Date.now().toString().slice(-5)}`;
      let resolvedFarmerId: string | null = null;
      if (item.farmerId) {
        const { data: fRow } = await supabase
          .from("farmers")
          .select("id")
          .or(`id.eq.${item.farmerId},profile_id.eq.${item.farmerId}`)
          .maybeSingle();
        if (fRow?.id) {
          resolvedFarmerId = fRow.id;
        }
      }
      if (!resolvedFarmerId) {
        const { data: anyF } = await supabase.from("farmers").select("id").limit(1).maybeSingle();
        resolvedFarmerId = anyF?.id || null;
      }

      const { data, error } = await supabase
        .from("crop_availabilities")
        .upsert({
          id,
          farmer_registry_id: resolvedFarmerId,
          farmer_name: item.farmerName || "",
          crop: item.crop || "",
          variety: item.variety || "",
          estimated_quantity: item.estimatedQuantity || 0,
          unit: item.unit || "kg",
          expected_harvest_date: item.expectedHarvestDate || new Date().toISOString().split("T")[0],
          location: item.location || "",
          notes: item.notes || null,
          status: item.status || "Available",
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create crop availability in Supabase");
      return mappers.cropAvailabilityToDto(data);
    }
  },

  // ----------------------------------------------------
  // Evidence
  // ----------------------------------------------------
  async getEvidence(lotId?: string): Promise<EvidenceItem[]> {
    try {
      const q = lotId ? `?lotId=${lotId}` : "";
      return await this.fetchApi<EvidenceItem[]>(`/evidence${q}`);
    } catch {
      let query = supabase.from("evidence_items").select("*").order("created_at", { ascending: false });
      if (lotId) query = query.eq("lot_id", lotId);
      const { data, error } = await query;
      if (error || !data) throw error || new Error("Failed to fetch evidence from Supabase");
      return data.map(mappers.evidenceToDto);
    }
  },

  async addEvidence(item: Partial<EvidenceItem>): Promise<EvidenceItem> {
    try {
      return await this.fetchApi<EvidenceItem>("/evidence", {
        method: "POST",
        body: JSON.stringify(item),
      });
    } catch {
      const id = item.id || `EV-${Date.now().toString().slice(-5)}`;
      const { data, error } = await supabase
        .from("evidence_items")
        .upsert({
          id,
          lot_id: item.lotId || "",
          farmer_name: item.farmerName || "Farmer",
          type: item.type || "Weighment",
          category: item.category || "Evidence Backed",
          title: item.title || "",
          value: item.value || "",
          source: item.source || "Assessor-recorded",
          issuer: item.issuer || null,
          document_ref: item.documentRef || null,
          file_url: (item as any).fileUrl || null,
          status: item.status || "Pending",
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create evidence in Supabase");
      return mappers.evidenceToDto(data);
    }
  },

  async updateEvidenceStatus(id: string, status: EvidenceItem["status"]): Promise<void> {
    try {
      await this.fetchApi(`/evidence/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      await supabase.from("evidence_items").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    }
  },

  // ----------------------------------------------------
  // Offers
  // ----------------------------------------------------
  async getOffers(): Promise<Offer[]> {
    try {
      return await this.fetchApi<Offer[]>("/offers");
    } catch {
      const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch offers from Supabase");
      return data.map(mappers.offerToDto);
    }
  },

  async createOffer(offer: Partial<Offer>): Promise<Offer> {
    try {
      return await this.fetchApi<Offer>("/offers", {
        method: "POST",
        body: JSON.stringify(offer),
      });
    } catch {
      const offerId = offer.id || `OF-${Date.now().toString().slice(-5)}`;
      const grossValue = (offer.offeredQuantity || 0) * (offer.pricePerKg || 0);
      const deductions = offer.deductions || { transport: 0, loading: 0, commission: 0, platformFee: 0, other: 0 };
      const totalDeductions = Object.values(deductions).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      const expectedNet = grossValue - totalDeductions;
      const deadlineIso = (offer.offerDeadline && !isNaN(Date.parse(offer.offerDeadline)))
        ? new Date(offer.offerDeadline).toISOString()
        : new Date(Date.now() + 86400000 * 3).toISOString();

      const resolvedLotId = offer.lotId || "LT-20391";

      // Ensure lot exists in batches table to prevent FK constraint failure
      const { data: lotRow } = await supabase.from("batches").select("id").eq("id", resolvedLotId).maybeSingle();
      if (!lotRow) {
        await supabase.from("batches").upsert({
          id: resolvedLotId,
          farmer_name: "Ramesh Patil",
          crop_type: offer.crop || "Wheat",
          crop: offer.crop || "Wheat",
          variety: "Standard",
          quantity: offer.offeredQuantity || 100,
          unit: offer.unit || "kg",
          current_owner: "Sahyadri Farmers Producer Co-op",
          current_owner_name: "Sahyadri Farmers Producer Co-op",
          status: "Active",
          location: "Nashik, Maharashtra",
        }, { onConflict: "id" });
      }

      const { data, error } = await supabase
        .from("offers")
        .upsert({
          id: offerId,
          lot_id: resolvedLotId,
          buyer_id: "e1000000-0000-0000-0000-000000000006",
          buyer_name: offer.buyerName || "GreenHarvest Distributors",
          buyer_type: offer.buyerType || "Distributor",
          offered_quantity: offer.offeredQuantity || 0,
          unit: offer.unit || "kg",
          price_per_kg: offer.pricePerKg || 0,
          gross_value: grossValue,
          deductions,
          total_deductions: totalDeductions,
          expected_net: expectedNet,
          offer_deadline: deadlineIso,
          status: "Pending",
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create offer in Supabase");
      await supabase.from("batches").update({ status: "Under Offer" }).eq("id", resolvedLotId);
      return mappers.offerToDto(data);
    }
  },

  async acceptOffer(offerId: string, offerData?: Partial<Offer>): Promise<void> {
    try {
      await this.fetchApi(`/offers/${offerId}/accept`, {
        method: "POST",
        body: offerData ? JSON.stringify({ offer: offerData }) : undefined,
      });
    } catch {
      let { data: offer } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .maybeSingle();

      if (!offer && offerData) {
        try {
          const created = await this.createOffer({ ...offerData, id: offerId });
          offer = created as any;
        } catch {
          // Continue with best effort
        }
      }

      const { data: updatedOffer } = await supabase
        .from("offers")
        .update({ status: "Accepted", updated_at: new Date().toISOString() })
        .eq("id", offerId)
        .select()
        .maybeSingle();

      const activeOffer = updatedOffer || offer;
      if (activeOffer) {
        const lotId = activeOffer.lot_id || (activeOffer as any).lotId;
        if (lotId) {
          await supabase.from("batches").update({ status: "Sold" }).eq("id", lotId);
        }
        const paymentId = `PY-${Date.now().toString().slice(-5)}`;
        const nowFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        await supabase.from("payments").upsert({
          id: paymentId,
          offer_id: activeOffer.id,
          lot_id: lotId,
          payer_name: activeOffer.buyer_name || (activeOffer as any).buyerName || "GreenHarvest Distributors",
          payee_name: "Sahyadri Farmers Producer Co-op",
          amount: activeOffer.expected_net || (activeOffer as any).expectedNet || 0,
          current_stage: "Offer Accepted",
          status: "Pending",
          timeline: [
            { stage: "Offer Accepted", timestamp: nowFormatted, completed: true, note: "Buyer offer accepted by seller" },
            { stage: "Goods Handed Over", timestamp: "", completed: false },
            { stage: "Payment Due", timestamp: "", completed: false },
            { stage: "Payment Initiated", timestamp: "", completed: false },
            { stage: "Reference Submitted", timestamp: "", completed: false },
            { stage: "Farmer Confirmation", timestamp: "", completed: false },
            { stage: "Closed", timestamp: "", completed: false },
          ],
        }, { onConflict: "id" });
      }
    }
  },

  async rejectOffer(offerId: string, offerData?: Partial<Offer>): Promise<void> {
    try {
      await this.fetchApi(`/offers/${offerId}/reject`, {
        method: "POST",
        body: offerData ? JSON.stringify({ offer: offerData }) : undefined,
      });
    } catch {
      let { data: offer } = await supabase
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .maybeSingle();

      if (!offer && offerData) {
        try {
          const created = await this.createOffer({ ...offerData, id: offerId });
          offer = created as any;
        } catch {
          // Continue with best effort
        }
      }

      const { data: updatedOffer } = await supabase
        .from("offers")
        .update({ status: "Rejected", updated_at: new Date().toISOString() })
        .eq("id", offerId)
        .select()
        .maybeSingle();

      const activeOffer = updatedOffer || offer;
      if (activeOffer) {
        const lotId = activeOffer.lot_id || (activeOffer as any).lotId;
        if (lotId) {
          await supabase.from("batches").update({ status: "Active" }).eq("id", lotId);
        }
      }
    }
  },

  // ----------------------------------------------------
  // Payments
  // ----------------------------------------------------
  async getPayments(): Promise<Payment[]> {
    try {
      return await this.fetchApi<Payment[]>("/payments");
    } catch {
      const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch payments from Supabase");
      return data.map(mappers.paymentToDto);
    }
  },

  async updatePaymentStage(paymentId: string, nextStage: Payment["currentStage"]): Promise<void> {
    try {
      await this.fetchApi(`/payments/${paymentId}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ nextStage }),
      });
    } catch {
      const { data: existing } = await supabase.from("payments").select("*").eq("id", paymentId).single();
      if (existing) {
        const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const timeline = Array.isArray(existing.timeline) ? existing.timeline : [];
        const updatedTimeline = timeline.map((step: any) =>
          step.stage === nextStage ? { ...step, completed: true, timestamp: now } : step
        );
        await supabase.from("payments").update({
          current_stage: nextStage,
          status: nextStage === "Closed" ? "Closed" : existing.status,
          timeline: updatedTimeline,
          updated_at: new Date().toISOString(),
        }).eq("id", paymentId);
      }
    }
  },

  // ----------------------------------------------------
  // Disputes
  // ----------------------------------------------------
  async getDisputes(): Promise<Dispute[]> {
    try {
      return await this.fetchApi<Dispute[]>("/disputes");
    } catch {
      const { data, error } = await supabase.from("disputes").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch disputes from Supabase");
      return data.map(mappers.disputeToDto);
    }
  },

  async createDispute(dispute: Partial<Dispute>): Promise<Dispute> {
    try {
      return await this.fetchApi<Dispute>("/disputes", {
        method: "POST",
        body: JSON.stringify(dispute),
      });
    } catch {
      const id = dispute.id || `DP-${Date.now().toString().slice(-5)}`;
      const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const { data, error } = await supabase
        .from("disputes")
        .upsert({
          id,
          lot_id: dispute.lotId || "",
          farmer_name: dispute.farmerName || "",
          buyer_name: dispute.buyerName || "",
          category: dispute.category || "Weight Mismatch",
          description: dispute.description || "",
          evidence: dispute.evidence || [],
          status: dispute.status || "Open",
          resolution_timeline: [{ date: now, actor: "Field Assistant", action: "Dispute opened for review" }],
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create dispute in Supabase");
      return mappers.disputeToDto(data);
    }
  },

  async updateDisputeTimeline(disputeId: string, actionNote: string, status?: Dispute["status"]): Promise<void> {
    try {
      await this.fetchApi(`/disputes/${disputeId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ actionNote, status }),
      });
    } catch {
      const { data: existing } = await supabase.from("disputes").select("resolution_timeline, status").eq("id", disputeId).single();
      if (existing) {
        const currentTimeline = Array.isArray(existing.resolution_timeline) ? existing.resolution_timeline : [];
        const nowFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        currentTimeline.push({
          date: nowFormatted,
          actor: "Authorized Representative",
          action: actionNote,
        });
        await supabase.from("disputes").update({
          status: status || existing.status,
          resolution_timeline: currentTimeline,
          updated_at: new Date().toISOString(),
        }).eq("id", disputeId);
      }
    }
  },

  // ----------------------------------------------------
  // Transactions
  // ----------------------------------------------------
  async getTransactions(): Promise<TransactionRecord[]> {
    try {
      return await this.fetchApi<TransactionRecord[]>("/transactions");
    } catch {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch transactions from Supabase");
      return data.map(mappers.transactionToDto);
    }
  },

  // ----------------------------------------------------
  // Notifications
  // ----------------------------------------------------
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      return await this.fetchApi<NotificationItem[]>("/notifications");
    } catch {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch notifications from Supabase");
      return data.map(mappers.notificationToDto);
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    try {
      await this.fetchApi(`/notifications/${id}/read`, { method: "PATCH" });
    } catch {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    }
  },

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await this.fetchApi("/notifications/read-all", { method: "POST" });
    } catch {
      await supabase.from("notifications").update({ read: true }).eq("read", false);
    }
  },

  // ----------------------------------------------------
  // Helper Activities
  // ----------------------------------------------------
  async getHelperActivities(): Promise<HelperActivity[]> {
    try {
      return await this.fetchApi<HelperActivity[]>("/helper/activities");
    } catch {
      const { data, error } = await supabase.from("helper_activities").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch helper activities from Supabase");
      return data.map(mappers.helperActivityToDto);
    }
  },

  async addHelperActivity(activity: Partial<HelperActivity>): Promise<void> {
    try {
      await this.fetchApi("/helper/activities", {
        method: "POST",
        body: JSON.stringify(activity),
      });
    } catch {
      const id = activity.id || `HA-${Date.now().toString().slice(-6)}`;
      await supabase.from("helper_activities").insert({
        id,
        helper_id: "e1000000-0000-0000-0000-000000000002",
        action: activity.action || "",
        category: activity.category || "Registration",
        details: activity.details || "",
        badge_status: activity.badgeStatus || "Completed",
      });
    }
  },

  // ----------------------------------------------------
  // Collection Arrivals
  // ----------------------------------------------------
  async getCollectionArrivals(): Promise<CollectionArrival[]> {
    try {
      return await this.fetchApi<CollectionArrival[]>("/collection/arrivals");
    } catch {
      const { data, error } = await supabase.from("collection_arrivals").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch arrivals from Supabase");
      return data.map(mappers.collectionArrivalToDto);
    }
  },

  async addCollectionArrival(arrival: Partial<CollectionArrival>): Promise<CollectionArrival> {
    try {
      return await this.fetchApi<CollectionArrival>("/collection/arrivals", {
        method: "POST",
        body: JSON.stringify(arrival),
      });
    } catch {
      const id = arrival.id || `ARR-${Date.now().toString().slice(-5)}`;
      const { data, error } = await supabase
        .from("collection_arrivals")
        .upsert({
          id,
          farmer_registry_id: arrival.farmerId || null,
          farmer_name: arrival.farmerName || "",
          crop: arrival.crop || "",
          variety: arrival.variety || "",
          declared_quantity: arrival.declaredQuantity || 0,
          measured_quantity: arrival.measuredQuantity || 0,
          unit: arrival.unit || "kg",
          scale_id: arrival.scaleId || "WB-NSK-01",
          scale_photo_url: arrival.scalePhotoUrl || null,
          moisture_percent: arrival.moisturePercent || null,
          quality_grade: arrival.qualityGrade || "Standard",
          status: arrival.status || "Checked In",
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create collection arrival in Supabase");
      return mappers.collectionArrivalToDto(data);
    }
  },

  // ----------------------------------------------------
  // Quality Assessments
  // ----------------------------------------------------
  async getQualityAssessments(): Promise<QualityAssessment[]> {
    try {
      return await this.fetchApi<QualityAssessment[]>("/quality/assessments");
    } catch {
      const { data, error } = await supabase.from("quality_assessments").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch quality assessments from Supabase");
      return data.map(mappers.qualityAssessmentToDto);
    }
  },

  async addQualityAssessment(assessment: Partial<QualityAssessment>): Promise<QualityAssessment> {
    try {
      return await this.fetchApi<QualityAssessment>("/quality/assessments", {
        method: "POST",
        body: JSON.stringify(assessment),
      });
    } catch {
      const id = assessment.id || `QA-${Date.now().toString().slice(-5)}`;
      const { data, error } = await supabase
        .from("quality_assessments")
        .upsert({
          id,
          lot_id: assessment.lotId || "",
          crop: assessment.crop || "",
          moisture_percent: assessment.moisturePercent || 0,
          foreign_matter_percent: assessment.foreignMatterPercent || 0,
          visible_spoilage: assessment.visibleSpoilage || "None",
          assigned_grade: assessment.assignedGrade || "Standard",
          method: assessment.method || "NIR Spectroscopy",
          report_notes: assessment.reportNotes || null,
          status: assessment.status || "Certified",
        }, { onConflict: "id" })
        .select()
        .single();

      if (error || !data) throw error || new Error("Failed to create quality assessment in Supabase");
      return mappers.qualityAssessmentToDto(data);
    }
  },

  // ----------------------------------------------------
  // FPO
  // ----------------------------------------------------
  async getFpoMembers(): Promise<FPOMember[]> {
    try {
      return await this.fetchApi<FPOMember[]>("/fpo/members");
    } catch {
      const { data, error } = await supabase.from("fpo_members").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch FPO members from Supabase");
      return data.map(mappers.fpoMemberToDto);
    }
  },

  async getMixedLots(): Promise<MixedLotItem[]> {
    try {
      return await this.fetchApi<MixedLotItem[]>("/fpo/mixed-lots");
    } catch {
      return [
        {
          id: "LT-MIX-01",
          name: "Sinnar Cooperative Blend A1",
          outputQuantity: 950,
          loss: 50,
          components: [
            { sourceLotId: "LT-20391", sourceFarmer: "Ramesh Patil", quantity: 500, percentage: 50 },
            { sourceLotId: "LT-20392", sourceFarmer: "Sunita Deshmukh", quantity: 500, percentage: 50 },
          ],
        },
      ];
    }
  },

  // ----------------------------------------------------
  // Admin Alerts
  // ----------------------------------------------------
  async getAdminAlerts(): Promise<AdminAuditAlert[]> {
    try {
      return await this.fetchApi<AdminAuditAlert[]>("/admin/alerts");
    } catch {
      const { data, error } = await supabase.from("admin_alerts").select("*").order("created_at", { ascending: false });
      if (error || !data) throw error || new Error("Failed to fetch alerts from Supabase");
      return data.map(mappers.adminAlertToDto);
    }
  },

  async resolveAdminAlert(id: string): Promise<void> {
    try {
      await this.fetchApi(`/admin/alerts/${id}/resolve`, { method: "PATCH" });
    } catch {
      await supabase.from("admin_alerts").update({ status: "Resolved" }).eq("id", id);
    }
  },

  // ----------------------------------------------------
  // AgroSathi & Mandi
  // ----------------------------------------------------
  async queryAgroSathi(query: string): Promise<{ query: string; answer: string }> {
    try {
      return await this.fetchApi<{ query: string; answer: string }>("/agrosathi/query", {
        method: "POST",
        body: JSON.stringify({ query }),
      });
    } catch {
      return {
        query,
        answer: "AgroSathi Digital Assistant: Your farm records and APMC quality grades are synchronized on Farmly. Contact your field assistant Priya Sharma for on-ground verification.",
      };
    }
  },

  async getMandiBenchmarks() {
    try {
      return await this.fetchApi("/mandi/benchmarks");
    } catch {
      return [];
    }
  },

  // ----------------------------------------------------
  // Authentication
  // ----------------------------------------------------
  async login(payload: { email?: string; password?: string; role?: string }): Promise<{ user: any; token: string }> {
    return await this.fetchApi<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async signup(payload: any): Promise<{ user: any; token: string }> {
    return await this.fetchApi<{ user: any; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
