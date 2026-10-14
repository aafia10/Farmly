"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Lock, ArrowRight } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockData } from "@/contexts/mock-data-context";
import { useTranslation } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { traceabilityApi, type AvailableBatch } from "@/lib/api/traceability";
import { StatusPill, UnavailableNotice, certificateStatePill } from "@/components/certificates/certificate-status";

interface Listing {
  id: string;
  crop: string;
  variety: string | null;
  quantity: number;
  unit: string;
  grade: string | null;
  sellerLabel: string;
  certificate: React.ReactNode;
}

export default function MarketplacePage() {
  const { lots } = useMockData();
  const { role } = useAuth();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [available, setAvailable] = useState<AvailableBatch[] | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  useEffect(() => {
    traceabilityApi
      .available()
      .then(setAvailable)
      .catch((e) => setServiceError(e?.message || "unavailable"));
  }, [role]);

  const listings: Listing[] = useMemo(() => {
    if (available) {
      return available.map((b) => ({
        id: b.id,
        crop: b.crop,
        variety: b.variety,
        quantity: b.availableQuantity,
        unit: b.unit,
        grade: b.qualityGrade,
        sellerLabel: b.ownerRole === "distributor" ? b.ownerDisplayName ?? "Distributor" : "Farmer",
        certificate: b.latestCertificate ? certificateStatePill(b.latestCertificate) : <StatusPill tone="neutral" label="No certificate" />,
      }));
    }
    // Fallback when the certificate service is unreachable: certificate status is unknown.
    return lots
      .filter((lot) => lot.status === "Active" || lot.status === "Under Offer")
      .map((lot) => ({
        id: lot.id,
        crop: lot.crop,
        variety: lot.variety,
        quantity: lot.quantity,
        unit: lot.unit,
        grade: lot.qualityGrade,
        sellerLabel: "Farmer",
        certificate: <StatusPill tone="neutral" label="Certificate status unknown" />,
      }));
  }, [available, lots]);

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.id.toLowerCase().includes(q) || l.crop.toLowerCase().includes(q) || (l.variety ?? "").toLowerCase().includes(q);
    const matchGrade = gradeFilter === "All" || l.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  const gradeOptions = [
    { value: "All", label: t("marketplace.allGrades", "All Grades") },
    { value: "Grade A", label: "Grade A" },
    { value: "Grade B", label: "Grade B" },
    { value: "Standard", label: "Standard" },
  ];

  return (
    <AppLayout title={t("nav.marketplace", "Marketplace")}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-farmly-foreground tracking-tight">{t("marketplace.title", "Marketplace")}</h1>
          <p className="text-sm text-farmly-muted">
            {role === "retailer"
              ? "Distributor stock available to buy. Inspect a batch to review its full certificate history."
              : "Crop lots from registered farmers. Inspect a lot to review its certificates."}
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-farmly-border bg-farmly-surface text-xs text-farmly-muted">
          <Lock className="w-4 h-4 text-farmly-primary dark:text-farmly-accent-light shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t(
              "marketplace.privacyDesc",
              "Farmer personal contact details, Aadhaar IDs, and private land surveys are strictly redacted. Buyers can inspect verified batch details, certificates, and traceability records before purchasing."
            )}
          </p>
        </div>

        {serviceError && (
          <UnavailableNotice message="Live listings could not be loaded, so certificate status is not shown and purchasing is unavailable." />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-farmly-muted" />
            <Input
              placeholder={t("marketplace.searchPlaceholder", "Search crops or batch IDs...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {gradeOptions.map((grade) => (
              <button
                key={grade.value}
                type="button"
                onClick={() => setGradeFilter(grade.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  gradeFilter === grade.value
                    ? "bg-farmly-primary text-white"
                    : "text-farmly-muted hover:text-farmly-foreground hover:bg-farmly-surface-elevated"
                }`}
              >
                {grade.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-12 text-center text-sm text-farmly-muted">
            {t("marketplace.noLots", "No produce lots match your filters.")}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((l) => (
              <Card key={l.id} className="p-5 flex flex-col gap-4 hover:border-farmly-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-farmly-foreground truncate">{l.crop}</h3>
                    <p className="text-xs text-farmly-muted truncate">{l.variety || "—"}</p>
                  </div>
                  {l.grade && <span className="text-[11px] font-medium text-farmly-muted shrink-0">{l.grade}</span>}
                </div>

                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-farmly-muted">Available</dt>
                    <dd className="text-sm font-semibold text-farmly-foreground">{l.quantity} {l.unit}</dd>
                  </div>
                  <div>
                    <dt className="text-farmly-muted">Seller</dt>
                    <dd className="text-sm font-medium text-farmly-foreground truncate">{l.sellerLabel}</dd>
                  </div>
                </dl>

                <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t border-farmly-border">
                  {l.certificate}
                  <Link href={`/marketplace/${encodeURIComponent(l.id)}`}>
                    <Button size="sm" className="gap-1">
                      {t("marketplace.inspect", "Inspect")} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
                <p className="text-[11px] text-farmly-muted-dark font-mono truncate -mt-2">{l.id}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
