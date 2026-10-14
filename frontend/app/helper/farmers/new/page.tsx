"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, UserPlus, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/auth/auth-input";
import { FormError } from "@/components/auth/form-error";
import { addFarmerSchema, AddFarmerFormData } from "@/lib/validation";
import { useMockData } from "@/contexts/mock-data-context";
import { useAuth } from "@/contexts/auth-context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";
import { Farmer } from "@/types";

export default function AddFarmerPage() {
  const { addFarmer } = useMockData();
  const { user } = useAuth();
  const [createdFarmer, setCreatedFarmer] = useState<Farmer | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddFarmerFormData>({
    resolver: zodResolver(addFarmerSchema),
    defaultValues: {
      fullName: "",
      mobile: "",
      village: "",
      taluka: "",
      district: user?.district || "Anand",
      state: user?.state || "Gujarat",
      preferredLanguage: "gu",
      farmingCategory: "Crops (Wheat & Pulses)",
      fpo: user?.organization || "Kheda District Farmers Producer Co.",
      verificationLevel: "Field Verified",
      consent: true,
    },
  });

  const onSubmit = async (data: AddFarmerFormData) => {
    setFormError(null);
    try {
      const newFarmer = addFarmer({
        name: data.fullName,
        mobile: data.mobile,
        village: data.village,
        taluka: data.taluka,
        district: data.district,
        state: data.state,
        language: data.preferredLanguage,
        farmingCategory: data.farmingCategory,
        fpo: data.fpo,
        consent: data.consent,
        verificationLevel: data.verificationLevel,
        status: "Active",
        assistedBy: {
          helperName: user?.fullName || "Priya Sharma",
          date: "17 Sep 2026",
        },
      });

      setCreatedFarmer(newFarmer);
      reset();
    } catch {
      setFormError("Failed to register farmer. Please check the inputs.");
    }
  };

  return (
    <AppLayout title="Onboard Farmer">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/helper/farmers"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-farmly-muted hover:text-farmly-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Farmers Directory</span>
        </Link>

        {createdFarmer ? (
          /* Success Screen */
          <Card className="p-8 sm:p-12 text-center border-emerald-500/50 bg-emerald-950/20 shadow-2xl space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-farmly-foreground">
                Farmer Successfully Registered
              </h2>
              <p className="text-sm text-farmly-muted">
                A digital farm identity has been created and verified on the Farmly infrastructure.
              </p>
            </div>

            {/* Credential Box */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-farmly-surface border border-farmly-accent/40 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-farmly-border/50">
                <span className="text-xs text-farmly-muted">Farmer ID:</span>
                <span className="font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {createdFarmer.id}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-farmly-muted">Farmer Name:</span>
                <span className="font-bold text-farmly-foreground">{createdFarmer.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-farmly-muted">Village / District:</span>
                <span className="text-farmly-foreground">{createdFarmer.village}, {createdFarmer.district}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-farmly-border/40">
                <span className="text-farmly-muted">Registration Method:</span>
                <span className="font-semibold text-farmly-accent flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Assisted by Helper ({user?.fullName || "Priya Sharma"})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setCreatedFarmer(null)}
              >
                Register Another Farmer
              </Button>
              <Link href={`/helper/farmers/${createdFarmer.id}`}>
                <Button variant="default" size="md" className="gap-2">
                  <span>Open Farmer Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Registration Form */
          <Card className="p-6 sm:p-10 border-farmly-border/80">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-farmly-border/50">
              <div className="p-3 rounded-2xl bg-farmly-primary/30 text-emerald-700 dark:text-emerald-300 border border-farmly-accent/30">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-farmly-foreground">Farmer Onboarding Form</h2>
                <p className="text-xs sm:text-sm text-farmly-muted">
                  Record farm holding, location, consent, and verification level.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <FormError message={formError || undefined} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="fullName"
                  label="Farmer's Full Name"
                  placeholder="e.g. Rajesh Bhai Patel"
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />

                <AuthInput
                  id="mobile"
                  label="10-Digit Mobile Number"
                  placeholder="e.g. 9876543210"
                  error={errors.mobile?.message}
                  {...register("mobile")}
                />
              </div>

              {/* Geographic Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="village"
                  label="Village"
                  placeholder="e.g. Anandpur"
                  error={errors.village?.message}
                  {...register("village")}
                />

                <AuthInput
                  id="taluka"
                  label="Taluka / Tehsil"
                  placeholder="e.g. Anand"
                  error={errors.taluka?.message}
                  {...register("taluka")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="district"
                  label="District"
                  placeholder="e.g. Anand"
                  error={errors.district?.message}
                  {...register("district")}
                />

                <AuthInput
                  id="state"
                  label="State"
                  placeholder="e.g. Gujarat"
                  error={errors.state?.message}
                  {...register("state")}
                />
              </div>

              {/* Language & Farming Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="preferredLanguage" className="block text-xs sm:text-sm font-semibold text-farmly-muted">
                    Preferred Language
                  </label>
                  <select
                    id="preferredLanguage"
                    className="w-full rounded-xl bg-farmly-surface-elevated px-4 py-3 text-sm text-farmly-foreground border border-farmly-border focus:border-farmly-accent outline-none"
                    {...register("preferredLanguage")}
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.nativeName} className="bg-farmly-surface text-farmly-foreground">
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>

                <AuthInput
                  id="farmingCategory"
                  label="Primary Farming Category"
                  placeholder="e.g. Crops, Dairy, Horticulture"
                  error={errors.farmingCategory?.message}
                  {...register("farmingCategory")}
                />
              </div>

              {/* FPO & Verification Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="fpo"
                  label="FPO / Cooperative Society"
                  placeholder="e.g. Kheda District FPO"
                  error={errors.fpo?.message}
                  {...register("fpo")}
                />

                <div className="space-y-1.5 text-left">
                  <label htmlFor="verificationLevel" className="block text-xs sm:text-sm font-semibold text-farmly-muted">
                    Verification Level
                  </label>
                  <select
                    id="verificationLevel"
                    className="w-full rounded-xl bg-farmly-surface-elevated px-4 py-3 text-sm text-farmly-foreground border border-farmly-border focus:border-farmly-accent outline-none"
                    {...register("verificationLevel")}
                  >
                    <option value="Basic" className="bg-farmly-surface text-farmly-foreground">Basic (Self-Declared)</option>
                    <option value="Field Verified" className="bg-farmly-surface text-farmly-foreground">Field Verified (By Helper)</option>
                    <option value="Identity Confirmed" className="bg-farmly-surface text-farmly-foreground">Identity Confirmed (Official Documents)</option>
                  </select>
                </div>
              </div>

              {/* Consent Box */}
              <div className="p-4 rounded-2xl bg-farmly-surface-elevated border border-farmly-border space-y-2">
                <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-farmly-muted select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-farmly-surface border-farmly-border text-farmly-accent focus:ring-farmly-accent mt-0.5 shrink-0"
                    {...register("consent")}
                  />
                  <span>
                    Farmer verbal/written consent confirmed for digital profile creation and transparent marketplace discovery under Farmly data privacy policies.
                  </span>
                </label>
                {errors.consent && (
                  <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-400 pl-7">
                    {errors.consent.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                className="gap-2 shadow-lg shadow-farmly-primary/30"
              >
                <span>Register Farmer Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
