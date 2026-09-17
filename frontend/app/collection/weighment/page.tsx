"use client";

import React, { useState } from "react";
import { Scale, RefreshCw, CheckCircle2, Printer, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockData } from "@/contexts/mock-data-context";

export default function CollectionWeighmentPage() {
  const { farmers, addCollectionArrival, addEvidence } = useMockData();

  const [scaleId, setScaleId] = useState("FPO-SIN-03");
  const [selectedFarmerId, setSelectedFarmerId] = useState("FMR-MH-000421");
  const [crop, setCrop] = useState("Sharbati Wheat");
  const [variety, setVariety] = useState("Lokwan C-306");
  const [bagsCount, setBagsCount] = useState("10");
  const [grossWeight, setGrossWeight] = useState("500.0");
  const [tareWeight, setTareWeight] = useState("7.6");
  const [moisturePercent, setMoisturePercent] = useState("11.2");
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null);

  const netWeight = (Number(grossWeight) - Number(tareWeight)).toFixed(1);

  const handleSimulateSync = () => {
    // Simulates an IoT live reading from digital scale FPO-SIN-03
    setGrossWeight("500.0");
    setTareWeight("7.6");
    setMoisturePercent("11.2");
  };

  const handleRecordWeighment = (e: React.FormEvent) => {
    e.preventDefault();
    const farmer = farmers.find((f) => f.id === selectedFarmerId) || farmers[0];

    const newArr = addCollectionArrival({
      farmerId: farmer.id,
      farmerName: farmer.name,
      crop,
      variety,
      declaredQuantity: Number(grossWeight),
      measuredQuantity: Number(netWeight),
      unit: "kg",
      scaleId,
      moisturePercent: Number(moisturePercent),
      qualityGrade: "Grade A",
      status: "Weighed",
      recordedBy: "Weighbridge Operator Nilesh Gaikwad",
    });

    setReceiptNotice(
      `Weighment receipt ${newArr.id} generated on ${scaleId}. Net Weight: ${netWeight} kg (Tare deduction: ${tareWeight} kg).`
    );
  };

  return (
    <AppLayout title="Digital Scale Weighbridge Workstation">
      <div className="max-w-3xl space-y-6">
        {/* Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs sm:text-sm text-white flex items-start gap-3">
          <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-farmly-foreground">
              Calibrated Scale Direct Ingestion
            </h4>
            <p className="text-farmly-muted">
              Auto-logged readings from scale #FPO-SIN-03. Tare deductions are calculated against empty jute bag tare standards (0.76 kg/bag) to ensure zero dispute variance.
            </p>
          </div>
        </div>

        {receiptNotice && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{receiptNotice}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="border-emerald-500/40 text-xs">
              <Printer className="w-3.5 h-3.5 mr-1" /> Print Slip
            </Button>
          </div>
        )}

        <Card className="p-6 border border-farmly-border bg-farmly-surface">
          <form onSubmit={handleRecordWeighment} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-farmly-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-farmly-foreground">
                  Connected Scale: {scaleId} (Active &bull; Calibrated: 01 Sep 2026)
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSimulateSync}
                className="text-xs border-farmly-border flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Sync Scale Telemetry
              </Button>
            </div>

            {/* Farmer Selection */}
            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Delivering Farmer
              </label>
              <select
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
              >
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.id}) — {f.village}, {f.district}
                  </option>
                ))}
              </select>
            </div>

            {/* Produce Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">Crop</label>
              <Input value={crop} onChange={(e) => setCrop(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">Variety</label>
                <Input value={variety} onChange={(e) => setVariety(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm" />
              </div>
            </div>

            {/* Weight Breakdown Box */}
            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3">
              <div className="text-xs font-bold text-farmly-foreground">
                Platform Scale Gross / Tare / Net
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-farmly-muted mb-1">Gross Scale Reading (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-farmly-muted mb-1">Tare Deduction (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-farmly-muted mb-1">Certified Net Weight</label>
                  <div className="px-3 py-2.5 rounded-xl bg-farmly-surface border border-farmly-border text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {netWeight} kg
                  </div>
                </div>
              </div>
            </div>

            {/* Moisture Meter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Digital Moisture Meter Reading (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={moisturePercent}
                  onChange={(e) => setMoisturePercent(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Gunny / Jute Bag Count
                </label>
                <Input
                  type="number"
                  value={bagsCount}
                  onChange={(e) => setBagsCount(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
            </div>


            <div className="flex justify-end gap-3 pt-3 border-t border-farmly-border">
              <Button type="submit" className="bg-farmly-primary text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Save Weighment &amp; Print Gate Pass
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
