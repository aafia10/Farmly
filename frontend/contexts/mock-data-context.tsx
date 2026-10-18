"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
import {
  INITIAL_FARMERS,
  INITIAL_CROP_AVAILABILITIES,
  INITIAL_LOTS,
  INITIAL_EVIDENCE,
  INITIAL_OFFERS,
  INITIAL_PAYMENTS,
  INITIAL_DISPUTES,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_HELPER_ACTIVITIES,
  INITIAL_COLLECTION_ARRIVALS,
  INITIAL_QUALITY_ASSESSMENTS,
  INITIAL_FPO_MEMBERS,
  INITIAL_ADMIN_ALERTS,
  INITIAL_MIXED_LOTS,
} from "@/lib/mock-data";
import { backendClient } from "@/lib/api/backendClient";
import { FIXED_BLOCKCHAIN_FALLBACK_HASH } from "@/lib/constants";

const isHelperUser = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const session = localStorage.getItem("farmly_session");
    if (!session) return false;
    const parsed = JSON.parse(session);
    return parsed?.role === "helper";
  } catch {
    return false;
  }
};

export interface MixedLotItem {
  id: string;
  name: string;
  outputQuantity: number;
  loss: number;
  components: MixedLotComponent[];
}

interface MockDataContextType {
  farmers: Farmer[];
  addFarmer: (farmerData: Omit<Farmer, "id" | "lastActivity">) => Farmer;
  cropAvailabilities: CropAvailability[];
  addCropAvailability: (item: Omit<CropAvailability, "id" | "createdAt">) => CropAvailability;
  lots: Lot[];
  createLot: (lotData: Partial<Lot> & Omit<Lot, "createdDate">) => Lot;
  updateLotStatus: (lotId: string, status: Lot["status"]) => void;
  evidence: EvidenceItem[];
  addEvidence: (item: Omit<EvidenceItem, "id" | "timestamp">) => EvidenceItem;
  updateEvidenceStatus: (id: string, status: EvidenceItem["status"]) => void;
  offers: Offer[];
  createOffer: (offerData: Partial<Offer>) => Offer;
  acceptOffer: (offerId: string) => void;
  rejectOffer: (offerId: string) => void;
  payments: Payment[];
  updatePaymentStage: (paymentId: string, nextStage: Payment["currentStage"]) => void;
  disputes: Dispute[];
  createDispute: (disputeData: Omit<Dispute, "id" | "createdDate" | "resolutionTimeline">) => Dispute;
  addDisputeEvidence: (disputeId: string, note: string) => void;
  transactions: TransactionRecord[];
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  helperActivities: HelperActivity[];
  addHelperActivity: (activity: Omit<HelperActivity, "id">) => void;
  collectionArrivals: CollectionArrival[];
  addCollectionArrival: (arrival: Omit<CollectionArrival, "id" | "timestamp">) => CollectionArrival;
  qualityAssessments: QualityAssessment[];
  addQualityAssessment: (assessment: Omit<QualityAssessment, "id" | "timestamp">) => QualityAssessment;
  fpoMembers: FPOMember[];
  adminAlerts: AdminAuditAlert[];
  resolveAdminAlert: (id: string) => void;
  mixedLots: MixedLotItem[];
  resetAllData: () => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

const inFlightLotCreations = new Map<string, Promise<any>>();

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const [farmers, setFarmers] = useState<Farmer[]>(INITIAL_FARMERS);
  const [cropAvailabilities, setCropAvailabilities] = useState<CropAvailability[]>(INITIAL_CROP_AVAILABILITIES);
  const [lots, setLots] = useState<Lot[]>(INITIAL_LOTS);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(INITIAL_EVIDENCE);
  const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [disputes, setDisputes] = useState<Dispute[]>(INITIAL_DISPUTES);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [helperActivities, setHelperActivities] = useState<HelperActivity[]>(INITIAL_HELPER_ACTIVITIES);
  const [collectionArrivals, setCollectionArrivals] = useState<CollectionArrival[]>(INITIAL_COLLECTION_ARRIVALS);
  const [qualityAssessments, setQualityAssessments] = useState<QualityAssessment[]>(INITIAL_QUALITY_ASSESSMENTS);
  const [fpoMembers, setFpoMembers] = useState<FPOMember[]>(INITIAL_FPO_MEMBERS);
  const [adminAlerts, setAdminAlerts] = useState<AdminAuditAlert[]>(INITIAL_ADMIN_ALERTS);
  const [mixedLots, setMixedLots] = useState<MixedLotItem[]>(INITIAL_MIXED_LOTS);

