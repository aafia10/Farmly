"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wheat, Plus, Info, ArrowRight, CheckCircle2, Boxes } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/auth/auth-input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function HelperCropAvailabilityPage() {
  const { cropAvailabilities, addCropAvailability, farmers } = useMockData();
  const [showForm, setShowForm] = useState(false);

  const [selectedFarmerId, setSelectedFarmerId] = useState(farmers[0]?.id || "");
  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [harvestDate, setHarvestDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"Draft" | "Available" | "Under Review">("Available");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const farmer = farmers.find((f) => f.id === selectedFarmerId) || farmers[0];

    const newAvail = addCropAvailability({
      farmerId: farmer.id,
      farmerName: farmer.name,
      crop: crop || "Wheat",
      variety: variety || "Standard Variety",
      estimatedQuantity: Number(quantity) || 500,
      unit,
      expectedHarvestDate: harvestDate || "15 Oct 2026",
      location: location || `${farmer.village} Farm Field`,
      notes,
      status,
    });

    setSuccessNotice(`Crop availability ${newAvail.id} recorded for ${farmer.name}. Note: This is an unverified pre-harvest declaration.`);
    setShowForm(false);
    setCrop("");
    setVariety("");
    setQuantity("");
    setNotes("");
  };

  return (
    <AppLayout title="Pre-Harvest Crop Availability">
      <div className="space-y-6">
        {/* Distinction Banner Required by Section 8 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs sm:text-sm text-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-white">Crop Availability vs. Physically Verified Lot</h4>
            <p className="leading-relaxed text-amber-200/90">
              Crop availability represents a farmer&apos;s expected upcoming harvest declaration. It is <strong>NOT</strong> a physically verified or weighbridge-tested lot until harvest weighment evidence is recorded.
            </p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Availability Declarations</h2>
            <p className="text-xs sm:text-sm text-farmly-muted">
              Record farmer harvest projections and convert available batches into lots.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="md"
            className="gap-2 shadow-md shadow-farmly-primary/30"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? "Cancel Form" : "Record New Availability"}</span>
          </Button>
        </div>

        {successNotice && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs sm:text-sm text-emerald-300 animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {successNotice}
            </span>
            <button onClick={() => setSuccessNotice(null)} className="text-xs underline hover:text-white">
              Dismiss
            </button>
          </div>
        )}

        {/* Creation Form Modal/Card */}
        {showForm && (
          <Card className="p-6 sm:p-8 border-farmly-accent/40 bg-farmly-surface-elevated/70 animate-fade-in space-y-4">
            <h3 className="text-lg font-bold text-white">Record Pre-Harvest Crop Availability</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="selectFarmer" className="block text-xs font-semibold text-farmly-muted">
                    Select Assisted Farmer
                  </label>
                  <select
                    id="selectFarmer"
                    value={selectedFarmerId}
                    onChange={(e) => setSelectedFarmerId(e.target.value)}
                    className="w-full rounded-xl bg-farmly-surface px-4 py-3 text-sm text-white border border-farmly-border focus:border-farmly-accent outline-none"
                  >
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id} className="bg-farmly-surface text-white">
                        {f.name} ({f.id} — {f.village})
                      </option>
                    ))}
                  </select>
                </div>

                <AuthInput
                  id="cropName"
                  label="Crop Name"
                  placeholder="e.g. Sharbati Wheat, Basmati Rice"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AuthInput
                  id="variety"
                  label="Variety / Hybrid"
                  placeholder="e.g. C-306, Pusa 1121"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  required
                />

                <AuthInput
                  id="quantity"
                  label="Estimated Quantity"
                  type="number"
                  placeholder="e.g. 500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />

                <div className="space-y-1.5 text-left">
                  <label htmlFor="unit" className="block text-xs font-semibold text-farmly-muted">Unit</label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-xl bg-farmly-surface px-4 py-3 text-sm text-white border border-farmly-border outline-none focus:border-farmly-accent"
                  >
                    <option value="kg" className="bg-farmly-surface text-white">Kilograms (kg)</option>
                    <option value="Quintals" className="bg-farmly-surface text-white">Quintals (q)</option>
                    <option value="Metric Tons" className="bg-farmly-surface text-white">Metric Tons (MT)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="harvestDate"
                  label="Expected Harvest Date"
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  required
                />

                <AuthInput
                  id="location"
                  label="Field / Plot Location"
                  placeholder="e.g. Anandpur Plot 4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <AuthInput
                id="notes"
                label="Cultivation & Field Notes (Optional)"
                placeholder="e.g. Organic manure applied, canal irrigated"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="default">
                  Save Availability Record
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Declarations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cropAvailabilities.map((item) => (
            <Card key={item.id} hoverGlow className="p-6 border-farmly-border/70 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-farmly-primary/30 text-emerald-300">
                      <Wheat className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                        {item.crop}
                      </h4>
                      <span className="text-xs text-farmly-muted-dark font-mono">{item.variety}</span>
                    </div>
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-farmly-border/40">
                  <div>
                    <span className="text-farmly-muted-dark block">Farmer:</span>
                    <span className="font-semibold text-white">{item.farmerName}</span>
                  </div>
                  <div>
                    <span className="text-farmly-muted-dark block">Estimated Yield:</span>
                    <span className="font-mono font-bold text-emerald-300">{item.estimatedQuantity} {item.unit}</span>
                  </div>
                  <div>
                    <span className="text-farmly-muted-dark block">Harvest Date:</span>
                    <span className="text-white">{item.expectedHarvestDate}</span>
                  </div>
                  <div>
                    <span className="text-farmly-muted-dark block">Location:</span>
                    <span className="text-white truncate">{item.location}</span>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-xs text-farmly-muted italic line-clamp-2">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-4 mt-2 flex items-center justify-between border-t border-farmly-border/30">
                <span className="text-[11px] font-mono text-amber-300/90 flex items-center gap-1">
                  ● Unverified Pre-Harvest
                </span>
                {item.status !== "Converted to Lot" && (
                  <Link href={`/helper/lots?from=${item.id}`}>
                    <Button variant="default" size="sm" className="gap-1.5 text-xs h-8">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Convert to Physical Lot</span>
                    </Button>
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
