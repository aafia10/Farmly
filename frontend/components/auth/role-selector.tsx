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
        Select your role
      </label>

      <div
        role="radiogroup"
        aria-label="Select your role in the Farmly ecosystem"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
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
                "h-full p-4 rounded-xl border text-left flex items-start gap-3 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent",
                isSelected
                  ? "bg-farmly-primary/5 border-farmly-primary dark:bg-farmly-surface-elevated dark:border-farmly-accent"
                  : "bg-farmly-surface border-farmly-border hover:border-farmly-accent/50 hover:bg-farmly-surface-elevated"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg shrink-0 flex items-center justify-center transition-colors",
                  isSelected
                    ? "bg-farmly-primary text-white"
                    : "bg-farmly-surface-elevated text-farmly-primary dark:text-farmly-accent-light border border-farmly-border"
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-farmly-foreground">{role.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light shrink-0" aria-hidden="true" />
                  )}
                </div>
                <p className="text-xs text-farmly-muted leading-snug mt-1">{role.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