  // Helper to persist in localStorage
  const save = (key: string, data: unknown) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`farmly_${key}`, JSON.stringify(data));
    }
  };

  // Load from localStorage on mount & sync with live Supabase database
  useEffect(() => {
    setMounted(true);
    try {
      const load = <T,>(key: string, fallback: T): T => {
        const item = localStorage.getItem(`farmly_${key}`);
        return item ? JSON.parse(item) : fallback;
      };

      const sessionStr = typeof window !== "undefined" ? localStorage.getItem("farmly_session") : null;
      const isRealUser = sessionStr && !sessionStr.includes("@farmly.demo");

      let initialFarmers = load("farmers", INITIAL_FARMERS);
      if (sessionStr) {
        try {
          const userSession = JSON.parse(sessionStr);
          if (userSession?.role === "farmer" && userSession.id) {
            const alreadyIn = initialFarmers.some((f: any) => f.id === userSession.id);
            if (!alreadyIn) {
              initialFarmers = [
                {
                  id: userSession.id,
                  name: userSession.fullName || "Registered Farmer",
                  mobile: userSession.mobile || "",
                  village: userSession.district || "Nashik",
                  taluka: userSession.district || "Nashik",
                  district: userSession.district || "Nashik",
                  state: userSession.state || "Maharashtra",
                  language: userSession.preferredLanguage || "English",
                  farmingCategory: "Crops",
                  consent: true,
                  verificationLevel: "Field Verified",
                  status: "Active",
                  lastActivity: "Today",
                },
                ...initialFarmers,
              ];
            }
          }
        } catch {}
      }

      setFarmers(initialFarmers);
      setCropAvailabilities(load("crop_avail", isRealUser ? [] : INITIAL_CROP_AVAILABILITIES));
      setLots(load("lots", isRealUser ? [] : INITIAL_LOTS));
      setEvidence(load("evidence", isRealUser ? [] : INITIAL_EVIDENCE));
      setOffers(load("offers", isRealUser ? [] : INITIAL_OFFERS));
      setPayments(load("payments", isRealUser ? [] : INITIAL_PAYMENTS));
      setDisputes(load("disputes", isRealUser ? [] : INITIAL_DISPUTES));
      setTransactions(load("transactions", isRealUser ? [] : INITIAL_TRANSACTIONS));
      setNotifications(load("notifications", isRealUser ? [] : INITIAL_NOTIFICATIONS));
      setHelperActivities(load("activities", isRealUser ? [] : INITIAL_HELPER_ACTIVITIES));
      setCollectionArrivals(load("arrivals", isRealUser ? [] : INITIAL_COLLECTION_ARRIVALS));
      setQualityAssessments(load("quality", isRealUser ? [] : INITIAL_QUALITY_ASSESSMENTS));
      setFpoMembers(load("fpo_members", INITIAL_FPO_MEMBERS));
      setAdminAlerts(load("admin_alerts", isRealUser ? [] : INITIAL_ADMIN_ALERTS));
      setMixedLots(load("mixed_lots", INITIAL_MIXED_LOTS));
    } catch {
      // Keep defaults on localStorage parse error
    }

    // Live sync with Backend & Supabase
    const syncWithBackend = async () => {
      try {
        const sessionStr = typeof window !== "undefined" ? localStorage.getItem("farmly_session") : null;
        const [
          remoteFarmers,
          remoteCrops,
          remoteLots,
          remoteEvidence,
          remoteOffers,
          remotePayments,
          remoteDisputes,
          remoteTransactions,
          remoteNotifications,
          remoteActivities,
          remoteArrivals,
          remoteQuality,
          remoteFpoMembers,
          remoteAdminAlerts,
          remoteMixedLots,
        ] = await Promise.allSettled([
          backendClient.getFarmers(),
          backendClient.getCropAvailabilities(),
          backendClient.getLots(),
          backendClient.getEvidence(),
          backendClient.getOffers(),
          backendClient.getPayments(),
          backendClient.getDisputes(),
          backendClient.getTransactions(),
          backendClient.getNotifications(),
          backendClient.getHelperActivities(),
          backendClient.getCollectionArrivals(),
          backendClient.getQualityAssessments(),
          backendClient.getFpoMembers(),
          backendClient.getAdminAlerts(),
          backendClient.getMixedLots(),
        ]);

        let syncCount = 0;

        if (remoteFarmers.status === "fulfilled" && Array.isArray(remoteFarmers.value)) {
          let synced = remoteFarmers.value.length > 0 ? remoteFarmers.value : INITIAL_FARMERS;
          if (sessionStr) {
            try {
              const userSession = JSON.parse(sessionStr);
              if (userSession?.role === "farmer" && userSession.id) {
                const alreadyIn = synced.some((f) => f.id === userSession.id);
                if (!alreadyIn) {
                  synced = [
                    {
                      id: userSession.id,
                      name: userSession.fullName || "Registered Farmer",
                      mobile: userSession.mobile || "",
                      village: userSession.district || "Nashik",
                      taluka: userSession.district || "Nashik",
                      district: userSession.district || "Nashik",
                      state: userSession.state || "Maharashtra",
                      language: userSession.preferredLanguage || "English",
                      farmingCategory: "Crops",
                      consent: true,
                      verificationLevel: "Field Verified",
                      status: "Active",
                      lastActivity: "Today",
                    },
                    ...synced,
                  ];
                }
              }
            } catch {}
          }
          setFarmers(synced);
          save("farmers", synced);
          syncCount++;
        }
        if (remoteCrops.status === "fulfilled" && Array.isArray(remoteCrops.value)) {
          setCropAvailabilities(remoteCrops.value);
          save("crop_avail", remoteCrops.value);
          syncCount++;
        }
        if (remoteLots.status === "fulfilled" && Array.isArray(remoteLots.value)) {
          setLots(remoteLots.value);
          save("lots", remoteLots.value);
          syncCount++;
        }
        if (remoteEvidence.status === "fulfilled" && Array.isArray(remoteEvidence.value)) {
          setEvidence(remoteEvidence.value);
          save("evidence", remoteEvidence.value);
          syncCount++;
        }
        if (remoteOffers.status === "fulfilled" && Array.isArray(remoteOffers.value)) {
          setOffers(remoteOffers.value);
          save("offers", remoteOffers.value);
          syncCount++;
        }
        if (remotePayments.status === "fulfilled" && Array.isArray(remotePayments.value)) {
          setPayments(remotePayments.value);
          save("payments", remotePayments.value);
          syncCount++;
        }
        if (remoteDisputes.status === "fulfilled" && Array.isArray(remoteDisputes.value)) {
          setDisputes(remoteDisputes.value);
          save("disputes", remoteDisputes.value);
          syncCount++;
        }
        if (remoteTransactions.status === "fulfilled" && Array.isArray(remoteTransactions.value)) {
          setTransactions(remoteTransactions.value);
          save("transactions", remoteTransactions.value);
          syncCount++;
        }
        if (remoteNotifications.status === "fulfilled" && Array.isArray(remoteNotifications.value)) {
          setNotifications(remoteNotifications.value);
          save("notifications", remoteNotifications.value);
        }
        if (remoteActivities.status === "fulfilled" && Array.isArray(remoteActivities.value)) {
          setHelperActivities(remoteActivities.value);
          save("activities", remoteActivities.value);
        }
        if (remoteArrivals.status === "fulfilled" && Array.isArray(remoteArrivals.value)) {
          setCollectionArrivals(remoteArrivals.value);
          save("arrivals", remoteArrivals.value);
        }
        if (remoteQuality.status === "fulfilled" && Array.isArray(remoteQuality.value)) {
          setQualityAssessments(remoteQuality.value);
          save("quality", remoteQuality.value);
        }
        if (remoteFpoMembers.status === "fulfilled" && Array.isArray(remoteFpoMembers.value)) {
          setFpoMembers(remoteFpoMembers.value);
          save("fpo_members", remoteFpoMembers.value);
        }
        if (remoteAdminAlerts.status === "fulfilled" && Array.isArray(remoteAdminAlerts.value)) {
          setAdminAlerts(remoteAdminAlerts.value);
          save("admin_alerts", remoteAdminAlerts.value);
        }
        if (remoteMixedLots.status === "fulfilled" && Array.isArray(remoteMixedLots.value)) {
          setMixedLots(remoteMixedLots.value);
          save("mixed_lots", remoteMixedLots.value);
        }

        if (syncCount > 0) {
          console.log(`🌾 Farmly database synchronized successfully with Supabase! (${syncCount} data collections active)`);
        }
      } catch (err) {
        console.warn("Farmly database sync fallback to local storage:", err);
      }
    };

    syncWithBackend();
  }, []);

  const addFarmer = (farmerData: Omit<Farmer, "id" | "lastActivity">): Farmer => {
    const sessionStr = typeof window !== "undefined" ? localStorage.getItem("farmly_session") : null;
    let helperId: string | undefined = farmerData.assistedByHelperId;
    let helperName: string | undefined = farmerData.assistedBy?.helperName;
    if (sessionStr) {
      try {
        const sess = JSON.parse(sessionStr);
        if (sess.role === "helper") {
          helperId = helperId || sess.id;
          helperName = helperName || sess.fullName;
        }
      } catch {}
    }

    const newId = `FM-${Date.now().toString().slice(-6)}`;
    const newFarmer: Farmer = {
      ...farmerData,
      id: newId,
      assistedByHelperId: helperId,
      assistedBy: helperName ? {
        helperName,
        date: farmerData.assistedBy?.date || "Today",
      } : farmerData.assistedBy,
      lastActivity: "Just now",
    };
    const updated = [newFarmer, ...farmers];
    setFarmers(updated);
    save("farmers", updated);

    // Persist to Backend & Supabase
    backendClient.createFarmer(newFarmer).then((saved) => {
      if (saved && saved.id) {
        setFarmers((curr) => curr.map((f) => (f.id === newId ? saved : f)));
      }
    }).catch((e) => console.error("Error storing farmer in Supabase:", e));

    if (isHelperUser()) {
      addHelperActivity({
        timestamp: "Just now",
        action: `Registered farmer ${newId} (${newFarmer.name})`,
        category: "Registration",
        details: `Village: ${newFarmer.village}, District: ${newFarmer.district}`,
        badgeStatus: "Completed",
      });
    }

    return newFarmer;
  };

  const addCropAvailability = (
    item: Omit<CropAvailability, "id" | "createdAt">
  ): CropAvailability => {
    const newId = `CA-${Date.now().toString().slice(-5)}`;
    const newAvail: CropAvailability = {
      ...item,
      id: newId,
      createdAt: "Today",
    };
    const updated = [newAvail, ...cropAvailabilities];
    setCropAvailabilities(updated);
    save("crop_avail", updated);

    // Persist to Backend & Supabase
    backendClient.createCropAvailability(newAvail).then((saved) => {
      if (saved && saved.id) {
        setCropAvailabilities((curr) => curr.map((c) => (c.id === newId ? saved : c)));
      }
    }).catch((e) => console.error("Error storing crop availability in Supabase:", e));

    if (isHelperUser()) {
      addHelperActivity({
        timestamp: "Just now",
        action: `Recorded crop availability for ${item.farmerName}`,
        category: "Crop Availability",
        details: `${item.estimatedQuantity} ${item.unit} of ${item.crop} (${item.variety})`,
        badgeStatus: "Completed",
      });
    }

    return newAvail;
  };

  const createLot = (lotData: Partial<Lot> & Omit<Lot, "createdDate">): Lot => {
    const newId = lotData.id || `LT-${Date.now().toString().slice(-6)}`;
    const certRef = lotData.certificateRef || `CERT-MH-${newId.replace("LT-", "")}`;
    const newLot: Lot = {
      ...lotData,
      id: newId,
      certificateRef: certRef,
      blockchainHash: lotData.blockchainHash || FIXED_BLOCKCHAIN_FALLBACK_HASH,
      ipfsHash: lotData.ipfsHash,
      createdDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    const updated = [newLot, ...lots];
    setLots(updated);
    save("lots", updated);

    // Persist to Backend & Supabase with matching ID and certificate ref
    const lotPromise = backendClient.createLot(newLot).then((saved) => {
      if (saved && saved.id) {
        setLots((curr) => curr.map((l) => (l.id === newId ? saved : l)));
      }
      return saved;
    }).catch((e) => {
      console.error("Error storing lot in Supabase:", e);
    }).finally(() => {
      inFlightLotCreations.delete(newId);
    });

    inFlightLotCreations.set(newId, lotPromise);

    if (isHelperUser()) {
      addHelperActivity({
        timestamp: "Just now",
        action: `Documented lot ${newId} for ${lotData.farmerName}`,
        category: "Lot Creation",
        details: `${lotData.quantity} ${lotData.unit} of ${lotData.crop} (${lotData.qualityGrade})`,
        badgeStatus: "Completed",
      });
    }

    return newLot;
  };

  const updateLotStatus = (lotId: string, status: Lot["status"]) => {
    const updated = lots.map((l) => (l.id === lotId ? { ...l, status } : l));
    setLots(updated);
    save("lots", updated);
    backendClient.updateLotStatus(lotId, status).catch((e) => console.error("Error updating lot status in Supabase:", e));
  };

  const addEvidence = (item: Omit<EvidenceItem, "id" | "timestamp">): EvidenceItem => {
    const newId = `EV-${Date.now().toString().slice(-5)}`;
    const newEv: EvidenceItem = {
      ...item,
      id: newId,
      timestamp: "Just now",
    };
    const updated = [newEv, ...evidence];
    setEvidence(updated);
    save("evidence", updated);

    const persistEvidence = async () => {
      if (item.lotId && inFlightLotCreations.has(item.lotId)) {
        try {
          await inFlightLotCreations.get(item.lotId);
        } catch {
          // Proceed with best effort
        }
      }

      try {
        const saved = await backendClient.addEvidence(newEv);
        if (saved && saved.id) {
          setEvidence((curr) => curr.map((e) => (e.id === newId ? saved : e)));
        }
      } catch (e) {
        console.error("Error storing evidence in Supabase:", e);
      }
    };

    persistEvidence();

    if (isHelperUser()) {
      addHelperActivity({
        timestamp: "Just now",
        action: `Uploaded ${item.type} evidence for lot ${item.lotId}`,
        category: "Evidence",
        details: `${item.title}: ${item.value}`,
        badgeStatus: "Completed",
      });
    }

    return newEv;
  };

  const updateEvidenceStatus = (id: string, status: EvidenceItem["status"]) => {
    const updated = evidence.map((e) => (e.id === id ? { ...e, status } : e));
    setEvidence(updated);
    save("evidence", updated);
    backendClient.updateEvidenceStatus(id, status).catch((e) => console.error("Error updating evidence in Supabase:", e));
  };

  const createOffer = (offerData: Partial<Offer>): Offer => {
    const newId = `OF-${Date.now().toString().slice(-5)}`;
    const grossValue = (offerData.offeredQuantity || 0) * (offerData.pricePerKg || 0);
    const deductions = offerData.deductions || { transport: 0, loading: 0, commission: 0, platformFee: 0, other: 0 };
    const totalDeductions = Object.values(deductions).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
    const expectedNet = grossValue - totalDeductions;
    const nowFormatted = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const newOffer: Offer = {
      id: newId,
      lotId: offerData.lotId || "",
      crop: offerData.crop || "Wheat",
      buyerName: offerData.buyerName || "Procurement Buyer",
      buyerType: offerData.buyerType || "Distributor",
      offeredQuantity: offerData.offeredQuantity || 0,
      unit: offerData.unit || "kg",
      pricePerKg: offerData.pricePerKg || 0,
      grossValue,
      deductions,
      totalDeductions,
      expectedNet,
      offerDeadline: (offerData.offerDeadline && !isNaN(Date.parse(offerData.offerDeadline)))
        ? new Date(offerData.offerDeadline).toISOString()
        : new Date(Date.now() + 86400000 * 3).toISOString(),
      status: "Pending",
      createdAt: nowFormatted,
    };

    const updated = [newOffer, ...offers];
    setOffers(updated);
    save("offers", updated);

    // Persist to Backend & Supabase
    backendClient.createOffer(newOffer).then((saved) => {
      if (saved && saved.id) {
        setOffers((curr) => curr.map((o) => (o.id === newId ? saved : o)));
      }
    }).catch((e) => console.error("Error storing offer in Supabase:", e));

    return newOffer;
  };

  const acceptOffer = (offerId: string) => {
    const updated = offers.map((o) =>
      o.id === offerId ? { ...o, status: "Accepted" as const } : o
    );
    setOffers(updated);
    save("offers", updated);

    const matched = offers.find((o) => o.id === offerId);
    if (matched) {
      updateLotStatus(matched.lotId, "Sold");
    }

    backendClient.acceptOffer(offerId, matched).catch((e) => console.error("Error accepting offer in Supabase:", e));
  };

  const rejectOffer = (offerId: string) => {
    const updated = offers.map((o) =>
      o.id === offerId ? { ...o, status: "Rejected" as const } : o
    );
    setOffers(updated);
    save("offers", updated);

    const matched = offers.find((o) => o.id === offerId);
    backendClient.rejectOffer(offerId, matched).catch((e) => console.error("Error rejecting offer in Supabase:", e));
  };

  const updatePaymentStage = (
    paymentId: string,
    nextStage: Payment["currentStage"]
  ) => {
    const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const updated = payments.map((p) => {
      if (p.id === paymentId) {
        const updatedTimeline = p.timeline.map((step) =>
          step.stage === nextStage
            ? { ...step, completed: true, timestamp: now }
            : step
        );
        return {
          ...p,
          currentStage: nextStage,
          status: nextStage === "Closed" ? ("Closed" as const) : p.status,
          timeline: updatedTimeline,
        };
      }
      return p;
    });
    setPayments(updated);
    save("payments", updated);
    backendClient.updatePaymentStage(paymentId, nextStage).catch((e) => console.error("Error updating payment stage in Supabase:", e));
  };

  const createDispute = (
    disputeData: Omit<Dispute, "id" | "createdDate" | "resolutionTimeline">
  ): Dispute => {
    const newId = `DP-${Date.now().toString().slice(-5)}`;
    const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const newDispute: Dispute = {
      ...disputeData,
      id: newId,
      createdDate: now,
      resolutionTimeline: [
        {
          date: "Just now",
          actor: "Field Assistant",
          action: "Dispute opened for review",
        },
      ],
    };
    const updated = [newDispute, ...disputes];
    setDisputes(updated);
    save("disputes", updated);

    backendClient.createDispute(newDispute).catch((e) => console.error("Error creating dispute in Supabase:", e));
    return newDispute;
  };

  const addDisputeEvidence = (disputeId: string, note: string) => {
    const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const updated = disputes.map((d) => {
      if (d.id === disputeId) {
        return {
          ...d,
          resolutionTimeline: [
            ...d.resolutionTimeline,
            {
              date: now,
              actor: "Authorized Representative",
              action: `Submitted supplementary evidence: "${note.slice(0, 40)}..."`,
            },
          ],
        };
      }
      return d;
    });
    setDisputes(updated);
    save("disputes", updated);

    backendClient.updateDisputeTimeline(disputeId, `Submitted supplementary evidence: "${note.slice(0, 40)}..."`)
      .catch((e) => console.error("Error updating dispute timeline:", e));
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    save("notifications", updated);
    backendClient.markNotificationAsRead(id).catch((e) => console.error("Error updating notification in Supabase:", e));
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    save("notifications", updated);
    backendClient.markAllNotificationsAsRead().catch((e) => console.error("Error updating notifications in Supabase:", e));
  };

  const addHelperActivity = (activity: Omit<HelperActivity, "id">) => {
    if (!isHelperUser()) return;
    const newActivity: HelperActivity = {
      ...activity,
      id: `HA-${Date.now().toString().slice(-6)}`,
    };
    const updated = [newActivity, ...helperActivities];
    setHelperActivities(updated);
    save("activities", updated);
    backendClient.addHelperActivity(newActivity).catch((e) => console.error("Error adding helper activity in Supabase:", e));
  };

  const addCollectionArrival = (
    arrival: Omit<CollectionArrival, "id" | "timestamp">
  ): CollectionArrival => {
    const newId = `ARR-${Date.now().toString().slice(-5)}`;
    const newArrival: CollectionArrival = {
      ...arrival,
      id: newId,
      timestamp: "Just now",
    };
    const updated = [newArrival, ...collectionArrivals];
    setCollectionArrivals(updated);
    save("arrivals", updated);

    backendClient.addCollectionArrival(newArrival).catch((e) => console.error("Error adding arrival in Supabase:", e));
    return newArrival;
  };

  const addQualityAssessment = (
    assessment: Omit<QualityAssessment, "id" | "timestamp">
  ): QualityAssessment => {
    const newId = `QA-${Date.now().toString().slice(-5)}`;
    const newAssessment: QualityAssessment = {
      ...assessment,
      id: newId,
      timestamp: "Just now",
    };
    const updated = [newAssessment, ...qualityAssessments];
    setQualityAssessments(updated);
    save("quality", updated);

    backendClient.addQualityAssessment(newAssessment).catch((e) => console.error("Error adding quality assessment in Supabase:", e));
    return newAssessment;
  };

  const resolveAdminAlert = (id: string) => {
    const updated = adminAlerts.map((alert) =>
      alert.id === id ? { ...alert, status: "Resolved" as const } : alert
    );
    setAdminAlerts(updated);
    save("admin_alerts", updated);
    backendClient.resolveAdminAlert(id).catch((e) => console.error("Error resolving admin alert in Supabase:", e));
  };

  const resetAllData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("farmly_farmers");
      localStorage.removeItem("farmly_crop_avail");
      localStorage.removeItem("farmly_lots");
      localStorage.removeItem("farmly_evidence");
      localStorage.removeItem("farmly_offers");
      localStorage.removeItem("farmly_payments");
      localStorage.removeItem("farmly_disputes");
      localStorage.removeItem("farmly_transactions");
      localStorage.removeItem("farmly_notifications");
      localStorage.removeItem("farmly_activities");
      localStorage.removeItem("farmly_arrivals");
      localStorage.removeItem("farmly_quality");
      localStorage.removeItem("farmly_fpo_members");
      localStorage.removeItem("farmly_admin_alerts");
      localStorage.removeItem("farmly_mixed_lots");
    }
    setFarmers(INITIAL_FARMERS);
    setCropAvailabilities(INITIAL_CROP_AVAILABILITIES);
    setLots(INITIAL_LOTS);
    setEvidence(INITIAL_EVIDENCE);
    setOffers(INITIAL_OFFERS);
    setPayments(INITIAL_PAYMENTS);
    setDisputes(INITIAL_DISPUTES);
    setTransactions(INITIAL_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setHelperActivities(INITIAL_HELPER_ACTIVITIES);
    setCollectionArrivals(INITIAL_COLLECTION_ARRIVALS);
    setQualityAssessments(INITIAL_QUALITY_ASSESSMENTS);
    setFpoMembers(INITIAL_FPO_MEMBERS);
    setAdminAlerts(INITIAL_ADMIN_ALERTS);
    setMixedLots(INITIAL_MIXED_LOTS);
  };

  return (
    <MockDataContext.Provider
      value={{
        farmers: mounted ? farmers : INITIAL_FARMERS,
        addFarmer,
        cropAvailabilities: mounted ? cropAvailabilities : INITIAL_CROP_AVAILABILITIES,
        addCropAvailability,
        lots: mounted ? lots : INITIAL_LOTS,
        createLot,
        updateLotStatus,
        evidence: mounted ? evidence : INITIAL_EVIDENCE,
        addEvidence,
        updateEvidenceStatus,
        offers: mounted ? offers : INITIAL_OFFERS,
        createOffer,
        acceptOffer,
        rejectOffer,
        payments: mounted ? payments : INITIAL_PAYMENTS,
        updatePaymentStage,
        disputes: mounted ? disputes : INITIAL_DISPUTES,
        createDispute,
        addDisputeEvidence,
        transactions: mounted ? transactions : INITIAL_TRANSACTIONS,
        notifications: mounted ? notifications : INITIAL_NOTIFICATIONS,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        helperActivities: mounted ? helperActivities : INITIAL_HELPER_ACTIVITIES,
        addHelperActivity,
        collectionArrivals: mounted ? collectionArrivals : INITIAL_COLLECTION_ARRIVALS,
        addCollectionArrival,
        qualityAssessments: mounted ? qualityAssessments : INITIAL_QUALITY_ASSESSMENTS,
        addQualityAssessment,
        fpoMembers: mounted ? fpoMembers : INITIAL_FPO_MEMBERS,
        adminAlerts: mounted ? adminAlerts : INITIAL_ADMIN_ALERTS,
        resolveAdminAlert,
        mixedLots: mounted ? mixedLots : INITIAL_MIXED_LOTS,
        resetAllData,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
}
