"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { User, Phone, Mail, MapPin, Building2, Languages } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { RoleSelector } from "@/components/auth/role-selector";
import { AuthButton } from "@/components/auth/auth-button";
import { FormError } from "@/components/auth/form-error";
import { LanguageSelector } from "@/components/common/language-selector";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { signupSchema, SignupFormData } from "@/lib/validation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";

export default function SignupPage() {
  const { signup } = useAuth();
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "farmer",
      state: "Maharashtra",
      district: "Nashik",
      preferredLanguage: "mr",
      organization: "",
      acceptTerms: undefined,
    },
  });

  const selectedRole = watch("role");
  const passwordValue = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    setFormError(null);
    try {
      const res = await signup({
        id: `usr_${Date.now()}`,
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        role: data.role,
        state: data.state,
        district: data.district,
        preferredLanguage: data.preferredLanguage,
        organization: data.organization,
      }, data.password);

      if (!res.success && res.error) {
        setFormError(res.error);
      }
    } catch {
      setFormError("A client validation error occurred. Please verify your entries.");
    }
  };

  return (
    <AuthLayout
      title={t("auth.signupTitle", "Join the Farmly Ecosystem")}
      subtitle={t(
        "auth.signupSubtitle",
        "Create your unified digital farming profile in seconds. Connect your agricultural assets and discover verified partners."
      )}
      alternateAction={{
        label: "Already have a Farmly account?",
        linkText: t("auth.signIn", "Sign In"),
        href: "/login",
      }}
    >
      {/* Top Header Utilities */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-farmly-border/40">
        <span className="text-xs font-semibold text-farmly-muted-dark uppercase tracking-wider">
          Demo Registration
        </span>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="compact" />
          <ThemeToggle />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormError message={formError || undefined} />

        {/* Role / User Type Picker */}
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <RoleSelector
              value={field.value}
              onChange={field.onChange}
              error={errors.role?.message}
            />
          )}
        />

        {/* Full Name Field */}
        <AuthInput
          id="fullName"
          label="Full Name"
          placeholder="e.g. Priya Sharma or Ramesh Patel"
          icon={User}
          autoComplete="name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        {/* Mobile & Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthInput
            id="mobile"
            label="Mobile Number"
            placeholder="e.g. 9876543210"
            icon={Phone}
            autoComplete="tel"
            error={errors.mobile?.message}
            {...register("mobile")}
          />

          <AuthInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="name@farmly.demo"
            icon={Mail}
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>

        {/* Helper-Specific Field Assistance Details */}
        {selectedRole === "helper" && (
          <div className="p-4 rounded-2xl bg-farmly-surface-elevated/60 border border-farmly-accent/40 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Field Assistance Details
              </span>
              <span className="text-[10px] text-farmly-muted-dark">Required for Helpers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuthInput
                id="state"
                label="State"
                placeholder="e.g. Gujarat, Maharashtra"
                icon={MapPin}
                error={errors.state?.message}
                {...register("state")}
              />

              <AuthInput
                id="district"
                label="District / Operating Area"
                placeholder="e.g. Anand, Pune, Tarn Taran"
                icon={MapPin}
                error={errors.district?.message}
                {...register("district")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="preferredLanguage"
                  className="block text-xs sm:text-sm font-semibold text-farmly-muted"
                >
                  Preferred Vernacular Language
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 pointer-events-none text-farmly-muted-dark">
                    <Languages className="w-4 h-4" />
                  </div>
                  <select
                    id="preferredLanguage"
                    className="w-full rounded-xl bg-farmly-surface-elevated pl-10 pr-4 py-3 text-sm text-farmly-foreground border border-farmly-border hover:border-farmly-accent/40 focus:border-farmly-accent outline-none"
                    {...register("preferredLanguage")}
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-farmly-surface text-farmly-foreground">
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <AuthInput
                id="organization"
                label="Organization / FPO / Collection Center"
                placeholder="e.g. Kheda District FPO Desk"
                icon={Building2}
                error={errors.organization?.message}
                {...register("organization")}
              />
            </div>
          </div>
        )}

        {/* Password Field with Live Strength */}
        <div>
          <PasswordInput
            id="password"
            label="Create Password"
            placeholder="At least 8 characters (1 uppercase, 1 symbol)"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrength password={passwordValue} />
        </div>

        {/* Confirm Password Field */}
        <PasswordInput
          id="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter password to verify"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {/* Terms & Conditions Checkbox */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-farmly-muted select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded bg-farmly-surface-elevated border-farmly-border text-farmly-accent focus:ring-farmly-accent focus:ring-offset-farmly-bg mt-0.5 shrink-0"
              {...register("acceptTerms")}
            />
            <span>
              I agree to the{" "}
              <Link href="#terms" className="font-medium text-farmly-accent hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#privacy" className="font-medium text-farmly-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-400 mt-1 pl-7">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <AuthButton
          label={`Create ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Profile`}
          loadingLabel="Creating digital profile..."
          isLoading={isSubmitting}
        />
      </form>
    </AuthLayout>
  );
}
