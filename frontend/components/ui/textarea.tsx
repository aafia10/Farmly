import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-farmly-border bg-farmly-surface px-3 py-2 text-sm text-white placeholder:text-farmly-muted focus:outline-none focus:ring-2 focus:ring-farmly-accent focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
