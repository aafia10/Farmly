"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Phone, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { RoleSelector } from "@/components/auth/role-selector";
import { AuthButton } from "@/components/auth/auth-button";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { signupSchema, SignupFormData } from "@/lib/validation";
import { apiClient } from "@/lib/api/client";

export default function SignupPage() {
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "farmer",
      acceptTerms: undefined,
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    setFormError(null);
    try {
      // UX simulated account creation via API client abstraction
      const response = await apiClient.signup({
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
        role: data.role,
        acceptTerms: data.acceptTerms,
      });

      if (response.success) {
        setSubmissionSuccess(response.message);
        reset();
      } else {
        setFormError(response.message || "Unable to create account. Please check your details.");
      }
    } catch {
      setFormError("A client validation error occurred. Please verify your entries.");
    }
  };

  return (
    <AuthLayout
      title="Join the Farmly Ecosystem"
      subtitle="Create your unified digital farming profile in seconds. Connect your agricultural assets and discover verified partners."
      alternateAction={{
        label: "Already have a Farmly account?",
        linkText: "Sign In",
        href: "/login",
      }}
    >
      {submissionSuccess ? (
        <div
          role="status"
          className="rounded-2xl bg-emerald-950/40 border border-emerald-500/50 p-6 sm:p-8 text-center space-y-4 animate-fade-in"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Profile Created (Simulated)</h3>
            <p className="text-sm text-farmly-muted mt-2 leading-relaxed">
              {submissionSuccess}
            </p>
            <p className="text-xs text-farmly-muted-dark mt-3 font-mono">
              [Note: Live onboarding and OTP verification will connect when backend API is activated]
            </p>
          </div>
          <div className="pt-3 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setSubmissionSuccess(null)}
            >
              Register Another Profile
            </Button>
            <Link href="/login">
              <Button variant="default" size="md" className="gap-1.5">
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
            placeholder="e.g. Ramesh Patel or Rajesh Sharma"
            icon={User}
            autoComplete="name"
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          {/* Mobile & Email 2-Column Row on screens >= sm */}
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
              placeholder="farmer@farmly.ag"
              icon={Mail}
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
          </div>

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
                <Link
                  href="#terms"
                  className="font-medium text-farmly-accent hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#privacy"
                  className="font-medium text-farmly-accent hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.acceptTerms && (
              <p role="alert" className="text-xs font-medium text-red-400 mt-1 pl-7">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <AuthButton
            label="Create Farmly Profile"
            loadingLabel="Creating digital profile..."
            isLoading={isSubmitting}
          />
        </form>
      )}
    </AuthLayout>
  );
}
