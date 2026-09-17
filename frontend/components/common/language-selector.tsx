"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "@/contexts/language-context";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "header" | "compact" | "settings";
  className?: string;
}

export function LanguageSelector({ variant = "header", className }: LanguageSelectorProps) {
  const { language, setLanguage, languages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select language. Current language: ${currentLang.nativeName}`}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent min-h-[40px] px-3 py-1.5",
          variant === "header" &&
            "bg-farmly-surface-elevated/80 border border-farmly-border text-white hover:border-farmly-accent/40 text-xs sm:text-sm font-medium",
          variant === "compact" &&
            "bg-transparent text-farmly-muted hover:text-white p-1.5 text-xs",
          variant === "settings" &&
            "w-full justify-between bg-farmly-surface-elevated border border-farmly-border text-white px-4 py-2.5 text-sm"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Globe className="w-4 h-4 text-farmly-accent shrink-0" aria-hidden="true" />
          <span className="font-medium truncate">{currentLang.nativeName}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-farmly-muted-dark transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1.5 w-52 max-h-72 overflow-y-auto rounded-2xl bg-farmly-surface border border-farmly-border shadow-2xl p-1.5 animate-fade-in backdrop-blur-md"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-farmly-muted-dark border-b border-farmly-border/40 mb-1">
            Choose Language
          </div>
          {languages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors text-left",
                  isSelected
                    ? "bg-farmly-primary/30 text-emerald-300 font-semibold"
                    : "text-farmly-muted hover:bg-farmly-surface-elevated hover:text-white"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-white font-medium">{lang.nativeName}</span>
                  <span className="text-[10px] text-farmly-muted-dark">{lang.name}</span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-farmly-accent shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
