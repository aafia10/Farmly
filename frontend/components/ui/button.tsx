import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-[13px] font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:   "bg-farmly-primary text-white hover:bg-farmly-primary-hover shadow-sm shadow-farmly-primary/20",
        secondary: "bg-farmly-surface-elevated text-farmly-foreground hover:bg-farmly-border border border-farmly-border",
        outline:   "border border-farmly-border bg-transparent text-farmly-foreground hover:bg-farmly-surface-elevated hover:border-farmly-primary/30",
        ghost:     "text-farmly-foreground hover:bg-farmly-surface-elevated",
        link:      "text-farmly-primary underline-offset-4 hover:underline p-0 h-auto font-medium shadow-none",
        danger:    "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      },
      size: {
        sm: "h-8  px-3 text-[12px]",
        md: "h-10 px-4 text-[13px]",
        lg: "h-12 px-6 text-[14px]",
        icon: "h-9 w-9 p-0",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "default", size: "md", fullWidth: false },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      ref={ref}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
