"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, PlusCircle, ShieldCheck, Store, Truck, Wheat, type LucideIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";
import { traceabilityApi, type BatchView, type CertificateView, type DashboardData, type TransferView } from "@/lib/api/traceability";
import { StatusPill, UnavailableNotice, certificateStatePill } from "@/components/certificates/certificate-status";

// ------------------------------------------------------------------------------
// Shared building blocks
// ------------------------------------------------------------------------------

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint?: string; icon: LucideIcon }) {
  return (
    <Card className="p-5 sm:p-6 flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-sm text-farmly-muted">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-farmly-foreground tracking-tight">{value}</p>
        {hint && <p className="text-xs text-farmly-muted">{hint}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl bg-farmly-primary/10 text-farmly-primary dark:text-farmly-accent-light flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
    </Card>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-farmly-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-farmly-primary dark:text-farmly-accent-light hover:underline inline-flex items-center gap-1">
      {label} <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <Card className="px-5 py-10 text-center text-sm text-farmly-muted">{children}</Card>;
}

function Row({ href, title, subtitle, right }: { href?: string; title: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode }) {
  const body = (
    <>
      <div className="min-w-0">
        <div className="text-sm font-medium text-farmly-foreground truncate">{title}</div>
        {subtitle && <div className="text-xs text-farmly-muted truncate">{subtitle}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </>
  );
  const cls = "flex items-center justify-between gap-3 px-5 py-3.5";
  return href ? (
    <Link href={href} className={`${cls} hover:bg-farmly-surface-elevated/60 transition-colors`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function transferStatus(t: TransferView) {
  return t.status === "TRACEABILITY_UPDATED"
    ? <StatusPill tone="success" label="Certified" />
    : <StatusPill tone="warning" label="Certificate pending" />;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const formatQty = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

function Header({ name, subtitle, action }: { name?: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-farmly-foreground tracking-tight">Namaste, {name || "there"}</h1>
        <p className="text-sm text-farmly-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

// ------------------------------------------------------------------------------
// Farmer
// ------------------------------------------------------------------------------

type FarmerData = Extract<DashboardData, { role: "farmer" }>;
type BuyerData = Extract<DashboardData, { role: "distributor" | "retailer" }>;

function FarmerDashboard({ data, error }: { data: FarmerData | null; error: string | null }) {
  const { user } = useAuth();
  const { lots } = useMockData();

  // Without the certificate service, fall back to the lots the app already knows about.
  const fallbackLots = lots.filter((l) => l.status !== "Delivered");
  const batches = data?.batches ?? null;
  const certified = batches?.filter((b) => b.certificate && b.certificate.chainStatus === "CONFIRMED" && !b.certificate.revokedAt).length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <Header
        name={user?.fullName}
        subtitle="Your crop lots, certificates and sales."
        action={
          <Link href="/lots/new" className="shrink-0">
            <Button className="gap-2"><PlusCircle className="w-4 h-4" /> Register crop lot</Button>
          </Link>
        }
      />
      {error && <UnavailableNotice message={`Certificate and sales data could not be loaded (${error}).`} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard icon={Wheat} label="Registered lots" value={batches ? batches.length : fallbackLots.length} />
        <StatCard
          icon={Boxes}
          label="Available quantity"
          value={batches ? formatQty(sum(batches.map((b) => b.availableQuantity))) : "—"}
          hint={batches?.[0] ? `in ${batches[0].unit}` : undefined}
        />
        <StatCard icon={ShieldCheck} label="Certificates registered" value={certified ?? "—"} hint={batches ? `of ${batches.length} lots` : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Section title="Your crop lots" action={<SeeAll href="/lots" />}>
            {batches ? (
              batches.length === 0 ? (
                <Empty>No crop lots yet. Register your first lot to get started.</Empty>
              ) : (
                <Card className="divide-y divide-farmly-border overflow-hidden">
                  {batches.slice(0, 6).map((b) => (
                    <Row
                      key={b.id}
                      href={`/lots/${encodeURIComponent(b.id)}`}
                      title={`${b.crop}${b.variety ? ` · ${b.variety}` : ""}`}
                      subtitle={`${formatQty(b.availableQuantity)} of ${formatQty(b.originalQuantity)} ${b.unit} available`}
                      right={b.certificate ? certificateStatePill(b.certificate) : <StatusPill tone="neutral" label="No certificate" />}
                    />
                  ))}
                </Card>
              )
            ) : fallbackLots.length === 0 ? (
              <Empty>No crop lots yet.</Empty>
            ) : (
              <Card className="divide-y divide-farmly-border overflow-hidden">
                {fallbackLots.slice(0, 6).map((l) => (
                  <Row key={l.id} href={`/lots/${encodeURIComponent(l.id)}`} title={`${l.crop} · ${l.variety}`} subtitle={`${l.quantity} ${l.unit}`} />
                ))}
              </Card>
            )}
          </Section>
        </div>

        <Section title="Sales">
          {data && data.transfers.length > 0 ? (
            <Card className="divide-y divide-farmly-border overflow-hidden">
              {data.transfers.slice(0, 5).map((t) => (
                <Row
                  key={t.id}
                  title={`${formatQty(t.quantity)} ${t.unit} to ${t.buyerName ?? t.buyerRole}`}
                  subtitle={new Date(t.createdAt).toLocaleDateString()}
                  right={transferStatus(t)}
                />
              ))}
            </Card>
          ) : (
            <Empty>{data ? "No sales recorded yet." : "Sales are unavailable right now."}</Empty>
          )}
        </Section>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------
// Distributor and retailer
// ------------------------------------------------------------------------------

function BuyerDashboard({ data, error, role }: { data: BuyerData | null; error: string | null; role: "distributor" | "retailer" }) {
  const { user } = useAuth();
  const isRetailer = role === "retailer";
  const holdings: BatchView[] = data?.holdings ?? [];
  const purchases = (data?.transfers ?? []).filter((t) => t.buyerRole === role);
  const sales = (data?.transfers ?? []).filter((t) => t.buyerRole !== role);
  const certById = new Map((data?.certificates ?? []).map((c: CertificateView) => [c.id, c]));

  return (
    <div className="space-y-8 sm:space-y-10">
      <Header
        name={user?.organization || user?.fullName}
        subtitle={isRetailer ? "Your inventory, purchases and product traceability." : "Farmer lots, your purchases and stock."}
        action={
          <Link href="/marketplace" className="shrink-0">
            <Button className="gap-2"><Store className="w-4 h-4" /> {isRetailer ? "Buy from distributors" : "Browse farmer lots"}</Button>
          </Link>
        }
      />
      {error && <UnavailableNotice message={`Purchase and certificate data could not be loaded (${error}).`} />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard icon={Store} label={isRetailer ? "Available from distributors" : "Farmer lots available"} value={data ? data.availableCount : "—"} />
        <StatCard
          icon={Boxes}
          label={isRetailer ? "Inventory on hand" : "Stock on hand"}
          value={data ? formatQty(sum(holdings.map((h) => h.availableQuantity))) : "—"}
          hint={holdings[0] ? `in ${holdings[0].unit}, ${holdings.length} batches` : undefined}
        />
        <StatCard
          icon={Truck}
          label="Received through purchases"
          value={data ? formatQty(sum(purchases.map((p) => p.quantity))) : "—"}
          hint={data ? `${purchases.length} purchases` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Section title="Your purchases">
          {purchases.length > 0 ? (
            <Card className="divide-y divide-farmly-border overflow-hidden">
              {purchases.slice(0, 6).map((p) => {
                const cert = p.certificateId ? certById.get(p.certificateId) : undefined;
                return (
                  <Row
                    key={p.id}
                    href={p.childBatchId ? `/marketplace/${encodeURIComponent(p.childBatchId)}` : undefined}
                    title={`${formatQty(p.quantity)} ${p.unit} · ${p.sourceBatchId}`}
                    subtitle={`${new Date(p.createdAt).toLocaleDateString()} · ${p.id}`}
                    right={cert ? certificateStatePill(cert) : transferStatus(p)}
                  />
                );
              })}
            </Card>
          ) : (
            <Empty>{data ? "No purchases yet." : "Purchases are unavailable right now."}</Empty>
          )}
        </Section>

        <Section title={isRetailer ? "Inventory" : "Your stock"}>
          {holdings.length > 0 ? (
            <Card className="divide-y divide-farmly-border overflow-hidden">
              {holdings.slice(0, 6).map((h) => (
                <Row
                  key={h.id}
                  href={`/marketplace/${encodeURIComponent(h.id)}`}
                  title={`${h.crop}${h.variety ? ` · ${h.variety}` : ""}`}
                  subtitle={`${formatQty(h.availableQuantity)} of ${formatQty(h.originalQuantity)} ${h.unit} remaining`}
                  right={<span className="text-xs text-farmly-muted font-mono">{h.id.slice(-8)}</span>}
                />
              ))}
            </Card>
          ) : (
            <Empty>{data ? "Nothing in stock yet." : "Stock is unavailable right now."}</Empty>
          )}
        </Section>
      </div>

      {!isRetailer && (
        <Section title="Farmer lots awaiting inspection" action={<SeeAll href="/marketplace" />}>
          {data && data.available.length > 0 ? (
            <Card className="divide-y divide-farmly-border overflow-hidden">
              {data.available.map((b) => (
                <Row
                  key={b.id}
                  href={`/marketplace/${encodeURIComponent(b.id)}`}
                  title={`${b.crop}${b.variety ? ` · ${b.variety}` : ""}`}
                  subtitle={`${formatQty(b.availableQuantity)} ${b.unit} available`}
                  right={b.latestCertificate ? certificateStatePill(b.latestCertificate) : <StatusPill tone="neutral" label="No certificate" />}
                />
              ))}
            </Card>
          ) : (
            <Empty>{data ? "No farmer lots are available right now." : "Listings are unavailable right now."}</Empty>
          )}
        </Section>
      )}

      {sales.length > 0 && (
        <Section title="Sold to retailers">
          <Card className="divide-y divide-farmly-border overflow-hidden">
            {sales.slice(0, 5).map((s) => (
              <Row key={s.id} title={`${formatQty(s.quantity)} ${s.unit} to ${s.buyerName ?? "retailer"}`} subtitle={new Date(s.createdAt).toLocaleDateString()} right={transferStatus(s)} />
            ))}
          </Card>
        </Section>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------
// Page
// ------------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Field helpers and legacy roles have their own dashboards.
  useEffect(() => {
    const own: Record<string, string> = {
      helper: "/helper/dashboard",
      fpo: "/fpo/dashboard",
      collection_center: "/collection/dashboard",
      quality_assessor: "/quality/dashboard",
      admin: "/admin/dashboard",
    };
    if (own[role]) router.replace(own[role]);
  }, [role, router]);

  useEffect(() => {
    if (role !== "farmer" && role !== "distributor" && role !== "retailer") return;
    setData(null);
    setError(null);
    traceabilityApi
      .dashboard()
      .then(setData)
      .catch((e) => setError(e?.message || "unavailable"));
  }, [role]);

  return (
    <AppLayout title={t("nav.dashboard", "Dashboard")}>
      {role === "farmer" && <FarmerDashboard data={data?.role === "farmer" ? (data as FarmerData) : null} error={error} />}
      {(role === "distributor" || role === "retailer") && (
        <BuyerDashboard role={role} data={data?.role === role ? (data as BuyerData) : null} error={error} />
      )}
    </AppLayout>
  );
}
