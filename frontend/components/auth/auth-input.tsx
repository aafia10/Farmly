import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  rightElement?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, label, id, error, helperText, icon: Icon, rightElement, type, ...props }, ref) => {
    const inputId = id || props.name || "input-field";
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="space-y-1.5 text-left w-full">
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-semibold text-farmly-muted tracking-wide"
        >
          {label}
        </label>

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3.5 pointer-events-none text-farmly-muted-dark">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "w-full rounded-xl bg-farmly-surface-elevated px-4 py-3 text-sm text-white placeholder:text-farmly-muted-dark/70 border transition-all duration-200 outline-none",
              Icon ? "pl-10" : "pl-4",
              rightElement ? "pr-11" : "pr-4",
              error
                ? "border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-farmly-border hover:border-farmly-accent/40 focus:border-farmly-accent focus:ring-2 focus:ring-farmly-accent/20"
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-red-400 mt-1 flex items-center gap-1"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-xs text-farmly-muted-dark mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";
