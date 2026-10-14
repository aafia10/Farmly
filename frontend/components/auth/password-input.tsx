"use client";

import * as React from "react";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthInput, AuthInputProps } from "./auth-input";

export interface PasswordInputProps extends Omit<AuthInputProps, "type" | "rightElement"> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <AuthInput
        {...props}
        ref={ref}
        type={showPassword ? "text" : "password"}
        icon={Lock}
        rightElement={
          <button
            type="button"
            onClick={toggleVisibility}
            className="p-1 rounded-lg text-farmly-muted-dark hover:text-farmly-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        }
      />
    );
  }
);
PasswordInput.displayName = "PasswordInput";
