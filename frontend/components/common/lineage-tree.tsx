"use client";

import React from "react";
import Link from "next/link";
import { Boxes, ArrowDownRight, Truck, Store, User, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

export interface LineageNode {
  id: string;
  crop: string;
  quantity: number;
  unit: string;
  owner: string;
  stage: "Farmer" | "Distributor" | "Retailer" | "Farmer Remaining" | "Buffer";
  status: string;
  children?: LineageNode[];
}

export const DEFAULT_LINEAGE: LineageNode = {
  id: "KS-MH-NSK-WHT-20260910-00125",
  crop: "Sharbati Wheat",
  quantity: 492.4,
  unit: "kg",
  owner: "Ramesh Patil (Farmer)",
  stage: "Farmer",
  status: "Active",
  children: [
    {
      id: "KS-MH-NSK-WHT-20260910-00125-D1",
      crop: "Sharbati Wheat",
      quantity: 250,
      unit: "kg",
      owner: "GreenHarvest Distributors",
      stage: "Distributor",
      status: "In Transit",
      children: [
        {
          id: "KS-MH-NSK-WHT-20260910-00125-D1-R1",
          crop: "Sharbati Wheat",
          quantity: 200,
          unit: "kg",
          owner: "FreshBasket Retail",
          stage: "Retailer",
          status: "Delivered",
        },
        {
          id: "KS-MH-NSK-WHT-20260910-00125-D1-BUF",
          crop: "Sharbati Wheat",
          quantity: 50,
          unit: "kg",
          owner: "GreenHarvest Distributors (Buffer Storage)",
          stage: "Buffer",
          status: "Active",
        },
      ],
    },
    {
      id: "KS-MH-NSK-WHT-20260910-00125-REM",
      crop: "Sharbati Wheat",
      quantity: 242.4,
      unit: "kg",
      owner: "Ramesh Patil (Farmer Reserve)",
      stage: "Farmer Remaining",
      status: "Active",
    },
  ],
};

export function LineageTree({ data = DEFAULT_LINEAGE }: { data?: LineageNode }) {
  const getStageIcon = (stage: LineageNode["stage"]) => {
    switch (stage) {
      case "Farmer":
      case "Farmer Remaining":
        return User;
      case "Distributor":
      case "Buffer":
        return Truck;
      case "Retailer":
        return Store;
      default:
        return Boxes;
    }
  };

  const renderNode = (node: LineageNode, isRoot = false) => {
    const Icon = getStageIcon(node.stage);

    return (
      <div key={node.id} className="flex flex-col items-start space-y-4">
        <Link
          href={`/lots/${node.id}`}
          className="group outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded-2xl block w-full max-w-md"
        >
          <Card
            hoverGlow
            className={cn(
              "p-4 border transition-all duration-200",
              isRoot
                ? "border-farmly-accent/60 bg-farmly-surface-elevated shadow-lg"
                : "border-farmly-border/70"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-farmly-primary/10 text-farmly-primary dark:text-farmly-accent-light border border-farmly-accent/30">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-farmly-foreground group-hover:text-farmly-primary dark:group-hover:text-farmly-accent-light transition-colors flex items-center gap-1.5">
                    <span>{node.id}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-farmly-accent" />
                  </div>
                  <span className="text-[11px] text-farmly-muted">{node.stage}</span>
                </div>
              </div>
              <StatusBadge status={node.status} size="sm" />
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-farmly-border/40 text-xs">
              <span className="text-farmly-muted truncate max-w-[200px]">{node.owner}</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300 text-sm">
                {node.quantity} {node.unit}
              </span>
            </div>
          </Card>
        </Link>

        {/* Children Branches */}
        {node.children && node.children.length > 0 && (
          <div className="pl-6 sm:pl-8 border-l-2 border-dashed border-farmly-accent/40 space-y-4 ml-4 sm:ml-6 relative">
            <div className="text-[10px] uppercase font-mono tracking-wider text-farmly-accent flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              <span>Downstream Lot Splits</span>
            </div>
            <div className="space-y-4">
              {node.children.map((child) => renderNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 overflow-x-auto py-2">
      <div className="flex items-center justify-between pb-2 border-b border-farmly-border/50">
        <div>
          <h4 className="text-sm font-bold text-farmly-foreground">Interactive Lot Lineage &amp; Splits</h4>
          <p className="text-xs text-farmly-muted">Click any downstream child lot to inspect chain of custody records.</p>
        </div>
        <span className="text-xs font-mono text-farmly-accent">Parent-Child Tree</span>
      </div>

      <div className="pt-2">{renderNode(data, true)}</div>
    </div>
  );
}
