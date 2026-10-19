import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-farmly-input-border bg-farmly-input-bg px-3 py-2 text-sm text-farmly-foreground placeholder:text-farmly-muted-dark shadow-[0_1px_2px_rgba(16,51,36,0.04)] hover:border-farmly-accent/50 focus:outline-none focus:border-farmly-accent focus:ring-4 focus:ring-farmly-accent/15 disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow,background-color]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
