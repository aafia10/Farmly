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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { Lot } from "@/types";

export default function HelperLotsPage() {
  const { user } = useAuth();
  const { farmers, lots, createLot } = useMockData();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || "");
  const [crop, setCrop] = useState("Wheat");
  const [variety, setVariety] = useState("Sharbati");
  const [quantity, setQuantity] = useState("5000");
  const [unit, setUnit] = useState("kg");
  const [qualityGrade, setQualityGrade] = useState<"Grade A" | "Grade B" | "Standard">("Grade A");
  const [location, setLocation] = useState("Anand Village Yard #4");
  const [weighmentScaleId, setWeighmentScaleId] = useState("WS-ANAND-02");
  const [createdLotResult, setCreatedLotResult] = useState<Lot | null>(null);

  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmer) return;

    const newLot = createLot({
      farmerId: selectedFarmer.id,
      farmerName: selectedFarmer.name,
      crop,
      variety,
      quantity: Number(quantity),
      unit,
      currentOwner: selectedFarmer.name,
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
    <AppLayout title="Lot Documentation Wizard">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Harvest Lot Documentation</h1>
          <p className="text-xs text-farmly-muted">
            Digitize and verify physical farm harvest lots with scale integration, moisture evidence, and tamper-evident identifiers.
          </p>
        </div>

        {/* Success Banner */}
        {createdLotResult && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">
                  Lot Successfully Documented: {createdLotResult.id}
                </h3>
                <p className="text-xs text-farmly-muted">
                  Digitized for {createdLotResult.farmerName} • {createdLotResult.quantity} {createdLotResult.unit} of {createdLotResult.crop}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Link href={`/lots/${createdLotResult.id}`}>
                <Button size="sm" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs">
                  View Lot & Add Evidence
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedLotResult(null)}
                className="border-farmly-border text-white text-xs hover:bg-farmly-surface-elevated"
              >
                Create Another Lot
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
              <span className={`text-sm font-semibold ${step === 1 ? "text-white" : "text-farmly-muted"}`}>
                Select Farmer
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
              <span className={`text-sm font-semibold ${step === 2 ? "text-white" : "text-farmly-muted"}`}>
                Harvest Details
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
              <span className={`text-sm font-semibold ${step === 3 ? "text-white" : "text-farmly-muted"}`}>
                Review & Confirm
              </span>
            </div>
          </div>

          {/* Step 1: Select Farmer */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Choose Registered Farmer</h3>
                <p className="text-xs text-farmly-muted">Select the verified grower for whom this harvest lot is being documented.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {farmers.map((farmer) => (
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
                        <div className="font-mono text-xs text-emerald-400 font-semibold">{farmer.id}</div>
                        <div className="font-bold text-white text-sm">{farmer.name}</div>
                        <div className="text-xs text-farmly-muted">{farmer.village}, {farmer.district}</div>
                      </div>
                      <StatusBadge status={farmer.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9"
                >
                  Continue to Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Lot Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Harvest Lot Specifications</h3>
                <p className="text-xs text-farmly-muted">Enter crop specifications, measured weights, and warehouse or field location.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Crop Name</Label>
                  <Input value={crop} onChange={(e) => setCrop(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Crop Variety</Label>
                  <Input value={variety} onChange={(e) => setVariety(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Measured Quantity</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit of Measurement</Label>
                  <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="quintals">Quintals (qtl)</option>
                    <option value="tonnes">Tonnes (MT)</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Quality Grade</Label>
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
                  <Label>Physical Weighment Scale ID</Label>
                  <Input value={weighmentScaleId} onChange={(e) => setWeighmentScaleId(e.target.value)} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label>Weighment / Storage Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-farmly-border text-white text-xs h-9 hover:bg-farmly-surface-elevated"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9"
                >
                  Review Summary <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Review & Create Verified Lot</h3>
                <p className="text-xs text-farmly-muted">Verify all information before minting digital lot identity.</p>
              </div>

              <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3 text-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-farmly-muted block">Farmer</span>
                    <span className="font-bold text-white">{selectedFarmer?.name} ({selectedFarmer?.id})</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">Crop & Variety</span>
                    <span className="font-bold text-white">{crop} ({variety})</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">Quantity</span>
                    <span className="font-bold text-emerald-400">{quantity} {unit}</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">Grade</span>
                    <span className="font-bold text-white">{qualityGrade}</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">Weighment Scale</span>
                    <span className="font-mono text-white text-xs">{weighmentScaleId || "Manual entry"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-farmly-muted block">Location</span>
                    <span className="text-white text-xs">{location}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-farmly-border text-white text-xs h-9 hover:bg-farmly-surface-elevated"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mint Harvest Lot
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Existing Lots Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Documented Produce Lots</h2>
            <span className="text-xs text-farmly-muted font-mono">{lots.length} active lots</span>
          </div>

          <Card className="bg-farmly-surface border-farmly-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-farmly-surface-elevated text-xs font-semibold text-farmly-muted uppercase border-b border-farmly-border">
                  <tr>
                    <th className="px-5 py-3.5">Lot ID</th>
                    <th className="px-5 py-3.5">Farmer</th>
                    <th className="px-5 py-3.5">Produce</th>
                    <th className="px-5 py-3.5">Quantity</th>
                    <th className="px-5 py-3.5">Quality</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-farmly-border/60">
                  {lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-farmly-surface-elevated/50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-white">{lot.id}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{lot.farmerName}</div>
                        <div className="text-xs text-farmly-muted font-mono">{lot.farmerId}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{lot.crop}</div>
                        <div className="text-xs text-farmly-muted">{lot.variety}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-white">{lot.quantity} {lot.unit}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                          {lot.qualityGrade}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={lot.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/lots/${lot.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-farmly-accent hover:bg-farmly-primary/20 h-8">
                            Inspect
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
