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
} from "@/lib/mock-data";

interface MockDataContextType {
  farmers: Farmer[];
  addFarmer: (farmerData: Omit<Farmer, "id" | "lastActivity">) => Farmer;
  cropAvailabilities: CropAvailability[];
  addCropAvailability: (item: Omit<CropAvailability, "id" | "createdAt">) => CropAvailability;
  lots: Lot[];
  createLot: (lotData: Omit<Lot, "id" | "createdDate">) => Lot;
  updateLotStatus: (lotId: string, status: Lot["status"]) => void;
  evidence: EvidenceItem[];
  addEvidence: (item: Omit<EvidenceItem, "id" | "timestamp">) => EvidenceItem;
  updateEvidenceStatus: (id: string, status: EvidenceItem["status"]) => void;
  offers: Offer[];
  acceptOffer: (offerId: string) => void;
  rejectOffer: (offerId: string) => void;
  payments: Payment[];
  updatePaymentStage: (paymentId: string, nextStage: Payment["currentStage"]) => void;
  disputes: Dispute[];
  createDispute: (disputeData: Omit<Dispute, "id" | "createdDate" | "resolutionTimeline">) => Dispute;
  transactions: TransactionRecord[];
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  helperActivities: HelperActivity[];
  addHelperActivity: (activity: Omit<HelperActivity, "id">) => void;
  resetAllData: () => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

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

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const load = <T,>(key: string, fallback: T): T => {
        const item = localStorage.getItem(`farmly_${key}`);
        return item ? JSON.parse(item) : fallback;
      };

