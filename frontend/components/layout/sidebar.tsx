"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserPlus, Wheat, Boxes, FileCheck2,
  Activity, Bell, User, Settings, Store, FileText, CreditCard,
  AlertTriangle, QrCode, ShieldCheck, Scale, Sparkles, ArrowRightLeft,
  X, LogOut, LucideIcon, Building, Award, ShieldAlert, ClipboardList,
  Truck, PlusCircle, FileBadge, Lock,
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

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const { notifications, evidence } = useMockData();
  const { t } = useTranslation();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingCount = evidence.filter((e) => e.status === "Pending").length;

  const getNavItems = (r: UserRole): NavItem[] => {
    switch (r) {
      case "helper": return [
        { label: "Dashboard",        translationKey: "nav.dashboard",        href: "/helper/dashboard",         icon: LayoutDashboard },
        { label: "Farmers",          translationKey: "nav.farmers",          href: "/helper/farmers",           icon: Users },
        { label: "Add Farmer",       translationKey: "nav.addFarmer",        href: "/helper/farmers/new",       icon: UserPlus },
        { label: "Crop Availability",translationKey: "nav.cropAvailability", href: "/helper/crop-availability", icon: Wheat },
        { label: "Lots",             translationKey: "nav.lots",             href: "/helper/lots",              icon: Boxes },
        { label: "Evidence",         translationKey: "nav.evidence",         href: "/helper/evidence",          icon: FileCheck2, badge: pendingCount > 0 ? pendingCount : undefined },
        { label: "Activities",       translationKey: "nav.activities",       href: "/helper/activity",          icon: Activity },
        { label: "Notifications",    translationKey: "nav.notifications",    href: "/notifications",            icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
        { label: "Profile",          translationKey: "nav.profile",          href: "/helper/profile",           icon: User },
        { label: "Settings",         translationKey: "nav.settings",         href: "/settings",                 icon: Settings },
      ];
      case "distributor": return [
        { label: "Dashboard",        translationKey: "nav.dashboard",        href: "/dashboard",    icon: LayoutDashboard },
        { label: "Marketplace",      translationKey: "nav.marketplace",      href: "/marketplace",  icon: Store },
        { label: "Offers",           translationKey: "nav.offers",           href: "/offers",       icon: FileText },
        { label: "Purchased Lots",   translationKey: "nav.lots",             href: "/lots",         icon: Boxes },
        { label: "Transfers",        translationKey: "nav.transactions",     href: "/transactions", icon: ArrowRightLeft },
        { label: "Payments",         translationKey: "nav.payments",         href: "/payments",     icon: CreditCard },
        { label: "Disputes",         translationKey: "nav.disputes",         href: "/disputes",     icon: AlertTriangle },
        { label: "Traceability",     translationKey: "nav.traceability",     href: "/traceability", icon: ShieldCheck },
        { label: "Settings",         translationKey: "nav.settings",         href: "/settings",     icon: Settings },
      ];
      case "retailer": return [
        { label: "Dashboard",        translationKey: "nav.dashboard",        href: "/dashboard",    icon: LayoutDashboard },
        { label: "Received Lots",    translationKey: "nav.lots",             href: "/lots",         icon: Boxes },
        { label: "Traceability",     translationKey: "nav.traceability",     href: "/traceability", icon: ShieldCheck },
        { label: "QR Verify",        translationKey: "nav.qrVerification",   href: "/verify/KS-MH-NSK-WHT-20260910-00125", icon: QrCode },
        { label: "Payments",         translationKey: "nav.payments",         href: "/payments",     icon: CreditCard },
        { label: "Profile",          translationKey: "nav.profile",          href: "/profile",      icon: User },
        { label: "Settings",         translationKey: "nav.settings",         href: "/settings",     icon: Settings },
      ];
      case "fpo": return [
        { label: "FPO Dashboard",    translationKey: "nav.fpoDashboard",     href: "/fpo/dashboard", icon: Building },
        { label: "Members",          translationKey: "nav.fpoMembers",       href: "/fpo/members",   icon: Users },
        { label: "Member Lots",      translationKey: "nav.fpoLots",          href: "/fpo/lots",      icon: Boxes },
        { label: "Quality Checks",   translationKey: "nav.fpoQuality",       href: "/fpo/quality",   icon: Award },
        { label: "Disputes",         translationKey: "nav.disputes",         href: "/fpo/disputes",  icon: AlertTriangle },
        { label: "Traceability",     translationKey: "nav.traceability",     href: "/traceability",  icon: ShieldCheck },
        { label: "Settings",         translationKey: "nav.settings",         href: "/settings",      icon: Settings },
      ];
      case "collection_center": return [
        { label: "Dashboard",        translationKey: "nav.collectionDashboard", href: "/collection/dashboard", icon: Truck },
        { label: "Produce Arrivals", translationKey: "nav.arrivals",            href: "/collection/arrivals",  icon: ClipboardList },
        { label: "Weighment",        translationKey: "nav.weighment",           href: "/collection/weighment", icon: Scale },
        { label: "Verified Lots",    translationKey: "nav.collectionLots",      href: "/collection/lots",      icon: Boxes },
        { label: "Handover",         translationKey: "nav.handover",            href: "/collection/handover",  icon: ArrowRightLeft },
        { label: "Settings",         translationKey: "nav.settings",            href: "/settings",             icon: Settings },
      ];
      case "quality_assessor": return [
        { label: "Dashboard",        translationKey: "nav.qualityDashboard", href: "/quality/dashboard",    icon: Award },
        { label: "Assessments",      translationKey: "nav.assessments",      href: "/quality/assessments",  icon: FileCheck2 },
        { label: "Reports",          translationKey: "nav.reports",          href: "/quality/reports",      icon: FileBadge },
        { label: "Settings",         translationKey: "nav.settings",         href: "/settings",             icon: Settings },
      ];
      case "admin": return [
        { label: "Admin",            translationKey: "nav.adminDashboard",   href: "/admin/dashboard", icon: ShieldAlert },
        { label: "Users",            translationKey: "nav.users",            href: "/admin/users",     icon: Users },
        { label: "Fraud Alerts",     translationKey: "nav.fraudAlerts",      href: "/admin/fraud",     icon: AlertTriangle },
        { label: "Audit Ledger",     translationKey: "nav.auditLedger",      href: "/admin/audit",     icon: Activity },
        { label: "Disputes",         translationKey: "nav.disputes",         href: "/disputes",        icon: Scale },
        { label: "Settings",         translationKey: "nav.settings",         href: "/settings",        icon: Settings },
      ];
      default: return [
        { label: "Dashboard",        translationKey: "nav.dashboard",        href: "/dashboard",         icon: LayoutDashboard },
        { label: "Profile",          translationKey: "nav.profile",          href: "/profile",           icon: User },
        { label: "My Lots",          translationKey: "nav.lots",             href: "/lots",              icon: Wheat },
        { label: "New Lot",          translationKey: "nav.newLot",           href: "/lots/new",          icon: PlusCircle },
        { label: "Crop Availability",translationKey: "nav.cropAvailability", href: "/crop-availability", icon: Wheat },
        { label: "Marketplace",      translationKey: "nav.marketplace",      href: "/marketplace",       icon: Store },
        { label: "Offers",           translationKey: "nav.offers",           href: "/offers",            icon: FileText },
        { label: "Payments",         translationKey: "nav.payments",         href: "/payments",          icon: CreditCard },
        { label: "Disputes",         translationKey: "nav.disputes",         href: "/disputes",          icon: AlertTriangle },
        { label: "Traceability",     translationKey: "nav.traceability",     href: "/traceability",      icon: ShieldCheck },
        { label: "Fair Price",       translationKey: "nav.fairPrice",        href: "/fair-price",        icon: Scale },
        { label: "Privacy",          translationKey: "nav.privacy",          href: "/settings/privacy",  icon: Lock },
        { label: "AgroSathi",        translationKey: "nav.agrosathi",        href: "/agrosathi",         icon: Sparkles },
        { label: "Notifications",    translationKey: "nav.notifications",    href: "/notifications",     icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
        { label: "Settings",         translationKey: "nav.settings",         href: "/settings",          icon: Settings },
      ];
    }
  };

  const navItems = getNavItems(role);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white border-r border-farmly-border select-none">
      {/* Top */}
      <div className="flex flex-col gap-0">
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-farmly-border">
          <Logo size="sm" showTagline={false} />
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-farmly-muted hover:text-farmly-foreground hover:bg-farmly-surface-elevated md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role pill */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-farmly-surface-elevated">
            <span className="w-1.5 h-1.5 rounded-full bg-farmly-primary animate-pulse-dot shrink-0" />
            <span className="text-[11px] font-500 text-farmly-muted capitalize tracking-wide">
              {role.replace("_", " ")} workspace
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 pb-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-240px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-farmly-primary text-white"
                    : "text-farmly-muted hover:bg-farmly-surface-elevated hover:text-farmly-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-[15px] h-[15px] shrink-0", isActive ? "text-white" : "text-farmly-muted-dark group-hover:text-farmly-primary")} />
                  <span>{t(item.translationKey, item.label)}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                    isActive ? "bg-white/20 text-white" : "bg-farmly-primary text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-farmly-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-farmly-primary flex items-center justify-center font-semibold text-xs text-white shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-farmly-foreground truncate leading-tight">
                {user?.fullName || "Ramesh Patil"}
              </div>
              <div className="text-[10px] text-farmly-muted truncate leading-tight capitalize">
                {user?.organization || user?.district || role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-farmly-muted hover:text-farmly-primary hover:bg-red-50 transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:block w-60 h-screen sticky top-0 z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-slide-in">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
