import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-farmly-accent/40 bg-farmly-primary/15 text-emerald-800 dark:text-emerald-300",
        secondary:
          "border border-farmly-border bg-farmly-surface-elevated text-farmly-foreground",
        accent:
          "border border-farmly-accent bg-farmly-accent/15 text-emerald-800 dark:text-emerald-200",
        outline:
          "border border-farmly-border text-farmly-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