      setFarmers(load("farmers", INITIAL_FARMERS));
      setCropAvailabilities(load("crop_avail", INITIAL_CROP_AVAILABILITIES));
      setLots(load("lots", INITIAL_LOTS));
      setEvidence(load("evidence", INITIAL_EVIDENCE));
      setOffers(load("offers", INITIAL_OFFERS));
      setPayments(load("payments", INITIAL_PAYMENTS));
      setDisputes(load("disputes", INITIAL_DISPUTES));
      setTransactions(load("transactions", INITIAL_TRANSACTIONS));
      setNotifications(load("notifications", INITIAL_NOTIFICATIONS));
      setHelperActivities(load("activities", INITIAL_HELPER_ACTIVITIES));
    } catch {
      // Keep defaults on localStorage parse error
    }
  }, []);

  // Save helper
  const save = (key: string, data: unknown) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`farmly_${key}`, JSON.stringify(data));
    }
  };

  const addFarmer = (farmerData: Omit<Farmer, "id" | "lastActivity">): Farmer => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const newId = `FM-${randomDigits}`;
    const newFarmer: Farmer = {
      ...farmerData,
      id: newId,
      lastActivity: "Just now",
    };
    const updated = [newFarmer, ...farmers];
    setFarmers(updated);
    save("farmers", updated);

    // Add activity
    addHelperActivity({
      timestamp: "Just now",
      action: `Registered farmer ${newId} (${newFarmer.name})`,
      category: "Registration",
      details: `Village: ${newFarmer.village}, District: ${newFarmer.district}`,
      badgeStatus: "Completed",
    });

    return newFarmer;
  };

  const addCropAvailability = (
    item: Omit<CropAvailability, "id" | "createdAt">
  ): CropAvailability => {
    const newId = `CA-${Math.floor(400 + Math.random() * 500)}`;
    const newAvail: CropAvailability = {
      ...item,
      id: newId,
      createdAt: "Today",
    };
    const updated = [newAvail, ...cropAvailabilities];
    setCropAvailabilities(updated);
    save("crop_avail", updated);

    addHelperActivity({
      timestamp: "Just now",
      action: `Recorded crop availability for ${item.farmerName}`,
      category: "Crop Availability",
      details: `${item.estimatedQuantity} ${item.unit} of ${item.crop} (${item.variety})`,
      badgeStatus: "Completed",
    });

    return newAvail;
  };

  const createLot = (lotData: Omit<Lot, "id" | "createdDate">): Lot => {
    const newId = `LT-${Math.floor(20000 + Math.random() * 10000)}`;
    const newLot: Lot = {
      ...lotData,
      id: newId,
      createdDate: "17 Sep 2026",
    };
    const updated = [newLot, ...lots];
    setLots(updated);
    save("lots", updated);

    addHelperActivity({
      timestamp: "Just now",
      action: `Documented lot ${newId} for ${lotData.farmerName}`,
      category: "Lot Creation",
      details: `${lotData.quantity} ${lotData.unit} of ${lotData.crop} (${lotData.qualityGrade})`,
      badgeStatus: "Completed",
    });

    return newLot;
  };

  const updateLotStatus = (lotId: string, status: Lot["status"]) => {
    const updated = lots.map((l) => (l.id === lotId ? { ...l, status } : l));
    setLots(updated);
    save("lots", updated);
  };

  const addEvidence = (item: Omit<EvidenceItem, "id" | "timestamp">): EvidenceItem => {
    const newId = `EV-${Math.floor(900 + Math.random() * 900)}`;
    const newEv: EvidenceItem = {
      ...item,
      id: newId,
      timestamp: "Just now",
    };
    const updated = [newEv, ...evidence];
    setEvidence(updated);
    save("evidence", updated);

    addHelperActivity({
      timestamp: "Just now",
      action: `Uploaded ${item.type} evidence for lot ${item.lotId}`,
      category: "Evidence",
      details: `${item.title}: ${item.value}`,
      badgeStatus: "Completed",
    });

    return newEv;
  };

  const updateEvidenceStatus = (id: string, status: EvidenceItem["status"]) => {
    const updated = evidence.map((e) => (e.id === id ? { ...e, status } : e));
    setEvidence(updated);
    save("evidence", updated);
  };

  const acceptOffer = (offerId: string) => {
    const updated = offers.map((o) =>
      o.id === offerId ? { ...o, status: "Accepted" as const } : o
    );
    setOffers(updated);
    save("offers", updated);

    // Also update matching lot status
    const matched = offers.find((o) => o.id === offerId);
    if (matched) {
      updateLotStatus(matched.lotId, "Sold");
    }
  };

  const rejectOffer = (offerId: string) => {
    const updated = offers.map((o) =>
      o.id === offerId ? { ...o, status: "Rejected" as const } : o
    );
    setOffers(updated);
    save("offers", updated);
  };

  const updatePaymentStage = (
    paymentId: string,
    nextStage: Payment["currentStage"]
  ) => {
    const updated = payments.map((p) => {
      if (p.id === paymentId) {
        const updatedTimeline = p.timeline.map((step) =>
          step.stage === nextStage
            ? { ...step, completed: true, timestamp: "Just now" }
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
  };

  const createDispute = (
    disputeData: Omit<Dispute, "id" | "createdDate" | "resolutionTimeline">
  ): Dispute => {
    const newId = `DP-${Math.floor(400 + Math.random() * 500)}`;
    const newDispute: Dispute = {
      ...disputeData,
      id: newId,
      createdDate: "17 Sep 2026",
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
    return newDispute;
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    save("notifications", updated);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    save("notifications", updated);
  };

  const addHelperActivity = (activity: Omit<HelperActivity, "id">) => {
    const newActivity: HelperActivity = {
      ...activity,
      id: `HA-${Date.now()}`,
    };
    const updated = [newActivity, ...helperActivities];
    setHelperActivities(updated);
    save("activities", updated);
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
        acceptOffer,
        rejectOffer,
        payments: mounted ? payments : INITIAL_PAYMENTS,
        updatePaymentStage,
        disputes: mounted ? disputes : INITIAL_DISPUTES,
        createDispute,
        transactions: mounted ? transactions : INITIAL_TRANSACTIONS,
        notifications: mounted ? notifications : INITIAL_NOTIFICATIONS,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        helperActivities: mounted ? helperActivities : INITIAL_HELPER_ACTIVITIES,
        addHelperActivity,
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
