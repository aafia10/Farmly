"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, Truck, CheckCircle2, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";

export default function CustodyHandoverPage() {
  const { lots, updateLotStatus } = useMockData();

  const [selectedLotId, setSelectedLotId] = useState("KS-MH-NSK-WHT-20260910-00125");
  const [carrierName, setCarrierName] = useState("GreenHarvest Logistics Fleet");
  const [vehicleNumber, setVehicleNumber] = useState("MH-15-EG-4402");
  const [driverName, setDriverName] = useState("Kailash Shinde");
  const [driverMobile, setDriverMobile] = useState("9822019944");
  const [destinationHub, setDestinationHub] = useState("Bhiwandi Central Wholesale Agro Hub");
  const [handoverSuccess, setHandoverSuccess] = useState<string | null>(null);

  const handleHandover = (e: React.FormEvent) => {
    e.preventDefault();
    updateLotStatus(selectedLotId, "In Transit");
    setHandoverSuccess(
      `Custody of Lot ${selectedLotId} successfully transferred to ${carrierName} (Vehicle: ${vehicleNumber}). Delivery challan DC-NSK-2026-881 generated.`
    );
  };

  return (
    <AppLayout title="Chain of Custody Handover">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-farmly-foreground">Distributor Dispatch &amp; Custody Handover</h2>
          <p className="text-xs text-farmly-muted">
            Transfers physical custody from Sinnar Hub to buyer transport with signed electronic gate pass.
          </p>
        </div>

        {handoverSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{handoverSuccess}</span>
            </div>
            <Link href={`/lots/${selectedLotId}`}>
              <Button size="sm" variant="outline" className="text-xs border-emerald-500/40">
                Inspect Traceability <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        <Card className="p-6 border border-farmly-border bg-farmly-surface">
          <form onSubmit={handleHandover} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Select Lot Ready for Dispatch
              </label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
              >
                {lots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} &bull; {l.crop} ({l.quantity} {l.unit}) &bull; Owner: {l.currentOwner}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Logistics Carrier / Transporter
                </label>
                <Input value={carrierName} onChange={(e) => setCarrierName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Truck Vehicle Registration No.
                </label>
                <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">Driver Name</label>
                <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">Driver Mobile</label>
                <Input value={driverMobile} onChange={(e) => setDriverMobile(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Destination Warehouse / Retail Hub
              </label>
              <Input value={destinationHub} onChange={(e) => setDestinationHub(e.target.value)} required />
            </div>

            <div className="p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center gap-2.5 text-xs text-farmly-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Dispatch gate pass automatically advances Stage 2 (Goods Handed Over) in the escrow payment timeline.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-farmly-border">
              <Button type="submit" className="bg-farmly-primary text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> Authorize Dispatch &amp; Seal Gate Pass
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
