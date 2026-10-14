import React from "react";
import { Check, X } from "lucide-react";
import { evaluatePasswordStrength } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
  className?: string;
}

export function PasswordStrength({ password = "", className }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, label, colorClass, checks } = evaluatePasswordStrength(password);

  return (
    <div className={cn("space-y-2 mt-2", className)} aria-live="polite">
      {/* 4 Segmented Progress Bars */}
      <div className="flex items-center gap-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              score >= step ? colorClass : "bg-farmly-surface-elevated border border-farmly-border"
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-farmly-muted-dark">Password strength:</span>
        <span
          className={cn(
            "font-semibold",
            score <= 1
              ? "text-red-700 dark:text-red-400"
              : score === 2
              ? "text-amber-700 dark:text-amber-400"
              : score === 3
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-farmly-accent"
          )}
        >
          {label}
        </span>
      </div>

      {/* Criteria Breakdown */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-farmly-muted-dark">
        <div className="flex items-center gap-1">
          {checks.length ? (
            <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-farmly-muted-dark shrink-0" />
          )}
          <span className={checks.length ? "text-farmly-foreground" : ""}>At least 8 chars</span>
        </div>
        <div className="flex items-center gap-1">
          {checks.hasUpper ? (
            <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-farmly-muted-dark shrink-0" />
          )}
          <span className={checks.hasUpper ? "text-farmly-foreground" : ""}>1 uppercase</span>
        </div>
        <div className="flex items-center gap-1">
          {checks.hasNumberOrSymbol ? (
            <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-farmly-muted-dark shrink-0" />
          )}
          <span className={checks.hasNumberOrSymbol ? "text-farmly-foreground" : ""}>1 number / symbol</span>
        </div>
        <div className="flex items-center gap-1">
          {checks.hasLower ? (
            <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
          ) : (
            <X className="w-3 h-3 text-farmly-muted-dark shrink-0" />
          )}
          <span className={checks.hasLower ? "text-farmly-foreground" : ""}>Lowercase letters</span>
        </div>
      </div>
    </div>
  );
}
