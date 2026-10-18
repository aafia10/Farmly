import React from "react";

interface CropDetails {
  farmingMethod?: "Organic" | "Natural" | "Conventional";
  organicCertified?: boolean;
  cropCategory?: string;
  sowingDate?: string;
  pricePerKg?: number;
  expectedPricePerKg?: number;
}

const METHOD_STYLE: Record<NonNullable<CropDetails["farmingMethod"]>, string> = {
  Organic: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  Natural: "bg-lime-500/10 text-lime-800 dark:text-lime-300 border-lime-500/30",
  Conventional: "bg-farmly-surface-elevated text-farmly-muted border-farmly-border",
};

/** Farming method, crop type, sowing date and price, when recorded (phone agent or form). Renders nothing otherwise. */
export function CropDetailBadges({ item, className = "" }: { item: CropDetails; className?: string }) {
  const price = item.pricePerKg ?? item.expectedPricePerKg;
  if (!item.farmingMethod && !item.cropCategory && !item.sowingDate && !price) return null;
  const chip = "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold";
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {item.farmingMethod && (
        <span className={`${chip} ${METHOD_STYLE[item.farmingMethod]}`}>
          {item.farmingMethod === "Conventional" ? "Chemical inputs" : item.farmingMethod}
          {item.farmingMethod === "Organic" && (item.organicCertified ? " · certified" : " · self-declared")}
        </span>
      )}
      {item.cropCategory && <span className={`${chip} border-farmly-border text-farmly-muted`}>{item.cropCategory}</span>}
      {item.sowingDate && <span className={`${chip} border-farmly-border text-farmly-muted`}>Sown {item.sowingDate}</span>}
      {price ? <span className={`${chip} border-farmly-border text-farmly-muted`}>₹{price}/kg expected</span> : null}
    </div>
  );
}
