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
} from "../types";

export const mappers = {
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
      farmingMethod: row.farming_method || undefined,
      organicCertified: row.organic_certified ?? undefined,
      cropCategory: row.crop_category || undefined,
      sowingDate: row.sowing_date || undefined,
      expectedPricePerKg: row.expected_price_per_kg != null ? Number(row.expected_price_per_kg) : undefined,
      createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
    };
  },

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
      blockchainHash: row.blockchain_hash || undefined,
      farmingMethod: row.farming_method || undefined,
      organicCertified: row.organic_certified ?? undefined,
      cropCategory: row.crop_category || undefined,
      sowingDate: row.sowing_date || undefined,
      harvestDate: row.harvest_date || undefined,
      pricePerKg: Number(row.price_per_kg) > 0 ? Number(row.price_per_kg) : undefined,
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
      fileUrl: row.file_url || undefined,
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
    const timeline = Array.isArray(row.resolution_timeline) ? row.resolution_timeline : [];
    const evidence = Array.isArray(row.evidence) ? row.evidence : [];

    return {
      id: row.id,
      lotId: row.lot_id,
      farmerName: row.farmer_name || "",
      buyerName: row.buyer_name || "",
      category: row.category || "Weight Mismatch",
      description: row.description || "",
      evidence,
      status: row.status || "Open",
      createdDate: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
      resolutionTimeline: timeline,
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
      blockchainHash: row.blockchain_hash || undefined,
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
