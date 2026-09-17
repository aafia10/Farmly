"use client";

import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme, Theme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "segmented";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, setTheme, actualTheme } = useTheme();

  if (variant === "segmented") {
    const options: { value: Theme; label: string; icon: React.ElementType }[] = [
      { value: "light", label: "Light", icon: Sun },
      { value: "dark", label: "Dark", icon: Moon },
      { value: "system", label: "System", icon: Laptop },
    ];

    return (
      <div
        role="radiogroup"
        aria-label="Select theme appearance"
        className={cn(
          "flex items-center gap-1 p-1 rounded-xl bg-farmly-surface border border-farmly-border",
          className
        )}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent min-h-[36px]",
                isSelected
                  ? "bg-farmly-primary text-white shadow-sm"
                  : "text-farmly-muted hover:text-white hover:bg-farmly-surface-elevated"
              )}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
      className={cn(
        "p-2 rounded-xl text-farmly-muted hover:text-white bg-farmly-surface border border-farmly-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent min-h-[40px] min-w-[40px] flex items-center justify-center",
        className
      )}
      aria-label={`Toggle theme. Current: ${theme}`}
    >
      {actualTheme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-300" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      )}
    </button>
  );
}
