"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Boxes, Scale, CheckCircle2, ArrowRight, Info, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";

export default function NewPhysicalLotPage() {
  const router = useRouter();
  const { farmers, createLot, addEvidence } = useMockData();
  const { user } = useAuth();

  const [farmerId, setFarmerId] = useState("FMR-MH-000421");
  const [crop, setCrop] = useState("Sharbati Wheat");
  const [variety, setVariety] = useState("Lokwan C-306");
  const [declaredWeight, setDeclaredWeight] = useState("500");
  const [measuredWeight, setMeasuredWeight] = useState("492.4");
  const [unit, setUnit] = useState("kg");
  const [scaleId, setScaleId] = useState("FPO-SIN-03 (Calibrated Platform Scale)");
  const [qualityGrade, setQualityGrade] = useState<"Grade A" | "Grade B" | "Standard">("Grade A");
  const [location, setLocation] = useState("Sinnar Collection Hub #3, Nashik");
  const [createdLotId, setCreatedLotId] = useState<string | null>(null);

  const declaredNum = Number(declaredWeight) || 0;
  const measuredNum = Number(measuredWeight) || 0;
  const tareDifference = (declaredNum - measuredNum).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFarmer = farmers.find((f) => f.id === farmerId) || farmers[0];

    const newLot = createLot({
      farmerId: selectedFarmer.id,
      farmerName: selectedFarmer.name,
      crop,
      variety,
      quantity: measuredNum,
      unit,
      currentOwner: `${selectedFarmer.name} (Farmer)`,
      status: "Active",
      qualityGrade,
      location,
      assistedBy: user?.role === "helper" ? `${user.fullName} (Field Helper)` : "Priya Sharma (Field Helper)",
      weighmentScaleId: scaleId,
      certificateRef: `QC-MH-NSK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    // Record initial weighment evidence
    addEvidence({
      lotId: newLot.id,
      farmerId: selectedFarmer.id,
      farmerName: selectedFarmer.name,
      type: "Weighment",
      category: "Farmer Declared",
      title: "Farmer Harvest Self-Declaration",
      value: `${declaredNum} ${unit} declared`,
      source: "Farmer Declaration Form",
      status: "Reviewed",
    });

    addEvidence({
      lotId: newLot.id,
      farmerId: selectedFarmer.id,
      farmerName: selectedFarmer.name,
      type: "Scale Receipt",
      category: "Evidence Backed",
      title: "Digital Platform Scale Weighment",
      value: `${measuredNum} ${unit} net (Tare variance: ${tareDifference} ${unit})`,
      source: `Scale ${scaleId}`,
      status: "Verified",
    });

    setCreatedLotId(newLot.id);
  };

  return (
    <AppLayout title="Create Physical Lot">
      <div className="max-w-3xl space-y-6">
        {/* Distinction Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs sm:text-sm text-white flex items-start gap-3">
          <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-farmly-foreground">
              Physical Lot Minting Protocol
            </h4>
            <p className="text-farmly-muted leading-relaxed">
              Every physical lot must have a calibrated weighment receipt. The platform records both the farmer-declared harvest estimate and the scale-measured net weight to preserve transparent accountability.
            </p>
          </div>
        </div>

        {createdLotId ? (
          <Card className="p-6 sm:p-8 text-center space-y-4 border border-emerald-500/40 bg-emerald-500/5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-farmly-foreground">Physical Lot Successfully Created!</h3>
              <p className="text-xs text-farmly-muted">
                Provenance chain and digital weighment evidence have been anchored.
              </p>
            </div>

            <div className="p-3 bg-farmly-surface rounded-xl border border-farmly-border inline-block font-mono font-bold text-sm text-farmly-primary">
              Lot ID: {createdLotId}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedLotId(null);
                }}
              >
                Create Another Lot
              </Button>
              <Link href={`/lots/${createdLotId}`}>
                <Button className="bg-farmly-primary text-white flex items-center gap-1.5">
                  Inspect Lot Details <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border border-farmly-border bg-farmly-surface">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Farmer Selection */}
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Registered Farmer
                </label>
                <select
                  value={farmerId}
                  onChange={(e) => setFarmerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.id}) — {f.village}, {f.district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-farmly-foreground mb-1">Crop</label>
                  <Input value={crop} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrop(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-farmly-foreground mb-1">Variety</label>
                  <Input value={variety} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariety(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
                </div>
              </div>

              {/* Weight Reconciliation */}
              <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3">
                <div className="text-xs font-bold text-farmly-foreground flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-farmly-primary" />
                  Weighment &amp; Tare Reconciliation
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-farmly-muted mb-1">
                      Farmer Declared ({unit})
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={declaredWeight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeclaredWeight(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-farmly-muted mb-1">
                      Scale Measured Net ({unit})
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={measuredWeight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeasuredWeight(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-farmly-muted mb-1">
                      Tare / Moisture Loss
                    </label>
                    <div className="px-3 py-2.5 rounded-xl bg-farmly-surface border border-farmly-border text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                      {tareDifference} {unit}
                    </div>
                  </div>
                </div>

                {Number(tareDifference) > 5 && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Difference exceeds 5 kg; automatic tare logging will be flagged for review.</span>
                  </div>
                )}
              </div>

              {/* Scale & Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                    Weighbridge / Scale ID
                  </label>
                  <Input value={scaleId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScaleId(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                    Initial Quality Grade
                  </label>
                  <select
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value as "Grade A" | "Grade B" | "Standard")}
                    className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                  >
                    <option value="Grade A">Grade A (Premium)</option>
                    <option value="Grade B">Grade B (Standard Commercial)</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Intake Location / Collection Hub
                </label>
                <Input value={location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-farmly-border">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-farmly-primary text-white">
                  Create Physical Lot &amp; Mint Provenance
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
