import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const getStyles = (st: string) => {
    const s = st.toLowerCase();
    if (s.includes("active") || s.includes("completed") || s.includes("verified") || s.includes("accepted") || s.includes("delivered") || s.includes("received")) {
      return "bg-emerald-100/80 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40";
    }
    if (s.includes("pending") || s.includes("due") || s.includes("draft") || s.includes("transit") || s.includes("initiated")) {
      return "bg-amber-100/80 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/40";
    }
    if (s.includes("review") || s.includes("submitted") || s.includes("assisted") || s.includes("offer")) {
      return "bg-sky-100/80 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-500/40";
    }
    if (s.includes("rejected") || s.includes("overdue") || s.includes("dispute") || s.includes("failed")) {
      return "bg-red-100/80 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-500/40";
    }
    return "bg-farmly-surface-elevated text-farmly-foreground border-farmly-border";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border tracking-wide select-none",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        getStyles(status),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{status}</span>
    </span>
  );
}
