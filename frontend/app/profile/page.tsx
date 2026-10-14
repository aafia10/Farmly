"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  MapPin,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Lock,
  Globe,
  Save,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";

export default function ProfilePage() {
  const { user, role } = useAuth();
  const { farmers } = useMockData();
  const { language, setLanguage, t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"info" | "security" | "preferences">("info");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [district, setDistrict] = useState(user?.district || "Anand");
  const [state, setState] = useState(user?.state || "Gujarat");
  const [organization, setOrganization] = useState(user?.organization || "Kheda District Farmers Co-op");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Match farmer record if role is farmer
  const matchedFarmer = farmers.find((f) => f.mobile === user?.mobile || f.name === user?.fullName);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const updated = {
        ...user,
        fullName,
        email,
        mobile,
        district,
        state,
        organization,
      };
      localStorage.setItem("farmly_session", JSON.stringify(updated));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AppLayout title={t("nav.profile", "User Profile")}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Profile Header Banner */}
        <div className="bg-farmly-surface border border-farmly-border rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-farmly-primary to-emerald-600 border-2 border-farmly-accent/40 flex items-center justify-center text-3xl font-extrabold text-farmly-foreground shadow-lg shrink-0">
            {fullName.charAt(0) || "U"}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-farmly-foreground">{fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                {t(`role.${role}`, role)} {t("common.mode", "Account")}
              </span>
              {matchedFarmer && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-farmly-primary/20 text-emerald-800 dark:text-emerald-300 border border-farmly-primary/40">
                  {matchedFarmer.id}
                </span>
              )}
            </div>

            <p className="text-farmly-muted text-sm flex items-center justify-center sm:justify-start gap-2">
              <Building className="w-4 h-4 text-farmly-accent" />
              {organization}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-farmly-muted pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-farmly-muted" /> {district}, {state}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-farmly-muted" /> +91 {mobile}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-farmly-muted" /> {email}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 border-b border-farmly-border pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "info"
                ? "bg-farmly-surface-elevated text-emerald-800 dark:text-emerald-300 border border-farmly-border font-bold"
                : "text-farmly-muted hover:text-farmly-foreground"
            }`}
          >
            <User className="w-4 h-4" /> {t("profile.personalDetails", "Personal Details")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "security"
                ? "bg-farmly-surface-elevated text-emerald-800 dark:text-emerald-300 border border-farmly-border font-bold"
                : "text-farmly-muted hover:text-farmly-foreground"
            }`}
          >
            <Shield className="w-4 h-4" /> {t("profile.security", "Security & Passwords")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "preferences"
                ? "bg-farmly-surface-elevated text-emerald-800 dark:text-emerald-300 border border-farmly-border font-bold"
                : "text-farmly-muted hover:text-farmly-foreground"
            }`}
          >
            <Globe className="w-4 h-4" /> {t("profile.language", "Language & Regional")}
          </button>
        </div>

        {/* Tab 1: Info Form */}
        {activeTab === "info" && (
          <Card className="bg-farmly-surface border-farmly-border">
            <CardHeader>
              <CardTitle className="text-farmly-foreground text-base">
                {t("profile.accountInfo", "Account Information")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                {savedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {t("profile.savedSuccess", "Profile changes saved successfully!")}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullname">{t("profile.fullName", "Full Name")}</Label>
                    <Input
                      id="fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t("profile.email", "Email Address")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile">{t("profile.mobile", "Mobile Number")}</Label>
                    <Input
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="org">{t("profile.organization", "Organization / FPO")}</Label>
                    <Input
                      id="org"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="district">{t("profile.district", "District")}</Label>
                    <Input
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">{t("profile.state", "State")}</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                </div>

                {matchedFarmer && (
                  <div className="mt-4 p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {t("profile.farmerIdCard", "Farmer Identity Card Details")}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-farmly-muted">{t("profile.verification", "Verification")}:</span>{" "}
                        <span className="text-farmly-foreground font-medium">{matchedFarmer.verificationLevel}</span>
                      </div>
                      <div>
                        <span className="text-farmly-muted">{t("profile.farmingCategory", "Farming")}:</span>{" "}
                        <span className="text-farmly-foreground font-medium">{matchedFarmer.farmingCategory}</span>
                      </div>
                      <div>
                        <span className="text-farmly-muted">{t("common.assistedBy", "Assisted By")}:</span>{" "}
                        <span className="text-farmly-foreground font-medium">
                          {matchedFarmer.assistedBy?.helperName || "Self"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <Button type="submit" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white">
                    <Save className="w-4 h-4 mr-2" />
                    {t("common.save", "Save Changes")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Security */}
        {activeTab === "security" && (
          <Card className="bg-farmly-surface border-farmly-border">
            <CardHeader>
              <CardTitle className="text-farmly-foreground text-base">
                {t("profile.securityTitle", "Security & Authentication")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-farmly-accent" />
                  <div>
                    <div className="font-semibold text-farmly-foreground text-sm">
                      {t("profile.demoPassword", "Demo Password")}
                    </div>
                    <div className="text-xs text-farmly-muted">
                      Farmly@123 ({t("profile.presetTesting", "Preset for prototype testing")})
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>{t("profile.currentPassword", "Current Password")}</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("profile.newPassword", "New Password")}</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("profile.confirmNewPassword", "Confirm New Password")}</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button className="bg-farmly-primary hover:bg-farmly-primary-hover text-white">
                  {t("profile.updatePassword", "Update Password")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Language & Regional Preferences */}
        {activeTab === "preferences" && (
          <Card className="bg-farmly-surface border-farmly-border">
            <CardHeader>
              <CardTitle className="text-farmly-foreground text-base">
                {t("profile.prefLanguage", "Preferred Regional Language")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-farmly-muted">
                {t(
                  "profile.prefLanguageDesc",
                  "Select your preferred language. Farmly supports 11 Indian regional languages across all forms, lot records, and marketplace summaries."
                )}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      language === lang.code
                        ? "bg-farmly-primary border-farmly-primary text-white font-bold shadow-sm"
                        : "bg-farmly-surface-elevated border-farmly-border text-farmly-muted hover:text-farmly-foreground"
                    }`}
                  >
                    <div className="text-sm font-semibold">{lang.nativeName}</div>
                    <div className={`text-xs ${language === lang.code ? "text-emerald-700 dark:text-emerald-100" : "text-farmly-muted-dark"}`}>
                      {lang.name}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
