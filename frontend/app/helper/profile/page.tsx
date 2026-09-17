"use client";

import React, { useState } from "react";
import {
  User,
  HeartHandshake,
  Users,
  Wheat,
  Activity,
  MapPin,
  Phone,
  Mail,
  Building,
  CheckCircle2,
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

export default function HelperProfilePage() {
  const { user } = useAuth();
  const { farmers, cropAvailabilities, helperActivities } = useMockData();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"info" | "activities">("info");
  const [fullName, setFullName] = useState(user?.fullName || "Priya Sharma");
  const [email, setEmail] = useState(user?.email || "helper@farmly.demo");
  const [mobile, setMobile] = useState(user?.mobile || "9876500001");
  const [district, setDistrict] = useState(user?.district || "Anand");
  const [state, setState] = useState(user?.state || "Gujarat");
  const [organization, setOrganization] = useState(user?.organization || "Kheda District FPO Assistance Desk");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Field stats
  const assistedFarmersCount = farmers.filter(
    (f) => f.assistedBy?.helperName === fullName || f.assistedBy?.helperName === "Priya Sharma"
  ).length;

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
    <AppLayout title="Field Assistant Profile">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner */}
        <div className="bg-farmly-surface border border-farmly-border rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-emerald-400/40 flex items-center justify-center text-3xl font-extrabold text-farmly-foreground shadow-lg shrink-0">
            {fullName.charAt(0)}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold text-farmly-foreground">{fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5" /> Certified Field Assistant
              </span>
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

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-farmly-foreground">{assistedFarmersCount}</div>
              <div className="text-xs text-farmly-muted">Farmers Registered</div>
            </div>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wheat className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-farmly-foreground">{cropAvailabilities.length}</div>
              <div className="text-xs text-farmly-muted">Crop Declarations</div>
            </div>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-farmly-foreground">{helperActivities.length}</div>
              <div className="text-xs text-farmly-muted">Assistance Logs</div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-farmly-border pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "info"
                ? "bg-farmly-surface-elevated text-emerald-300 border border-farmly-border"
                : "text-farmly-muted hover:text-farmly-foreground"
            }`}
          >
            <User className="w-4 h-4" /> Personal Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "activities"
                ? "bg-farmly-surface-elevated text-emerald-300 border border-farmly-border"
                : "text-farmly-muted hover:text-farmly-foreground"
            }`}
          >
            <Activity className="w-4 h-4" /> Recent Field Activities
          </button>
        </div>

        {/* Tab 1: Info Form */}
        {activeTab === "info" && (
          <Card className="bg-farmly-surface border-farmly-border">
            <CardHeader>
              <CardTitle className="text-farmly-foreground text-base">Field Representative Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                {savedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Profile changes saved successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="hname">Full Name</Label>
                    <Input id="hname" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hemail">Email Address</Label>
                    <Input id="hemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hmobile">Mobile Number</Label>
                    <Input id="hmobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="horg">Assigned FPO / Organization</Label>
                    <Input id="horg" value={organization} onChange={(e) => setOrganization(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hdistrict">Operating District</Label>
                    <Input id="hdistrict" value={district} onChange={(e) => setDistrict(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hstate">Operating State</Label>
                    <Input id="hstate" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Activity Summary */}
        {activeTab === "activities" && (
          <Card className="bg-farmly-surface border-farmly-border p-6 space-y-4">
            <h3 className="font-bold text-farmly-foreground text-base">Field Assistance Audit Trail</h3>
            <div className="space-y-3">
              {helperActivities.map((act) => (
                <div key={act.id} className="p-3 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-farmly-foreground">{act.action}</div>
                    <div className="text-xs text-farmly-muted">{act.details}</div>
                    <div className="text-[11px] text-farmly-muted-dark font-mono">{act.timestamp}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    {act.badgeStatus}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
