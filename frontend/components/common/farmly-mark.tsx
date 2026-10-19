import React from "react";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Farmly brand mark (same as the Logo icon): a sprout on a light-green tile.
 * Size it with className, e.g. "w-11 h-11".
 */
export function FarmlyMark({ className, title = "Farmly" }: { className?: string; title?: string }) {
  return (
    <span
      role="img"
      aria-label={title}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-farmly-accent-light to-farmly-accent border border-white/30 shadow-sm shadow-farmly-accent/30",
        className
      )}
    >
      <Sprout className="text-white w-3/5 h-3/5" aria-hidden="true" />
      <span className="absolute -bottom-0.5 -right-0.5 w-[22%] h-[22%] min-w-2 min-h-2 bg-farmly-primary rounded-full border border-white/80" />
    </span>
  );
}
