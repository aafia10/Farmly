"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  FileText,
  CreditCard,
  Boxes,
  FileCheck2,
  AlertTriangle,
  User,
  CheckCheck,
  ArrowRight,
  Filter,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";
import { NotificationItem } from "@/types";

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useMockData();
  const { t } = useTranslation();

  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = [
    { value: "All", label: t("common.all", "All") },
    { value: "Unread", label: t("notifications.unread", "Unread") },
    { value: "Offer", label: t("nav.offers", "Offer") },
    { value: "Payment", label: t("nav.payments", "Payment") },
    { value: "Lot", label: t("nav.lots", "Lot") },
    { value: "Evidence", label: t("nav.evidence", "Evidence") },
    { value: "Dispute", label: t("nav.disputes", "Dispute") },
    { value: "System", label: t("notifications.system", "System") },
  ];

  const filteredNotifications = notifications.filter((item) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "Unread") return !item.read;
    return item.category === activeCategory;
  });

  const getCategoryIcon = (category: NotificationItem["category"]) => {
    switch (category) {
      case "Offer":
        return <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case "Payment":
        return <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case "Lot":
        return <Boxes className="w-5 h-5 text-farmly-accent" />;
      case "Evidence":
        return <FileCheck2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "Dispute":
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case "Farmer activity":
        return <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-farmly-muted" />;
    }
  };

  return (
    <AppLayout title={t("nav.notifications", "Notification Center")}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">
              {t("notifications.title", "Notification Center")}
            </h1>
            <p className="text-xs text-farmly-muted">
              {t(
                "notifications.subtitle",
                "Live updates on trade offers, escrow payment releases, field evidence, and dispute cases."
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllNotificationsAsRead}
            className="border-farmly-border text-xs text-farmly-foreground hover:bg-farmly-surface-elevated shrink-0 font-medium"
          >
            <CheckCheck className="w-4 h-4 mr-1.5 text-farmly-accent" />
            {t("notifications.markAllRead", "Mark All as Read")}
          </Button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const count =
              cat.value === "All"
                ? notifications.length
                : cat.value === "Unread"
                ? notifications.filter((n) => !n.read).length
                : notifications.filter((n) => n.category === cat.value).length;

            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.value
                    ? "bg-farmly-primary text-white shadow-sm font-bold"
                    : "bg-farmly-surface border border-farmly-border text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeCategory === cat.value
                        ? "bg-white/25 text-farmly-foreground font-bold"
                        : "bg-farmly-surface-elevated text-farmly-muted"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-farmly-surface border-farmly-border p-8 text-center space-y-2">
              <Bell className="w-10 h-10 text-farmly-muted mx-auto opacity-40" />
              <div className="text-sm font-semibold text-farmly-foreground">
                {t("notifications.emptyTitle", "No notifications in this filter")}
              </div>
              <p className="text-xs text-farmly-muted">
                {t("notifications.emptyDesc", "You are up to date on all agricultural alerts.")}
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notif) => (
              <Card
                key={notif.id}
                className={`border transition-colors ${
                  notif.read
                    ? "bg-farmly-surface/60 border-farmly-border"
                    : "bg-farmly-surface border-farmly-accent/40 shadow-sm"
                }`}
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-farmly-surface-elevated border border-farmly-border flex items-center justify-center shrink-0">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-farmly-muted">{notif.category}</span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[11px] text-farmly-muted">{notif.timestamp}</span>
                    </div>

                    <h3 className="text-sm font-bold text-farmly-foreground">{notif.title}</h3>
                    <p className="text-xs text-farmly-muted leading-relaxed">{notif.message}</p>

                    <div className="pt-2 flex items-center justify-between">
                      <Link
                        href={notif.link}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="text-xs text-farmly-accent hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        {t("common.details", "View Details")} <ArrowRight className="w-3 h-3" />
                      </Link>

                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="text-[11px] text-farmly-muted hover:text-farmly-foreground font-medium"
                        >
                          {t("notifications.markRead", "Mark as read")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
