"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  PhoneCall,
  Download,
  AlertCircle,
  CheckCircle2,
  Database,
  EyeOff,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const [voiceConsent, setVoiceConsent] = useState(true);
  const [dataSharingConsent, setDataSharingConsent] = useState(true);
  const [qualityTelemetryConsent, setQualityTelemetryConsent] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDownload = () => {
    const data = {
      user,
      consentRecords: {
        voiceAssistance: voiceConsent,
        fpoDataSharing: dataSharingConsent,
        scaleTelemetry: qualityTelemetryConsent,
        recordedAt: "10 Sep 2026, 08:30:15 IST",
        assistedBy: "Priya Sharma (Field Helper ID: HLP-NSK-02)",
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farmly-privacy-ledger-${user?.id || "data"}.json`;
    a.click();
  };

  return (
    <AppLayout title="Consent & Privacy">
      <div className="max-w-4xl space-y-6">
        {/* Header Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-farmly-foreground flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-farmly-primary dark:text-farmly-accent-light shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base text-farmly-foreground">Farmer Privacy Charter</h4>
            <p className="text-farmly-muted">
              Farmly enforces strict data minimization. Contact numbers, land titles, and financial details are never published on the open marketplace. Buyers see only aggregate grade, weight, and district.
            </p>
          </div>
        </div>

        {/* What Data We Collect & Why */}
        <Card className="p-5 sm:p-6 border border-farmly-border">
          <div className="flex items-center gap-2.5 mb-4">
            <Database className="w-5 h-5 text-farmly-primary dark:text-farmly-accent-light" />
            <h3 className="font-bold text-base text-farmly-foreground">What Data Is Collected & Why</h3>
          </div>

          <div className="divide-y divide-farmly-border text-sm">
            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="font-medium text-farmly-foreground flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Farmer Identity & Phone
              </div>
              <div className="sm:col-span-2 text-farmly-muted text-xs sm:text-sm">
                Used strictly for payment escrow notifications, OTP authentication, and FPO dividend distribution. Never sold to third parties or telemarketers.
              </div>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="font-medium text-farmly-foreground flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                Weighment & Lab Telemetry
              </div>
              <div className="sm:col-span-2 text-farmly-muted text-xs sm:text-sm">
                Scale receipt tare deductions and moisture lab assays are attached directly to lot records to ensure fair price settlement and eliminate weight dispute losses.
              </div>
            </div>

            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="font-medium text-farmly-foreground flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                Public QR Code Masking
              </div>
              <div className="sm:col-span-2 text-farmly-muted text-xs sm:text-sm">
                Consumer retail QR codes display only the origin region (e.g. Sinnar, Nashik) and milling date. Exact farm boundaries and mobile numbers are completely masked.
              </div>
            </div>
          </div>
        </Card>

        {/* Explicit Consent Controls */}
        <Card className="p-5 sm:p-6 border border-farmly-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-5 h-5 text-farmly-primary dark:text-farmly-accent-light" />
              <h3 className="font-bold text-base text-farmly-foreground">Explicit Consent Preferences</h3>
            </div>
            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              Audit Verified
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <div className="space-y-0.5 max-w-md">
                <label htmlFor="voice-consent" className="text-sm font-semibold text-farmly-foreground cursor-pointer">
                  AgroSathi Voice Interaction Consent
                </label>
                <p className="text-xs text-farmly-muted">
                  Allow AgroSathi assistant to process voice queries in your regional language for offer explanation and payment updates.
                </p>
              </div>
              <input
                id="voice-consent"
                type="checkbox"
                checked={voiceConsent}
                onChange={(e) => setVoiceConsent(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded border-farmly-input-border focus:ring-farmly-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <div className="space-y-0.5 max-w-md">
                <label htmlFor="fpo-sharing" className="text-sm font-semibold text-farmly-foreground cursor-pointer">
                  FPO & Collection Hub Data Sharing
                </label>
                <p className="text-xs text-farmly-muted">
                  Share harvest weighment records with your registered cooperative (Sahyadri FPO) for collective bargaining and transport optimization.
                </p>
              </div>
              <input
                id="fpo-sharing"
                type="checkbox"
                checked={dataSharingConsent}
                onChange={(e) => setDataSharingConsent(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded border-farmly-input-border focus:ring-farmly-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border">
              <div className="space-y-0.5 max-w-md">
                <label htmlFor="telemetry-consent" className="text-sm font-semibold text-farmly-foreground cursor-pointer">
                  Automated Digital Scale Telemetry
                </label>
                <p className="text-xs text-farmly-muted">
                  Permit direct ingestion of certified weighbridge digital printouts into lot provenance ledger.
                </p>
              </div>
              <input
                id="telemetry-consent"
                type="checkbox"
                checked={qualityTelemetryConsent}
                onChange={(e) => setQualityTelemetryConsent(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded border-farmly-input-border focus:ring-farmly-primary"
              />
            </div>
          </div>

          {/* Timestamp details */}
          <div className="p-3 bg-farmly-surface rounded-xl border border-farmly-border text-xs text-farmly-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Recorded on: <strong className="text-farmly-foreground">10 Sep 2026, 08:30 IST</strong>
            </span>
            <span>Assisted by: Field Helper Priya Sharma</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} className="bg-farmly-primary text-white hover:bg-farmly-primary/90">
              Save Privacy Choices
            </Button>
            {savedNotice && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Changes saved to local ledger
              </span>
            )}
          </div>
        </Card>

        {/* Data Portability and Erasure */}
        <Card className="p-5 sm:p-6 border border-farmly-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-farmly-foreground">Data Portability &amp; Rights</h3>
              <p className="text-xs text-farmly-muted mt-0.5">
                Download an export of all lot declarations, scale receipts, and consent timestamps.
              </p>
            </div>
            <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2 border-farmly-border">
              <Download className="w-4 h-4" /> Download My Records
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
