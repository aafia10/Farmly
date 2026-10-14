"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wheat, Plus, Info, ArrowRight, CheckCircle2, Boxes, Calendar } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";

export default function GeneralCropAvailabilityPage() {
  const { cropAvailabilities, addCropAvailability, farmers } = useMockData();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  const [crop, setCrop] = useState("Sharbati Wheat");
  const [variety, setVariety] = useState("Lokwan C-306");
  const [quantity, setQuantity] = useState("500");
  const [unit, setUnit] = useState("kg");
  const [harvestDate, setHarvestDate] = useState("2026-10-15");
  const [location, setLocation] = useState("Sinnar East Plot 4B, Nashik");
  const [notes, setNotes] = useState("");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const farmer = farmers.find((f) => f.name.toLowerCase().includes("patil")) || farmers[0];

    const newAvail = addCropAvailability({
      farmerId: farmer?.id || "FMR-MH-000421",
      farmerName: user?.fullName || farmer?.name || "Ramesh Patil",
      crop,
      variety,
      estimatedQuantity: Number(quantity) || 500,
      unit,
      expectedHarvestDate: harvestDate,
      location,
      notes,
      status: "Available",
    });

    setSuccessNotice(
      `Crop availability ${newAvail.id} recorded. Note: This declaration is non-binding and precedes physical lot weighment.`
    );
    setShowForm(false);
  };

  return (
    <AppLayout title={t("nav.cropAvailability", "Crop Availability Declarations")}>
      <div className="space-y-6">
        {/* MANDATORY DISTINCTION BANNER */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-farmly-foreground">
              {t("cropAvailability.bannerTitle", "Pre-Harvest Crop Availability vs. Physical Lot")}
            </h4>
            <p className="text-farmly-muted leading-relaxed">
              <strong>{t("cropAvailability.cropAvailLabel", "Crop Availability")}</strong>{" "}
              {t(
                "cropAvailability.bannerDesc",
                "is a pre-harvest declaration of expected produce to gauge market interest. It is not yet harvested and carries no legal or financial liability. Once harvested and weighed at a collection center, a"
              )}{" "}
              <strong>{t("cropAvailability.physicalLotLabel", "Physical Lot")}</strong>{" "}
              {t("cropAvailability.bannerDesc2", "is minted with calibrated scale receipts and quality grades.")}
            </p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-farmly-foreground">
              {t("cropAvailability.activeTitle", "Active Pre-Harvest Availabilities")}
            </h3>
            <p className="text-xs text-farmly-muted">
              {t("cropAvailability.activeSubtitle", "Signals upcoming harvests to verified buyers before arrival at collection hubs.")}
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-farmly-primary text-white hover:bg-farmly-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm
              ? t("common.cancel", "Close Form")
              : t("cropAvailability.declareCrop", "Declare Upcoming Crop")}
          </Button>
        </div>

        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <Card className="p-5 sm:p-6 border border-farmly-border bg-farmly-surface">
            <h3 className="text-base font-bold text-farmly-foreground mb-4">
              {t("cropAvailability.newDeclaration", "New Pre-Harvest Declaration")}
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  {t("common.crop", "Crop Name")}
                </label>
                <Input value={crop} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrop(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  {t("cropAvailability.variety", "Variety")}
                </label>
                <Input value={variety} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariety(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  {t("cropAvailability.estimatedQty", "Estimated Quantity")}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    aria-label="Unit of measurement"
                    className="px-3 py-2 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">quintal</option>
                    <option value="ton">ton</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  {t("cropAvailability.harvestDate", "Expected Harvest Date")}
                </label>
                <Input
                  type="date"
                  value={harvestDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHarvestDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  {t("cropAvailability.farmLocation", "Farm Location / Plot")}
                </label>
                <Input value={location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  {t("cropAvailability.notes", "Notes / Agronomic Observations")}
                </label>
                <Input
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
                  placeholder={t("cropAvailability.notesPlaceholder", "e.g. Organic fertilizer used, canal irrigated, pesticide free for 30 days")}
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t("common.cancel", "Cancel")}
                </Button>
                <Button type="submit" className="bg-farmly-primary text-white">
                  {t("cropAvailability.publishAvailability", "Publish Availability")}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Availabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cropAvailabilities.map((item) => (
            <Card key={item.id} hoverGlow className="p-5 border border-farmly-border flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      <Wheat className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-farmly-foreground">{item.id}</span>
                      <div className="text-xs text-farmly-muted">{item.farmerName}</div>
                    </div>
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="pt-2 border-t border-farmly-border">
                  <div className="text-base font-bold text-farmly-foreground">{item.crop}</div>
                  <div className="text-xs text-farmly-muted">{item.variety}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-farmly-muted block">
                      {t("cropAvailability.estimatedQty", "Estimated")}
                    </span>
                    <strong className="text-farmly-foreground font-mono text-sm">
                      {item.estimatedQuantity} {item.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-farmly-muted block">
                      {t("cropAvailability.harvestDate", "Expected Date")}
                    </span>
                    <span className="text-farmly-foreground font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-farmly-primary dark:text-farmly-accent-light" />
                      {item.expectedHarvestDate}
                    </span>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-farmly-muted bg-farmly-surface-elevated p-2.5 rounded-lg border border-farmly-border line-clamp-2">
                    {item.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-farmly-border flex items-center justify-between text-xs">
                <span className="text-farmly-muted">
                  {t("common.location", "Location")}: {item.location}
                </span>
                {item.status === "Converted to Lot" ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5" /> {t("cropAvailability.physicalLotCreated", "Physical Lot Created")}
                  </span>
                ) : (
                  <Link
                    href="/lots/new"
                    className="text-farmly-primary dark:text-farmly-accent-light font-medium hover:underline flex items-center gap-1"
                  >
                    {t("cropAvailability.convertToLot", "Convert to Lot")} <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
