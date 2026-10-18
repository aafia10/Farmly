"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Wheat,
  Scale,
  ShieldCheck,
  User,
  Plus,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CropDetailBadges } from "@/components/common/crop-detail-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";
import { Lot } from "@/types";


export default function HelperLotsPage() {
  const { user } = useAuth();
  const { farmers, lots, createLot } = useMockData();
  const { t } = useTranslation();

  const accessibleFarmers = React.useMemo(() => {
    if (!user) return [];
    const helperId = user.id;
    const helperNameLower = user.fullName?.toLowerCase();
    return farmers.filter((f) => {
      const matchesHelperId = f.assistedByHelperId && (
        f.assistedByHelperId === helperId ||
        (user.id === "usr_help_01" && f.assistedByHelperId === "e1000000-0000-0000-0000-000000000002")
      );
      const matchesHelperName = f.assistedBy?.helperName && helperNameLower && f.assistedBy.helperName.toLowerCase() === helperNameLower;
      return Boolean(matchesHelperId || matchesHelperName);
    });
  }, [farmers, user]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [crop, setCrop] = useState("Wheat");
  const [variety, setVariety] = useState("Sharbati");
  const [quantity, setQuantity] = useState("5000");
  const [unit, setUnit] = useState("kg");
  const [qualityGrade, setQualityGrade] = useState<"Grade A" | "Grade B" | "Standard">("Grade A");
  const [location, setLocation] = useState("Anand Village Yard #4");
  const [weighmentScaleId, setWeighmentScaleId] = useState("WS-ANAND-02");
  const [createdLotResult, setCreatedLotResult] = useState<Lot | null>(null);

  React.useEffect(() => {
    if (accessibleFarmers.length > 0) {
      if (!selectedFarmerId || !accessibleFarmers.some((f) => f.id === selectedFarmerId)) {
        setSelectedFarmerId(accessibleFarmers[0].id);
      }
    } else {
      setSelectedFarmerId("");
    }
  }, [accessibleFarmers, selectedFarmerId]);

  const selectedFarmer = accessibleFarmers.find((f) => f.id === selectedFarmerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveFarmer = selectedFarmer || accessibleFarmers[0];
    if (!effectiveFarmer) {
      alert("No accessible farmer selected.");
      return;
    }
    const farmerId = effectiveFarmer.id;
    const farmerName = effectiveFarmer.name;

    const newLot = createLot({
      farmerId,
      farmerName,
      crop,
      variety,
      quantity: Number(quantity) || 100,
      unit,
      currentOwner: farmerName,
      status: "Active",
      qualityGrade,
      location,
      assistedBy: user?.fullName || "Priya Sharma",
      weighmentScaleId: weighmentScaleId || undefined,
      certificateRef: `CERT-AGMARK-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setCreatedLotResult(newLot);
    setStep(1);
  };

  return (
    <AppLayout title={t("lots.documentNew", "Lot Documentation Wizard")}>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
            {t("helper.documentLotTitle", "Harvest Lot Documentation")}
          </h1>
          <p className="text-xs text-farmly-muted">
            {t(
              "helper.documentLotSubtitle",
              "Digitize and verify physical farm harvest lots with scale integration, moisture evidence, and tamper-evident identifiers."
            )}
          </p>
        </div>

        {/* Success Banner */}
        {createdLotResult && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-farmly-foreground text-base">
                  {t("helper.lotSuccess", "Lot Successfully Documented")}: {createdLotResult.id}
                </h3>
                <p className="text-xs text-farmly-muted">
                  {t("common.assistedBy", "Digitized for")} {createdLotResult.farmerName} • {createdLotResult.quantity} {createdLotResult.unit} of {createdLotResult.crop}
                </p>
                <div className="pt-1.5 flex items-center gap-1.5 text-xs text-farmly-muted">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px]">No certificate yet. Upload the farmer&apos;s document so buyers can purchase this lot.</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Link href={`/lots/${encodeURIComponent(createdLotResult.id)}/certificate`}>
                <Button size="sm" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs">
                  Upload certificate
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedLotResult(null)}
                className="border-farmly-border text-farmly-foreground text-xs hover:bg-farmly-surface-elevated"
              >
                {t("helper.createAnotherLot", "Create Another Lot")}
              </Button>
            </div>
          </div>
        )}

        {/* Step Wizard Container */}
        <Card className="bg-farmly-surface border-farmly-border p-6 lg:p-8">
          {/* Steps Breadcrumbs */}
          <div className="flex items-center justify-between border-b border-farmly-border pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === 1
                    ? "bg-farmly-primary text-white ring-4 ring-emerald-500/20"
                    : "bg-farmly-surface-elevated text-farmly-muted"
                }`}
              >
                1
              </div>
              <span className={`text-sm font-semibold ${step === 1 ? "text-farmly-foreground" : "text-farmly-muted"}`}>
                {t("helper.selectFarmer", "Select Farmer")}
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-farmly-muted" />

            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === 2
                    ? "bg-farmly-primary text-white ring-4 ring-emerald-500/20"
                    : "bg-farmly-surface-elevated text-farmly-muted"
                }`}
              >
                2
              </div>
              <span className={`text-sm font-semibold ${step === 2 ? "text-farmly-foreground" : "text-farmly-muted"}`}>
                {t("helper.harvestDetails", "Harvest Details")}
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-farmly-muted" />

            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === 3
                    ? "bg-farmly-primary text-white ring-4 ring-emerald-500/20"
                    : "bg-farmly-surface-elevated text-farmly-muted"
                }`}
              >
                3
              </div>
              <span className={`text-sm font-semibold ${step === 3 ? "text-farmly-foreground" : "text-farmly-muted"}`}>
                {t("helper.reviewConfirm", "Review & Confirm")}
              </span>
            </div>
          </div>

          {/* Step 1: Select Farmer */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-farmly-foreground">
                  {t("helper.chooseRegisteredFarmer", "Choose Registered Farmer")}
                </h3>
                <p className="text-xs text-farmly-muted">
                  {t("helper.chooseFarmerDesc", "Select the verified grower for whom this harvest lot is being documented.")}
                </p>
              </div>

              {accessibleFarmers.length === 0 ? (
                <div className="p-8 text-center bg-farmly-surface-elevated rounded-xl border border-farmly-border space-y-4">
                  <User className="w-10 h-10 text-farmly-muted mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-farmly-foreground">No Assisted Farmers Found</h4>
                    <p className="text-xs text-farmly-muted">
                      You have not onboarded or been connected with any farmers yet. Onboard a grower first to document lots under their name.
                    </p>
                  </div>
                  <Link href="/helper/farmers/new">
                    <Button size="sm" className="bg-farmly-primary text-white">
                      <Plus className="w-4 h-4 mr-1" /> Onboard New Farmer
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessibleFarmers.map((farmer) => (
                    <div
                      key={farmer.id}
                      onClick={() => setSelectedFarmerId(farmer.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedFarmerId === farmer.id
                          ? "bg-farmly-primary/20 border-farmly-accent ring-2 ring-emerald-500/20"
                          : "bg-farmly-surface-elevated border-farmly-border hover:border-farmly-muted"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{farmer.id}</div>
                          <div className="font-bold text-farmly-foreground text-sm">{farmer.name}</div>
                          <div className="text-xs text-farmly-muted">{farmer.village}, {farmer.district}</div>
                        </div>
                        <StatusBadge status={farmer.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedFarmerId}
                  className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("common.next", "Continue to Details")} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Lot Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-farmly-foreground">
                  {t("helper.lotSpecsTitle", "Harvest Lot Specifications")}
                </h3>
                <p className="text-xs text-farmly-muted">
                  {t("helper.lotSpecsDesc", "Enter crop specifications, measured weights, and warehouse or field location.")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("common.crop", "Crop Name")}</Label>
                  <Input value={crop} onChange={(e) => setCrop(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("cropAvailability.variety", "Crop Variety")}</Label>
                  <Input value={variety} onChange={(e) => setVariety(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("common.quantity", "Measured Quantity")}</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("helper.unitOfMeasure", "Unit of Measurement")}</Label>
                  <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="quintals">Quintals (qtl)</option>
                    <option value="tonnes">Tonnes (MT)</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("common.qualityGrade", "Quality Grade")}</Label>
                  <Select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value as "Grade A" | "Grade B" | "Standard")}
                  >
                    <option value="Grade A">Grade A (Premium Export Quality)</option>
                    <option value="Grade B">Grade B (Standard Commercial)</option>
                    <option value="Standard">Standard (Local Mandi Grade)</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("helper.scaleId", "Physical Weighment Scale ID")}</Label>
                  <Input value={weighmentScaleId} onChange={(e) => setWeighmentScaleId(e.target.value)} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>{t("helper.storageLocation", "Weighment / Storage Location")}</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-farmly-border text-farmly-foreground text-xs h-9 hover:bg-farmly-surface-elevated font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> {t("common.previous", "Back")}
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9 font-semibold"
                >
                  {t("helper.reviewSummary", "Review Summary")} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-farmly-foreground">
                  {t("helper.reviewLotTitle", "Review & Create Verified Lot")}
                </h3>
                <p className="text-xs text-farmly-muted">
                  {t("helper.reviewLotDesc", "Verify all information before minting digital lot identity.")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3 text-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-farmly-muted block">{t("role.farmer", "Farmer")}</span>
                    <span className="font-bold text-farmly-foreground">{selectedFarmer?.name} ({selectedFarmer?.id})</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">{t("common.crop", "Crop & Variety")}</span>
                    <span className="font-bold text-farmly-foreground">{crop} ({variety})</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">{t("common.quantity", "Quantity")}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{quantity} {unit}</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">{t("common.qualityGrade", "Grade")}</span>
                    <span className="font-bold text-farmly-foreground">{qualityGrade}</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">{t("helper.scale", "Weighment Scale")}</span>
                    <span className="font-mono text-farmly-foreground text-xs">{weighmentScaleId || "Manual entry"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">{t("common.location", "Location")}</span>
                    <span className="text-farmly-foreground text-xs">{location}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-farmly-border text-farmly-foreground text-xs h-9 hover:bg-farmly-surface-elevated font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> {t("common.previous", "Back")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> {t("helper.mintHarvestLot", "Mint Harvest Lot")}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Existing Lots Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-farmly-foreground">
              {t("helper.documentedProduceLots", "Documented Produce Lots")}
            </h2>
            <span className="text-xs text-farmly-muted font-mono">{lots.length} active lots</span>
          </div>

          <Card className="bg-farmly-surface border-farmly-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-farmly-surface-elevated text-xs font-semibold text-farmly-muted uppercase border-b border-farmly-border">
                  <tr>
                    <th className="px-5 py-3.5">Lot ID</th>
                    <th className="px-5 py-3.5">{t("role.farmer", "Farmer")}</th>
                    <th className="px-5 py-3.5">{t("common.crop", "Produce")}</th>
                    <th className="px-5 py-3.5">{t("common.quantity", "Quantity")}</th>
                    <th className="px-5 py-3.5">{t("common.qualityGrade", "Quality")}</th>
                    <th className="px-5 py-3.5">{t("common.status", "Status")}</th>
                    <th className="px-5 py-3.5 text-right">{t("common.actions", "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-border/60">
                  {lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-farmly-surface-elevated/50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-farmly-foreground">{lot.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-farmly-foreground">{lot.farmerName}</div>
                        <div className="text-xs text-farmly-muted font-mono">{lot.farmerId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-farmly-foreground">{lot.crop}</div>
                        <div className="text-xs text-farmly-muted">{lot.variety}</div>
                        <CropDetailBadges item={lot} className="mt-1" />
                      </td>
                      <td className="px-5 py-4 font-medium text-farmly-foreground">{lot.quantity} {lot.unit}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/20">
                          {lot.qualityGrade}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={lot.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/lots/${lot.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8 font-medium">
                            {t("common.details", "Inspect")}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
