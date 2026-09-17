"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Wheat,
  Boxes,
  FileCheck2,
  Activity,
  Bell,
  User,
  Settings,
  Store,
  FileText,
  CreditCard,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRightLeft,
  X,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/common/logo";
import { useAuth } from "@/contexts/auth-context";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  translationKey: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const { notifications, evidence } = useMockData();
  const { t } = useTranslation();

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const pendingEvidenceCount = evidence.filter((e) => e.status === "Pending").length;

  const getNavItems = (currentRole: UserRole): NavItem[] => {
    switch (currentRole) {
      case "helper":
        return [
          { label: "Dashboard", translationKey: "nav.dashboard", href: "/helper/dashboard", icon: LayoutDashboard },
          { label: "Farmers", translationKey: "nav.farmers", href: "/helper/farmers", icon: Users },
          { label: "Add Farmer", translationKey: "nav.addFarmer", href: "/helper/farmers/new", icon: UserPlus },
          { label: "Crop Availability", translationKey: "nav.cropAvailability", href: "/helper/crop-availability", icon: Wheat },
          { label: "Lots", translationKey: "nav.lots", href: "/helper/lots", icon: Boxes },
          {
            label: "Evidence",
            translationKey: "nav.evidence",
            href: "/helper/evidence",
            icon: FileCheck2,
            badge: pendingEvidenceCount > 0 ? pendingEvidenceCount : undefined,
          },
          { label: "Activities", translationKey: "nav.activities", href: "/helper/activity", icon: Activity },
          {
            label: "Notifications",
            translationKey: "nav.notifications",
            href: "/notifications",
            icon: Bell,
            badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          },
          { label: "Profile", translationKey: "nav.profile", href: "/helper/profile", icon: User },
          { label: "Settings", translationKey: "nav.settings", href: "/settings", icon: Settings },
        ];

      case "distributor":
        return [
          { label: "Dashboard", translationKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Marketplace", translationKey: "nav.marketplace", href: "/marketplace", icon: Store },
          { label: "Offers", translationKey: "nav.offers", href: "/offers", icon: FileText },
          { label: "Purchased Lots", translationKey: "nav.lots", href: "/lots", icon: Boxes },
          { label: "Transfers", translationKey: "nav.transactions", href: "/transactions", icon: ArrowRightLeft },
          { label: "Payments", translationKey: "nav.payments", href: "/payments", icon: CreditCard },
          { label: "Disputes", translationKey: "nav.disputes", href: "/disputes", icon: AlertTriangle },
          { label: "Traceability", translationKey: "nav.traceability", href: "/traceability", icon: ShieldCheck },
          { label: "Settings", translationKey: "nav.settings", href: "/settings", icon: Settings },
        ];

      case "retailer":
        return [
          { label: "Dashboard", translationKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Received Lots", translationKey: "nav.lots", href: "/lots", icon: Boxes },
          { label: "Traceability", translationKey: "nav.traceability", href: "/traceability", icon: ShieldCheck },
          { label: "QR Verification", translationKey: "nav.qrVerification", href: "/verify/LT-20391", icon: QrCode },
          { label: "Payments", translationKey: "nav.payments", href: "/payments", icon: CreditCard },
          { label: "Profile", translationKey: "nav.profile", href: "/profile", icon: User },
          { label: "Settings", translationKey: "nav.settings", href: "/settings", icon: Settings },
        ];

      case "farmer":
      default:
        return [
          { label: "Dashboard", translationKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Profile", translationKey: "nav.profile", href: "/profile", icon: User },
          { label: "My Assets", translationKey: "nav.assets", href: "/assets", icon: Boxes },
          { label: "My Lots", translationKey: "nav.lots", href: "/lots", icon: Wheat },
          { label: "Marketplace", translationKey: "nav.marketplace", href: "/marketplace", icon: Store },
          { label: "Offers", translationKey: "nav.offers", href: "/offers", icon: FileText },
          { label: "Payments", translationKey: "nav.payments", href: "/payments", icon: CreditCard },
          { label: "Disputes", translationKey: "nav.disputes", href: "/disputes", icon: AlertTriangle },
          { label: "Traceability", translationKey: "nav.traceability", href: "/traceability", icon: ShieldCheck },
          { label: "Fair Price", translationKey: "nav.fairPrice", href: "/fair-price", icon: Scale },
          { label: "AgroSathi", translationKey: "nav.agrosathi", href: "/agrosathi", icon: Sparkles },
          {
            label: "Notifications",
            translationKey: "nav.notifications",
            href: "/notifications",
            icon: Bell,
            badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          },
          { label: "Settings", translationKey: "nav.settings", href: "/settings", icon: Settings },
        ];
    }
  };

  const navItems = getNavItems(role);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-farmly-surface border-r border-farmly-border p-4 select-none">
      <div className="space-y-6">
        {/* Logo & Mobile Close Button */}
        <div className="flex items-center justify-between px-2 pt-2">
          <Logo size="sm" showTagline={false} />
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-farmly-muted hover:text-white hover:bg-farmly-surface-elevated md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Active Role Badge */}
        <div className="px-2">
          <div className="px-3 py-2 rounded-xl bg-farmly-surface-elevated border border-farmly-border/70 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-farmly-muted-dark uppercase tracking-wider font-mono">
                Workspace
              </span>
              <span className="font-bold text-white capitalize">{role} Mode</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 group outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent min-h-[42px]",
                  isActive
                    ? "bg-farmly-primary text-white shadow-sm font-semibold"
                    : "text-farmly-muted hover:bg-farmly-surface-elevated hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-white" : "text-farmly-muted group-hover:text-emerald-300"
                    )}
                  />
                  <span>{t(item.translationKey, item.label)}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold",
                      isActive ? "bg-white text-farmly-dark-green" : "bg-farmly-primary text-emerald-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div className="pt-4 border-t border-farmly-border/50 space-y-3">
        <div className="px-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-farmly-primary/40 border border-farmly-accent/40 flex items-center justify-center font-bold text-xs text-white shrink-0">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{user?.fullName || "Field User"}</div>
              <div className="text-[10px] text-farmly-muted truncate">{user?.organization || user?.district || role}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-farmly-muted hover:text-red-400 hover:bg-red-950/20 transition-colors"
            title="Log out"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-4/5 max-w-xs h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
