import React from "react";
import { USER_ROLES } from "@/lib/constants";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface RoleSelectorProps {
  value?: UserRole;
  onChange: (role: UserRole) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  return (
    <div className="space-y-2 text-left">
      <label className="block text-xs sm:text-sm font-semibold text-farmly-muted tracking-wide">
        Select Your Role / Farming Activity
      </label>

      <div
        role="radiogroup"
        aria-label="Select your role in the Farmly ecosystem"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
      >
        {USER_ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = value === role.id;

          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(role.id)}
              className={cn(
                "p-3 rounded-xl border text-left flex items-start gap-3 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent min-h-[48px]",
                isSelected
                  ? "bg-farmly-surface-elevated border-farmly-accent text-white shadow-md shadow-farmly-primary/10"
                  : "bg-farmly-surface border-farmly-border text-farmly-muted hover:border-farmly-accent/40 hover:bg-farmly-surface-elevated hover:text-white"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0 mt-0.5 transition-colors",
                  isSelected
                    ? "bg-farmly-primary text-white"
                    : "bg-farmly-surface-elevated text-farmly-muted border border-farmly-border"
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    {role.label}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-farmly-accent shrink-0 ml-1" />
                  )}
                </div>
                <p className="text-[11px] text-farmly-muted-dark leading-tight mt-0.5 line-clamp-2">
                  {role.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
