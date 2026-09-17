"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Scale,
  ShieldCheck,
  ChevronDown,
  Upload,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";
import { useMockData } from "@/contexts/mock-data-context";
import { EvidenceItem } from "@/types";

export default function HelperEvidencePage() {
  const { evidence, lots, farmers, addEvidence, updateEvidenceStatus } = useMockData();

  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedLotFilter, setSelectedLotFilter] = useState<string>("All");
  const [showAddForm, setShowAddForm] = useState(false);

  // New evidence form state
  const [lotId, setLotId] = useState(lots[0]?.id || "");
  const [type, setType] = useState<EvidenceItem["type"]>("Weighment");
  const [category, setCategory] = useState<EvidenceItem["category"]>("Evidence Backed");
  const [title, setTitle] = useState("Field Weighbridge Slip");
  const [value, setValue] = useState("Gross 5,120 kg, Tare 120 kg, Net 5,000 kg");
  const [source, setSource] = useState("Anand APMC Electronic Scale #4");
  const [issuer, setIssuer] = useState("Anand Mandi Inspector");
  const [documentRef, setDocumentRef] = useState("WB-2026-09-0091");

  const filtered = evidence.filter((item) => {
    const matchStatus = filterStatus === "All" || item.status === filterStatus;
    const matchLot = selectedLotFilter === "All" || item.lotId === selectedLotFilter;
    return matchStatus && matchLot;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedLot = lots.find((l) => l.id === lotId);
    addEvidence({
      lotId,
      farmerId: matchedLot?.farmerId || "FM-10294",
      farmerName: matchedLot?.farmerName || "Ramesh Patel",
      type,
      category,
      title,
      value,
      source,
      status: "Verified",
      issuer: issuer || undefined,
      documentRef: documentRef || undefined,
    });
    setShowAddForm(false);
  };

  return (
    <AppLayout title="Evidence Verification Workbench">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Field Evidence Workbench</h1>
            <p className="text-xs text-farmly-muted">
              Inspect, cross-verify, and approve physical proof artifacts: weighbridge printouts, moisture meter readings, and lab test sheets.
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showAddForm ? "Close Form" : "Upload Evidence Artifact"}
          </Button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Total Artifacts</div>
            <div className="text-2xl font-bold text-white mt-1">{evidence.length}</div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Pending Review</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {evidence.filter((e) => e.status === "Pending").length}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Verified Badges</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {evidence.filter((e) => e.status === "Verified").length}
            </div>
          </Card>
          <Card className="bg-farmly-surface border-farmly-border p-4">
            <div className="text-xs text-farmly-muted">Needs Attention</div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {evidence.filter((e) => e.status === "Needs Review").length}
            </div>
          </Card>
        </div>

        {/* Add Evidence Expandable Form */}
        {showAddForm && (
          <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              Upload & Certify Physical Evidence Artifact
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Attach to Harvest Lot</Label>
                  <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
                    {lots.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} — {l.crop} ({l.farmerName})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Evidence Type</Label>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value as EvidenceItem["type"])}
                  >
                    <option value="Weighment">Weighment Slip</option>
                    <option value="Moisture Test">Moisture Test</option>
                    <option value="Quality Certificate">Quality Certificate</option>
                    <option value="Field Photo">Field Photo</option>
                    <option value="Scale Receipt">Scale Receipt</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Verification Tier</Label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EvidenceItem["category"])}
                  >
                    <option value="Evidence Backed">Evidence Backed (Field Recorded)</option>
                    <option value="Externally Verified">Externally Verified (3rd Party Lab)</option>
                    <option value="Farmer Declared">Farmer Declared</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Artifact Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Recorded Value / Result</Label>
                  <Input value={value} onChange={(e) => setValue(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Hardware / Sensor Source</Label>
                  <Input value={source} onChange={(e) => setSource(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Authorized Issuer</Label>
                  <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Document / Certificate Ref #</Label>
                  <Input value={documentRef} onChange={(e) => setDocumentRef(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="border-farmly-border text-white text-xs h-9 hover:bg-farmly-surface-elevated"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs h-9"
                >
                  Commit & Verify Artifact
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-farmly-surface border border-farmly-border">
          <div className="flex items-center gap-2 overflow-x-auto">
            {["All", "Pending", "Reviewed", "Verified", "Needs Review"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterStatus === st
                    ? "bg-farmly-primary text-white"
                    : "text-farmly-muted hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-farmly-muted">Lot:</span>
            <Select
              value={selectedLotFilter}
              onChange={(e) => setSelectedLotFilter(e.target.value)}
              className="h-8 text-xs py-1"
            >
              <option value="All">All Lots</option>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} ({l.crop})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Evidence Cards Grid */}
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-farmly-surface border-farmly-border p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-farmly-accent">{item.id}</span>
                    <span className="text-xs text-farmly-muted">•</span>
                    <span className="font-mono text-xs text-white">{item.lotId}</span>
                    <span className="text-xs text-farmly-muted">•</span>
                    <span className="text-xs text-white font-medium">{item.farmerName}</span>
                    <StatusBadge status={item.status} size="sm" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-farmly-surface-elevated border border-farmly-border font-mono text-farmly-muted">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base">{item.title}</h3>
                  <div className="p-2.5 rounded-lg bg-farmly-surface-elevated border border-farmly-border/70 text-xs text-emerald-300 font-mono">
                    {item.value}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-farmly-muted pt-1">
                    <span>Source: {item.source}</span>
                    {item.issuer && <span>Issuer: {item.issuer}</span>}
                    {item.documentRef && <span className="font-mono">Ref: {item.documentRef}</span>}
                    <span className="font-mono text-[11px]">{item.timestamp}</span>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  {item.status === "Pending" && (
                    <Button
                      size="sm"
                      onClick={() => updateEvidenceStatus(item.id, "Reviewed")}
                      className="bg-sky-600 hover:bg-sky-500 text-white text-xs h-8"
                    >
                      Mark Reviewed
                    </Button>
                  )}
                  {item.status !== "Verified" && (
                    <Button
                      size="sm"
                      onClick={() => updateEvidenceStatus(item.id, "Verified")}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                    >
                      Verify Artifact
                    </Button>
                  )}
                  {item.status !== "Needs Review" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateEvidenceStatus(item.id, "Needs Review")}
                      className="border-red-500/30 text-red-400 hover:bg-red-950/20 text-xs h-8"
                    >
                      Flag Issue
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
