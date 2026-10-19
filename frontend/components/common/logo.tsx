import React from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  size = "md",
  showTagline = false,
  className,
  href = "/",
}: LogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const logoContent = (
    <div className={cn("inline-flex items-center gap-2.5 group select-none", className)}>
      {/* Brand Icon Mark: Hexagonal shield wrapping an agricultural sprout */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-farmly-accent-light to-farmly-accent border border-white/30 shadow-sm shadow-farmly-accent/30 transition-transform duration-300 group-hover:scale-105",
          iconSizes[size]
        )}
      >
        <Sprout className="text-white w-3/5 h-3/5 transition-transform duration-300 group-hover:rotate-6" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-farmly-primary rounded-full border border-farmly-bg" />
      </div>

      <div className="flex flex-col">
        <span
          className={cn(
            "font-bold tracking-tight text-farmly-foreground transition-colors duration-200 group-hover:text-farmly-accent",
            textSizes[size]
          )}
        >
          Farmly
        </span>
        {showTagline && (
          <span className="text-[11px] font-medium text-farmly-muted tracking-wide -mt-0.5">
            The Digital Infrastructure for Modern Farming
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded-lg"
        aria-label="Farmly Home"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
