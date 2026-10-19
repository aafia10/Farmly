"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wheat,
  Boxes,
  FileCheck2,
  Activity,
  Bell,
  User,
  Store,
  FileText,
  CreditCard,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Scale,
  ArrowRightLeft,
  X,
  LogOut,
  LucideIcon,
  Building,
  Scale as ScaleIcon,
  Award,
  ShieldAlert,
  ClipboardList,
  Truck,
  FileBadge,
  PhoneCall,
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
          { label: "Crop Availability", translationKey: "nav.cropAvailability", href: "/helper/crop-availability", icon: Wheat },
          { label: "Lots", translationKey: "nav.lots", href: "/helper/lots", icon: Boxes },
          { label: "Phone Registrations", translationKey: "nav.phoneCalls", href: "/helper/calls", icon: PhoneCall },
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
        ];

      case "retailer":
        return [
          { label: "Dashboard", translationKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "Received Lots", translationKey: "nav.lots", href: "/lots", icon: Boxes },
          { label: "Traceability", translationKey: "nav.traceability", href: "/traceability", icon: ShieldCheck },
          { label: "QR Verification", translationKey: "nav.qrVerification", href: "/verify/KS-MH-NSK-WHT-20260910-00125", icon: QrCode },
          { label: "Payments", translationKey: "nav.payments", href: "/payments", icon: CreditCard },
          { label: "Profile", translationKey: "nav.profile", href: "/profile", icon: User },
        ];

      case "fpo":
        return [
          { label: "FPO Dashboard", translationKey: "nav.fpoDashboard", href: "/fpo/dashboard", icon: Building },
          { label: "Farmer Members", translationKey: "nav.fpoMembers", href: "/fpo/members", icon: Users },
          { label: "Member Lots", translationKey: "nav.fpoLots", href: "/fpo/lots", icon: Boxes },
          { label: "Quality Checks", translationKey: "nav.fpoQuality", href: "/fpo/quality", icon: Award },
          { label: "Disputes", translationKey: "nav.disputes", href: "/fpo/disputes", icon: AlertTriangle },
          { label: "Traceability", translationKey: "nav.traceability", href: "/traceability", icon: ShieldCheck },
        ];

      case "collection_center":
        return [
          { label: "Center Dashboard", translationKey: "nav.collectionDashboard", href: "/collection/dashboard", icon: Truck },
          { label: "Produce Arrivals", translationKey: "nav.arrivals", href: "/collection/arrivals", icon: ClipboardList },
          { label: "Weighment Scales", translationKey: "nav.weighment", href: "/collection/weighment", icon: ScaleIcon },
          { label: "Verified Lots", translationKey: "nav.collectionLots", href: "/collection/lots", icon: Boxes },
          { label: "Custody Handover", translationKey: "nav.handover", href: "/collection/handover", icon: ArrowRightLeft },
        ];

      case "quality_assessor":
        return [
          { label: "Assessor Dashboard", translationKey: "nav.qualityDashboard", href: "/quality/dashboard", icon: Award },
          { label: "Assessments", translationKey: "nav.assessments", href: "/quality/assessments", icon: FileCheck2 },
          { label: "Inspection Reports", translationKey: "nav.reports", href: "/quality/reports", icon: FileBadge },
        ];

      case "admin":
        return [
          { label: "Admin Dashboard", translationKey: "nav.adminDashboard", href: "/admin/dashboard", icon: ShieldAlert },
          { label: "User Management", translationKey: "nav.users", href: "/admin/users", icon: Users },
          { label: "Fraud & Anomaly Alerts", translationKey: "nav.fraudAlerts", href: "/admin/fraud", icon: AlertTriangle },
          { label: "Audit Ledger", translationKey: "nav.auditLedger", href: "/admin/audit", icon: Activity },
          { label: "Dispute Review", translationKey: "nav.disputes", href: "/disputes", icon: Scale },
        ];

      case "farmer":
      default:
        return [
          { label: "Dashboard", translationKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
          { label: "My Produce Lots", translationKey: "nav.lots", href: "/lots", icon: Wheat },
          { label: "Marketplace", translationKey: "nav.marketplace", href: "/marketplace", icon: Store },
        ];
    }
  };

  const navItems = getNavItems(role);

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-farmly-surface/95 backdrop-blur-sm border-r border-farmly-border p-4 select-none shadow-[1px_0_0_rgba(16,51,36,0.02),8px_0_24px_-20px_rgba(16,51,36,0.25)] dark:shadow-none">
      <div className="space-y-6">
        {/* Logo & Mobile Close Button */}
        <div className="flex items-center justify-between px-2 pt-2">
          <Logo size="sm" showTagline={false} />
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-farmly-muted hover:text-farmly-foreground hover:bg-farmly-surface-elevated md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Active Role Badge */}
        <div className="px-2">
          <div className="px-3 py-2.5 rounded-xl bg-gradient-to-br from-farmly-surface-elevated to-farmly-surface border border-farmly-border flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] text-farmly-muted-dark uppercase tracking-wider font-mono">
                {t("common.workspace", "Workspace")}
              </span>
              <span className="font-bold text-farmly-foreground capitalize">
                {t(`role.${role}`, role.replace("_", " "))} {t("common.mode", "Mode")}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "relative flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 group outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent min-h-[40px]",
                  isActive
                    ? "bg-gradient-to-r from-farmly-primary to-farmly-primary-hover text-white font-semibold shadow-[0_6px_16px_-8px_rgba(20,92,67,0.6)]"
                    : "text-farmly-muted hover:bg-farmly-surface-elevated hover:text-farmly-foreground hover:translate-x-0.5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-white" : "text-farmly-muted-dark group-hover:text-farmly-primary dark:group-hover:text-farmly-accent-light"
                    )}
                  />
                  <span>{t(item.translationKey, item.label)}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold",
                      isActive
                        ? "bg-white text-farmly-dark-green"
                        : "bg-farmly-primary text-white"
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-farmly-accent to-farmly-primary ring-2 ring-farmly-surface shadow-sm flex items-center justify-center font-bold text-xs text-white shrink-0">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-farmly-foreground truncate">
                {user?.fullName || "Ramesh Patil"}
              </div>
              <div className="text-[10px] text-farmly-muted truncate">
                {user?.organization || user?.district || role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-farmly-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
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
