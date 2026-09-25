"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowRight, ShieldCheck, HeartHandshake, Sprout, Truck, Building2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthInput } from "@/components/auth/auth-input";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthButton } from "@/components/auth/auth-button";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/common/language-selector";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { loginSchema, LoginFormData } from "@/lib/validation";
import { useAuth, DEMO_CREDENTIALS } from "@/contexts/auth-context";
import { useTranslation } from "@/contexts/language-context";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { login, quickDemoLogin } = useAuth();
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const demo = DEMO_CREDENTIALS[role];
    if (demo) {
      setValue("identifier", demo.email, { shouldValidate: true });
      setValue("password", demo.pass, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      // Only pass roleHint if the user specifically clicked a demo tab
      const res = await login(data.identifier, data.password, selectedRole || undefined);
      if (!res.success && res.error) {
        setFormError(res.error);
      }
    } catch {
      setFormError("An unexpected error occurred during login.");
    }
  };

  const handleGooglePlaceholder = () => {
    alert("Google authentication placeholder: Social login will be connected to backend OAuth provider.");
  };

  const rolesList: { id: UserRole; label: string; icon: React.ElementType }[] = [
    { id: "helper", label: "Helper", icon: HeartHandshake },
    { id: "farmer", label: "Farmer", icon: Sprout },
    { id: "distributor", label: "Distributor", icon: Truck },
    { id: "retailer", label: "Retailer", icon: Building2 },
  ];

  return (
    <AuthLayout
      title={t("auth.loginTitle", "Sign In to Farmly")}
      subtitle={t("auth.loginSubtitle", "Access your farm records, market connections, and field tools.")}
      alternateAction={{
        label: "Don't have a Farmly account yet?",
        linkText: t("auth.createAccount", "Create Account"),
        href: "/signup",
      }}
    >
      {/* Top Header Utilities */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-farmly-border/40">
        <span className="text-xs font-semibold text-farmly-muted-dark uppercase tracking-wider">
          Demo Mode Active
        </span>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="compact" />
          <ThemeToggle />
        </div>
      </div>

      {/* Role Tabs for Quick Demo Autofill */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-farmly-muted mb-2">
          {t("auth.demoRoleLabel", "Quick Demo Logins (1-Click Autofill)")}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {rolesList.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[40px]",
                  isSelected
                    ? "bg-farmly-primary text-white border-farmly-accent shadow-sm"
                    : "bg-farmly-surface-elevated text-farmly-muted border-farmly-border hover:border-farmly-accent/40 hover:text-farmly-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={formError || undefined} />

        {/* Identifier Field: Email or Mobile */}
        <AuthInput
          id="identifier"
          label={t("auth.emailOrPhone", "Email or Mobile Number")}
          placeholder="e.g. helper@farmly.demo or 9876500001"
          icon={Mail}
          autoComplete="username"
          error={errors.identifier?.message}
          {...register("identifier")}
        />

        {/* Password Field */}
        <PasswordInput
          id="password"
          label={t("auth.password", "Password")}
          placeholder="Enter your account password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none text-farmly-muted hover:text-farmly-foreground">
            <input
              type="checkbox"
              className="w-4 h-4 rounded bg-farmly-surface-elevated border-farmly-border text-farmly-accent focus:ring-farmly-accent focus:ring-offset-farmly-bg"
              {...register("rememberMe")}
            />
            <span>{t("auth.rememberMe", "Remember me")}</span>
          </label>

          <Link
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert("Password reset demo: For testing, use password 'Farmly@123'.");
            }}
            className="font-medium text-farmly-accent hover:text-emerald-300 underline-offset-4 hover:underline"
          >
            {t("auth.forgotPassword", "Forgot password?")}
          </Link>
        </div>

        {/* Submit Button */}
        <AuthButton
          label={selectedRole ? `Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : "Sign In"}
          loadingLabel="Verifying session..."
          isLoading={isSubmitting}
        />

        {/* Instant One-Click Demo Login Box */}
        <div className="p-3.5 rounded-2xl bg-farmly-surface-elevated/70 border border-farmly-accent/30 space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-farmly-accent" />
              1-Click Demo Login:
            </span>
            <span className="text-[10px] text-farmly-muted-dark font-mono">Pass: Farmly@123</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickDemoLogin("helper")}
              className="text-xs justify-start px-2.5 h-8 hover:border-farmly-accent text-emerald-300"
            >
              <ArrowRight className="w-3 h-3 mr-1 shrink-0" />
              <span>Helper Dashboard</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickDemoLogin("farmer")}
              className="text-xs justify-start px-2.5 h-8 hover:border-farmly-accent"
            >
              <ArrowRight className="w-3 h-3 mr-1 shrink-0" />
              <span>Farmer View</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickDemoLogin("distributor")}
              className="text-xs justify-start px-2.5 h-8 hover:border-farmly-accent"
            >
              <ArrowRight className="w-3 h-3 mr-1 shrink-0" />
              <span>Distributor View</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => quickDemoLogin("retailer")}
              className="text-xs justify-start px-2.5 h-8 hover:border-farmly-accent"
            >
              <ArrowRight className="w-3 h-3 mr-1 shrink-0" />
              <span>Retailer View</span>
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-farmly-border/70" />
          <span className="absolute bg-farmly-surface px-3 text-[11px] uppercase tracking-wider text-farmly-muted-dark">
            or continue with
          </span>
        </div>

        {/* Google Login Placeholder Button */}
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={handleGooglePlaceholder}
          className="gap-2.5 text-xs sm:text-sm font-medium border-farmly-border/80 hover:bg-farmly-surface-elevated"
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
    </AuthLayout>
  );
}
