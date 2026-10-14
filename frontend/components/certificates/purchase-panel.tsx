"use client";

import React, { useState } from "react";
import { ShoppingCart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { traceabilityApi, type PurchaseResult } from "@/lib/api/traceability";
import { chainPill, storagePill, WarningNotice } from "./certificate-status";

interface PurchasePanelProps {
  batchId: string;
  availableQuantity: number;
  unit: string;
  sellerLabel: string;
  /** False when the source has no active certificate: purchases are blocked server-side too. */
  hasCertificate: boolean;
  sourceCertificatePending?: boolean;
  onPurchased?: (result: PurchaseResult) => void;
}

export function PurchasePanel({ batchId, availableQuantity, unit, sellerLabel, hasCertificate, sourceCertificatePending, onPurchased }: PurchasePanelProps) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [inspected, setInspected] = useState(false);
  // One key per intended purchase: retries reuse it, so the server never deducts twice.
  const [idempotencyKey, setIdempotencyKey] = useState(() => traceabilityApi.newIdempotencyKey());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  const qty = Number(quantity);
  const qtyError =
    quantity === "" ? null : !(qty > 0) ? "Enter a quantity above zero" : qty > availableQuantity ? `Only ${availableQuantity} ${unit} available` : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyError || !(qty > 0) || !inspected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await traceabilityApi.purchase(
        { sourceBatchId: batchId, quantity: qty, pricePerUnit: price ? Number(price) : undefined, currency: "INR" },
        idempotencyKey
      );
      setResult(res);
      onPurchased?.(res);
    } catch (err: any) {
      // Keep the same key so a retry of this purchase stays idempotent.
      setError(err?.message || "Purchase failed");
    } finally {
      setSubmitting(false);
    }
  };

  const retryCertificate = async () => {
    if (!result) return;
    setSubmitting(true);
    try {
      const res = await traceabilityApi.retryPurchase(result.purchase.id);
      setResult(res);
      onPurchased?.(res);
    } catch (err: any) {
      setError(err?.message || "Retry failed");
    } finally {
      setSubmitting(false);
    }
  };

  const startNew = () => {
    setResult(null);
    setQuantity("");
    setPrice("");
    setInspected(false);
    setIdempotencyKey(traceabilityApi.newIdempotencyKey());
  };

  if (result) {
    const cert = result.certificate;
    const complete = result.purchase.status === "TRACEABILITY_UPDATED";
    return (
      <div className="space-y-3 text-xs">
        <div className="text-sm font-semibold text-farmly-foreground">
          {complete ? "Purchase recorded" : "Purchase recorded, certificate pending"}
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <dt className="text-farmly-muted">Transaction</dt>
          <dd className="font-mono text-farmly-foreground break-all">{result.purchase.id}</dd>
          <dt className="text-farmly-muted">Quantity</dt>
          <dd className="text-farmly-foreground">{result.purchase.quantity} {result.purchase.unit}</dd>
          <dt className="text-farmly-muted">New batch</dt>
          <dd className="font-mono text-farmly-foreground break-all">{result.purchase.childBatchId}</dd>
          <dt className="text-farmly-muted">Certificate</dt>
          <dd className="font-mono text-farmly-foreground break-all">{cert?.id ?? "Not created yet"}</dd>
        </dl>
        {cert && (
          <div className="flex flex-wrap gap-1.5">
            {storagePill(cert.storageStatus)}
            {chainPill(cert.chainStatus)}
          </div>
        )}
        {!complete && (
          <p className="text-farmly-muted">
            The quantity is reserved for you. The transfer certificate will be complete once IPFS storage and blockchain registration succeed
            {result.purchase.lastError ? ` (${result.purchase.lastError})` : ""}.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {!complete && (
            <Button size="sm" variant="secondary" onClick={retryCertificate} isLoading={submitting} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry certificate
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={startNew}>New purchase</Button>
        </div>
      </div>
    );
  }

  if (!hasCertificate) {
    return <WarningNotice>This batch has no active certificate, so it cannot be purchased yet.</WarningNotice>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="text-xs text-farmly-muted">
        Buying from {sellerLabel}. Available: <span className="font-semibold text-farmly-foreground">{availableQuantity} {unit}</span>
      </div>
      {sourceCertificatePending && (
        <WarningNotice>The seller&apos;s certificate is not fully registered on the blockchain yet. Verify it before buying.</WarningNotice>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="buy-qty">Quantity ({unit})</Label>
          <Input id="buy-qty" type="number" min={0} step="any" max={availableQuantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buy-price">Price / {unit} (₹, private)</Label>
          <Input id="buy-price" type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>
      {qtyError && <p className="text-xs text-red-700 dark:text-red-400">{qtyError}</p>}
      <label className="flex items-start gap-2 text-xs text-farmly-muted cursor-pointer">
        <input type="checkbox" checked={inspected} onChange={(e) => setInspected(e.target.checked)} className="mt-0.5 accent-farmly-primary" />
        I have inspected the batch details and certificates above.
      </label>
      {error && <p role="alert" className="text-xs text-red-700 dark:text-red-400">{error}</p>}
      <Button type="submit" fullWidth isLoading={submitting} disabled={!inspected || !!qtyError || !(qty > 0)} className="gap-1.5">
        <ShoppingCart className="w-4 h-4" /> Confirm purchase
      </Button>
    </form>
  );
}
