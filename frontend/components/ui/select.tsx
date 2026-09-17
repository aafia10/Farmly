import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border border-farmly-input-border bg-farmly-input-bg px-3 py-2 pr-8 text-sm text-farmly-foreground focus:outline-none focus:ring-2 focus:ring-farmly-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-farmly-muted" />
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
