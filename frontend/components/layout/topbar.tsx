"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Bell, User, Check, ChevronDown } from "lucide-react";
import { LanguageSelector } from "@/components/common/language-selector";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useMockData } from "@/contexts/mock-data-context";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export function Topbar({ onOpenMobileMenu, title }: TopbarProps) {
  const { user, role, quickDemoLogin } = useAuth();
  const { notifications } = useMockData();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleOptions: { id: UserRole; label: string }[] = [
    { id: "helper", label: "Helper Mode" },
    { id: "farmer", label: "Farmer Mode" },
    { id: "distributor", label: "Distributor Mode" },
    { id: "retailer", label: "Retailer Mode" },
  ];

  return (
    <header className="sticky top-0 z-20 w-full h-16 bg-farmly-bg/90 backdrop-blur-md border-b border-farmly-border px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumb/title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-farmly-muted hover:text-white bg-farmly-surface border border-farmly-border md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Quick Role Switcher, Language, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border hover:border-farmly-accent/40 text-xs font-semibold text-white transition-colors"
            aria-label="Switch demo role"
          >
            <span className="capitalize">{role}</span>
            <ChevronDown className="w-3 h-3 text-farmly-muted-dark" />
          </button>

          {roleSwitcherOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-farmly-surface border border-farmly-border shadow-2xl p-1.5 z-50 animate-fade-in">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-farmly-muted-dark">
                Switch Role View
              </div>
              {roleOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    quickDemoLogin(opt.id);
                    setRoleSwitcherOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left",
                    role === opt.id
                      ? "bg-farmly-primary/30 text-emerald-300 font-semibold"
                      : "text-farmly-muted hover:bg-farmly-surface-elevated hover:text-white"
                  )}
                >
                  <span>{opt.label}</span>
                  {role === opt.id && <Check className="w-3.5 h-3.5 text-farmly-accent" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language Selector */}
        <LanguageSelector variant="compact" />

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Notifications Icon with unread badge */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-xl text-farmly-muted hover:text-white bg-farmly-surface border border-farmly-border transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label={`Notifications: ${unreadCount} unread`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-farmly-accent text-[10px] font-bold font-mono text-white flex items-center justify-center shadow-sm">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Avatar */}
        <Link
          href={role === "helper" ? "/helper/profile" : "/profile"}
          className="p-1.5 rounded-xl bg-farmly-surface-elevated border border-farmly-border hover:border-farmly-accent/40 text-white transition-colors"
          aria-label="View user profile"
        >
          <div className="w-7 h-7 rounded-lg bg-farmly-primary flex items-center justify-center font-bold text-xs text-white">
            <User className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </header>
  );
}
