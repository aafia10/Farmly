import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent focus-visible:ring-offset-2 focus-visible:ring-offset-farmly-bg disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-farmly-primary text-white hover:bg-farmly-primary-hover shadow-sm border border-farmly-accent/30",
        secondary:
          "bg-farmly-surface-elevated text-farmly-foreground hover:bg-farmly-surface border border-farmly-border hover:border-farmly-accent/50",
        accent:
          "bg-farmly-accent text-white hover:bg-farmly-accent-light shadow-md shadow-farmly-accent/20",
        outline:
          "border border-farmly-border bg-transparent text-farmly-foreground hover:bg-farmly-surface-elevated hover:border-farmly-accent/40",
        ghost:
          "text-farmly-foreground hover:bg-farmly-surface-elevated",
        link:
          "text-farmly-accent underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        sm: "h-9 px-3.5 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base min-h-[48px]",
        icon: "h-10 w-10 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
