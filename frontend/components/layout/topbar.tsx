"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Bell, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

const roleOptions: { id: UserRole; label: string }[] = [
  { id: "farmer",           label: "Farmer" },
  { id: "helper",           label: "Field Helper" },
  { id: "fpo",              label: "FPO Cooperative" },
  { id: "collection_center",label: "Collection Centre" },
  { id: "quality_assessor", label: "Quality Assessor" },
  { id: "distributor",      label: "Distributor" },
  { id: "retailer",         label: "Retailer" },
  { id: "admin",            label: "Admin" },
];

export function Topbar({ onOpenMobileMenu, title }: TopbarProps) {
  const { user, role, quickDemoLogin } = useAuth();
  const { notifications } = useMockData();
  const { t } = useTranslation();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-20 w-full h-14 bg-white/80 backdrop-blur-md border-b border-farmly-border px-4 sm:px-6 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-farmly-muted hover:text-farmly-foreground hover:bg-farmly-surface-elevated md:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        {title && (
          <h1 className="text-sm font-semibold text-farmly-foreground tracking-tight">
            {t(`nav.${title.toLowerCase().replace(/[\s&/]+/g, "")}`, title)}
          </h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Role switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-farmly-surface-elevated border border-farmly-border hover:border-farmly-primary/30 text-[12px] font-medium text-farmly-foreground transition-all"
          >
            <span className="capitalize">{role.replace("_", " ")}</span>
            <ChevronDown className="w-3 h-3 text-farmly-muted" />
          </button>

          {roleSwitcherOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRoleSwitcherOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white border border-farmly-border shadow-xl p-1.5 z-50 animate-fade-in">
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-farmly-muted">
                  Switch Role
                </p>
                {roleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { quickDemoLogin(opt.id); setRoleSwitcherOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] font-medium transition-colors text-left",
                      role === opt.id
                        ? "bg-farmly-primary/8 text-farmly-primary font-semibold"
                        : "text-farmly-muted hover:bg-farmly-surface-elevated hover:text-farmly-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    {role === opt.id && <Check className="w-3 h-3 text-farmly-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-farmly-muted hover:text-farmly-foreground hover:bg-farmly-surface-elevated transition-colors"
          aria-label={`${unreadCount} notifications`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-farmly-primary text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <Link
          href={role === "helper" ? "/helper/profile" : "/profile"}
          className="w-7 h-7 rounded-full bg-farmly-primary flex items-center justify-center font-semibold text-xs text-white hover:opacity-90 transition-opacity"
          aria-label="Profile"
        >
          {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
        </Link>
      </div>
    </header>
  );
}
