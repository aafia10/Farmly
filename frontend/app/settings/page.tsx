"use client";

import React, { useState } from "react";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useTranslation } from "@/contexts/language-context";
import { useMockData } from "@/contexts/mock-data-context";
import { LanguageSelector } from "@/components/common/language-selector";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { resetAllData } = useMockData();

  // Notification toggles
  const [offerAlerts, setOfferAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [lotUpdates, setLotUpdates] = useState(true);
  const [evidenceAlerts, setEvidenceAlerts] = useState(true);
  const [disputeAlerts, setDisputeAlerts] = useState(true);

  // Accessibility toggles
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 4000);
  };

  return (
    <AppLayout title={t("nav.settings", "Settings")}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
            {t("settings.title", "Application Settings")}
          </h1>
          <p className="text-xs text-farmly-muted">
            {t(
              "settings.subtitle",
              "Configure visual appearance, preferred regional language, notification channels, and accessibility options."
            )}
          </p>
        </div>

        {resetSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            {t("settings.resetSuccess", "Prototype seed data has been reset to default initial state!")}
          </div>
        )}

        {/* 1. Theme Configuration */}
        <Card className="bg-farmly-surface border-farmly-border">
          <CardHeader>
            <CardTitle className="text-farmly-foreground text-base flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              {t("settings.themeTitle", "Theme & Visual Appearance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-farmly-muted">
              {t(
                "settings.themeSubtitle",
                "Choose your interface color palette. Supports high contrast dark mode designed for field sunlight readability."
              )}
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  theme === "dark"
                    ? "bg-farmly-primary border-farmly-primary text-white font-bold shadow-sm"
                    : "bg-farmly-surface-elevated border-farmly-border text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">{t("settings.darkMode", "Dark Mode")}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  theme === "light"
                    ? "bg-farmly-primary border-farmly-primary text-white font-bold shadow-sm"
                    : "bg-farmly-surface-elevated border-farmly-border text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs">{t("settings.lightMode", "Light Mode")}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  theme === "system"
                    ? "bg-farmly-primary border-farmly-primary text-white font-bold shadow-sm"
                    : "bg-farmly-surface-elevated border-farmly-border text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span className="text-xs">{t("settings.systemMode", "System")}</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 2. Language Selection */}
        <Card className="bg-farmly-surface border-farmly-border">
          <CardHeader>
            <CardTitle className="text-farmly-foreground text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {t("settings.languageTitle", "Language & Dialect (11 Regional Indian Languages)")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-farmly-muted">
              {t(
                "settings.languageSubtitle",
                "Select your interface language. Works across all role workspaces and public QR verification cards."
              )}
            </p>
            <LanguageSelector variant="settings" />
          </CardContent>
        </Card>

        {/* 3. Notification Preferences */}
        <Card className="bg-farmly-surface border-farmly-border">
          <CardHeader>
            <CardTitle className="text-farmly-foreground text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-500" />
              {t("settings.notificationsTitle", "Notification Preferences")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: t("settings.offerAlerts", "Buyer Offer Alerts"),
                desc: t("settings.offerAlertsDesc", "Notify immediately when a new offer or bid is submitted"),
                state: offerAlerts,
                set: setOfferAlerts,
              },
              {
                label: t("settings.paymentAlerts", "Escrow & Payment Milestones"),
                desc: t("settings.paymentAlertsDesc", "Alerts on payment initiation, reference submission, and release"),
                state: paymentAlerts,
                set: setPaymentAlerts,
              },
              {
                label: t("settings.lotUpdates", "Lot Status Updates"),
                desc: t("settings.lotUpdatesDesc", "Changes to harvest lot state (Active, Under Offer, Sold)"),
                state: lotUpdates,
                set: setLotUpdates,
              },
              {
                label: t("settings.evidenceAlerts", "Evidence Verification Logs"),
                desc: t("settings.evidenceAlertsDesc", "Weighment scale sync, moisture test results, lab certificates"),
                state: evidenceAlerts,
                set: setEvidenceAlerts,
              },
              {
                label: t("settings.disputeAlerts", "Dispute & Mediation Notifications"),
                desc: t("settings.disputeAlertsDesc", "Weight mismatch, quality disputes, or field inspection requests"),
                state: disputeAlerts,
                set: setDisputeAlerts,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70"
              >
                <div>
                  <div className="text-sm font-semibold text-farmly-foreground">{item.label}</div>
                  <div className="text-xs text-farmly-muted">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => item.set(!item.state)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    item.state ? "bg-farmly-primary" : "bg-farmly-border"
                  }`}
                  aria-label={item.label}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      item.state ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 4. Accessibility */}
        <Card className="bg-farmly-surface border-farmly-border">
          <CardHeader>
            <CardTitle className="text-farmly-foreground text-base flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              {t("settings.accessibilityTitle", "Accessibility & Field Usability")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70">
              <div>
                <div className="text-sm font-semibold text-farmly-foreground">
                  {t("settings.highContrast", "High Contrast Mode")}
                </div>
                <div className="text-xs text-farmly-muted">
                  {t("settings.highContrastDesc", "Enhanced border definitions for bright daylight usage")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  highContrast ? "bg-farmly-primary" : "bg-farmly-border"
                }`}
                aria-label="High Contrast Mode"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    highContrast ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70">
              <div>
                <div className="text-sm font-semibold text-farmly-foreground">
                  {t("settings.largeText", "Large Typography")}
                </div>
                <div className="text-xs text-farmly-muted">
                  {t("settings.largeTextDesc", "Increases body and table font sizes for easier reading")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLargeText(!largeText)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  largeText ? "bg-farmly-primary" : "bg-farmly-border"
                }`}
                aria-label="Large Typography"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    largeText ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70">
              <div>
                <div className="text-sm font-semibold text-farmly-foreground">
                  {t("settings.reducedMotion", "Reduced Motion")}
                </div>
                <div className="text-xs text-farmly-muted">
                  {t("settings.reducedMotionDesc", "Disables animations and transitions for lower-end mobile devices")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  reducedMotion ? "bg-farmly-primary" : "bg-farmly-border"
                }`}
                aria-label="Reduced Motion"
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    reducedMotion ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 5. Data Management / Reset Demo Data */}
        <Card className="bg-farmly-surface border-farmly-border">
          <CardHeader>
            <CardTitle className="text-farmly-foreground text-base flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-500" />
              {t("settings.dataTitle", "Demo Data & Prototype Management")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-farmly-muted">
              {t(
                "settings.dataSubtitle",
                "Reset all mock farmers, crop availabilities, lot lineages, evidence documents, offers, payments, and activity logs to original seed state."
              )}
            </p>

            {showResetConfirm ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 space-y-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  {t("settings.resetConfirm", "Are you sure you want to reset all mock data?")}
                </div>
                <p className="text-xs text-farmly-muted">
                  {t(
                    "settings.resetConfirmDesc",
                    "This will clear any newly registered farmers or created harvest lots and reload default test datasets."
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleReset}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs h-8 font-semibold"
                  >
                    {t("settings.resetYes", "Yes, Reset Data")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResetConfirm(false)}
                    className="border-farmly-border text-farmly-foreground text-xs h-8 hover:bg-farmly-surface-elevated"
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetConfirm(true)}
                className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs h-9"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                {t("settings.resetButton", "Reset All Prototype Data")}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
