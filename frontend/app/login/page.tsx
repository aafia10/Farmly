"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, CheckCircle, ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthButton } from "@/components/auth/auth-button";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { loginSchema, LoginFormData } from "@/lib/validation";
import { apiClient } from "@/lib/api/client";

export default function LoginPage() {
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      // UX simulated login via API client abstraction
      const response = await apiClient.login({
        identifier: data.identifier,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (response.success) {
        setSubmissionSuccess(response.message);
        reset();
      } else {
        setFormError(response.message || "Unable to sign in. Please try again.");
      }
    } catch {
      setFormError("A client validation error occurred. Please verify your inputs.");
    }
  };

  const handleGooglePlaceholder = () => {
    alert("Google authentication placeholder: Social login will be connected to backend OAuth provider.");
  };

  return (
    <AuthLayout
      title="Welcome to Farmly"
      subtitle="Sign in with your verified mobile number or email to access your farm records and services."
      alternateAction={{
        label: "Don't have a Farmly account yet?",
        linkText: "Create Account",
        href: "/signup",
      }}
    >
      {submissionSuccess ? (
        <div
          role="status"
          className="rounded-2xl bg-emerald-950/40 border border-emerald-500/50 p-6 text-center space-y-4 animate-fade-in"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Login Successful (Simulated)</h3>
            <p className="text-sm text-farmly-muted mt-1 leading-relaxed">
              {submissionSuccess}
            </p>
            <p className="text-xs text-farmly-muted-dark mt-2 font-mono">
              [Note: Backend authentication API will be wired here in phase 2]
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSubmissionSuccess(null)}
            >
              Sign In Again
            </Button>
            <Link href="/">
              <Button variant="default" size="sm" className="gap-1">
                <span>Return to Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormError message={formError || undefined} />

          {/* Identifier Field: Email or Mobile */}
          <AuthInput
            id="identifier"
            label="Email or Mobile Number"
            placeholder="e.g. 9876543210 or farmer@farmly.ag"
            icon={Mail}
            autoComplete="username"
            error={errors.identifier?.message}
            {...register("identifier")}
          />

          {/* Password Field */}
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Enter your account password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <label className="flex items-center gap-2 cursor-pointer select-none text-farmly-muted hover:text-white">
              <input
                type="checkbox"
                className="w-4 h-4 rounded bg-farmly-surface-elevated border-farmly-border text-farmly-accent focus:ring-farmly-accent focus:ring-offset-farmly-bg"
                {...register("rememberMe")}
              />
              <span>Remember me</span>
            </label>

            <Link
              href="#forgot-password"
              onClick={(e) => {
                e.preventDefault();
                alert("Password reset functionality will be enabled when SMS/Email OTP service is connected.");
              }}
              className="font-medium text-farmly-accent hover:text-emerald-300 underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <AuthButton
            label="Sign In to Farmly"
            loadingLabel="Verifying credentials..."
            isLoading={isSubmitting}
          />

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-farmly-border/70" />
            <span className="absolute bg-farmly-surface px-3 text-xs uppercase tracking-wider text-farmly-muted-dark">
              or continue with
            </span>
          </div>

          {/* Google Login Placeholder Button */}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleGooglePlaceholder}
            className="gap-2.5 text-sm font-medium border-farmly-border/80 hover:bg-farmly-surface-elevated"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.6.4-2.4L1.9 7.4C.7 9.8 0 12 0 14.7s.7 4.9 1.9 7.3l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16.4C3.7 20.2 7.5 23.5 12 23.5z"
              />
            </svg>
            <span>Continue with Google</span>
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
