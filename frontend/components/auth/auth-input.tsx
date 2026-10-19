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
          className="block text-xs sm:text-[13px] font-semibold text-farmly-foreground/80"
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
              "w-full rounded-xl bg-farmly-input-bg px-4 py-3 text-sm text-farmly-foreground placeholder:text-farmly-muted-dark/70 border shadow-[0_1px_2px_rgba(16,51,36,0.04)] transition-all duration-200 outline-none",
              Icon ? "pl-10" : "pl-4",
              rightElement ? "pr-11" : "pr-4",
              error
                ? "border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
                : "border-farmly-input-border hover:border-farmly-accent/50 focus:border-farmly-accent focus:ring-4 focus:ring-farmly-accent/15"
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
            className="text-xs font-medium text-red-700 dark:text-red-400 mt-1 flex items-center gap-1"
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
