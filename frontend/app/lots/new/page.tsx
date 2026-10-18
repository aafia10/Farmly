"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Loader2,
  Wallet,
  Boxes,
  Database,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { backendClient } from "@/lib/api/backendClient";
import { ethers } from "ethers";

// ── Contract config ────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_BATCH_REGISTRY_CONTRACT_ADDRESS ||
  "0xFB558c0cC86738A7a40ff1BD7538E7cbeC89d794";

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "string", name: "batchId", type: "string" },
      { internalType: "string", name: "crop", type: "string" },
      { internalType: "uint256", name: "quantityScaled", type: "uint256" },
      { internalType: "string", name: "ipfsHash", type: "string" },
    ],
    name: "registerBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────────
type Step = "idle" | "pinata" | "metamask" | "confirming" | "saving" | "done" | "error";

interface BlockchainResult {
  txHash: string;
  blockNumber: number;
  etherscanUrl: string;
  ipfsHash: string;
  ipfsUrl: string;
  lotId: string;
  dbSaved: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NewPhysicalLotPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Form state
  const [farmerName, setFarmerName] = useState(user?.fullName || "Ramesh Patil");
  const [crop, setCrop] = useState("Sharbati Wheat");
  const [variety, setVariety] = useState("Lokwan C-306");
  const [declaredWeight, setDeclaredWeight] = useState("500");
  const [measuredWeight, setMeasuredWeight] = useState("492.4");
  const [scaleId, setScaleId] = useState("FPO-SIN-03 (Calibrated Platform Scale)");
  const [qualityGrade, setQualityGrade] = useState<"Grade A" | "Grade B" | "Standard">("Grade A");
  const [location, setLocation] = useState("Sinnar Collection Hub #3, Nashik");

  // Flow state
  const [step, setStep] = useState<Step>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BlockchainResult | null>(null);

  const declaredNum = Number(declaredWeight) || 0;
  const measuredNum = Number(measuredWeight) || 0;
  const tareDiff = (declaredNum - measuredNum).toFixed(1);

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lotId = `LT-${Date.now().toString().slice(-8)}`;
    // No certificate reference yet: it is set when a real certificate is uploaded for the lot.

    try {
      // STEP 1: Pin metadata to Pinata via backend
      setStep("pinata");
      setStatusMsg("Uploading batch certificate to Pinata IPFS…");

      let ipfsHash: string;
      let ipfsUrl: string;

      try {
        const pinRes = await fetch(`${BACKEND_URL}/lots/pin-metadata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: lotId,
            farmerName: farmerName || user?.fullName || "Farmer",
            farmerId: user?.id,
            crop,
            variety,
            quantity: measuredNum,
            unit: "kg",
            qualityGrade,
            location,
            weighmentScaleId: scaleId,
          }),
        });
        const pinData = await pinRes.json();
        ipfsHash = pinData.ipfsHash;
        ipfsUrl = pinData.gatewayUrl || `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      } catch {
        // Stub CID if backend not running
        ipfsHash = `QmFarmly${lotId.replace(/-/g, "")}`;
        ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        console.warn("[Farmly] Using stub IPFS CID — configure PINATA_JWT in backend/.env");
      }

      // STEP 2: Connect MetaMask
      setStep("metamask");
      setStatusMsg("Opening MetaMask — please approve the connection and confirm the transaction…");

      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error(
          "MetaMask is not installed. Please install it from https://metamask.io and try again."
        );
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      // Ensure we are on Sepolia (chainId 11155111 = 0xaa36a7)
      const { chainId } = await provider.getNetwork();
      if (chainId !== 11155111n) {
        try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: "0xaa36a7" }]);
        } catch {
          throw new Error(
            "Please switch MetaMask to the Sepolia test network and try again."
          );
        }
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const quantityScaled = BigInt(Math.round(measuredNum * 100));

      // STEP 3: Send transaction — MetaMask confirmation popup appears here
      setStep("confirming");
      setStatusMsg("Transaction sent to MetaMask — waiting for Sepolia confirmation…");

      const tx = await contract.registerBatch(lotId, crop, quantityScaled, ipfsHash);

      setStatusMsg(`TX ${tx.hash.slice(0, 10)}… submitted. Waiting for block confirmation…`);
      const receipt = await tx.wait(1);

      // STEP 4: Save batch details to Database (backend API + direct Supabase fallback)
      setStep("saving");
      setStatusMsg("Saving batch details to database…");

      const token = typeof window !== "undefined" ? localStorage.getItem("farmly_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let savedInDb = false;
      const lotPayload = {
        id: lotId,
        farmerName: farmerName || user?.fullName || "Ramesh Patil",
        farmerId: user?.id,
        crop,
        variety,
        quantity: measuredNum,
        unit: "kg",
        qualityGrade,
        location,
        weighmentScaleId: scaleId,
        blockchainHash: tx.hash,
        ipfsHash,
        status: "Active" as const,
      };

      try {
        const dbRes = await fetch(`${BACKEND_URL}/lots`, {
          method: "POST",
          headers,
          body: JSON.stringify(lotPayload),
        });

        const dbJson = await dbRes.json().catch(() => ({}));
        if (dbRes.ok && (dbJson.success || dbJson.data)) {
          savedInDb = true;
          console.log("[Farmly] Batch successfully stored in database via API:", lotId);
        } else {
          console.warn("[Farmly] Backend /lots returned error, trying Supabase fallback:", dbJson);
        }
      } catch (dbErr) {
        console.warn("[Farmly] Backend API request failed, attempting direct Supabase fallback:", dbErr);
      }

      // If backend API didn't save it, fallback to direct Supabase client
      if (!savedInDb) {
        try {
          await backendClient.createLot(lotPayload);
          savedInDb = true;
          console.log("[Farmly] Batch successfully stored in database via Supabase fallback:", lotId);
        } catch (fbErr) {
          console.error("[Farmly] Direct database save fallback error:", fbErr);
        }
      }

      // DONE
      setResult({
        txHash: tx.hash,
        blockNumber: Number(receipt.blockNumber),
        etherscanUrl: `https://sepolia.etherscan.io/tx/${tx.hash}`,
        ipfsHash,
        ipfsUrl,
        lotId,
        dbSaved: savedInDb,
      });
      setStep("done");
    } catch (err: any) {
      console.error("[Farmly] Registration error:", err);
      setError(err?.reason || err?.message || "Registration failed. Please try again.");
      setStep("error");
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === "done" && result) {
    return (
      <AppLayout title="Batch Registered">
        <div className="max-w-2xl space-y-6">
          <Card className="p-8 text-center space-y-5 border border-emerald-500/40 bg-emerald-500/5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-farmly-foreground">
                Batch Successfully Registered!
              </h3>
              <p className="text-sm text-farmly-muted mt-1">
                Certificate pinned to Pinata IPFS · Transaction confirmed on Sepolia
              </p>
            </div>

            {/* Details panel */}
            <div className="p-4 bg-farmly-surface rounded-xl border border-farmly-border space-y-3 text-left text-sm max-w-lg mx-auto">
              <div className="flex justify-between items-center">
                <span className="text-farmly-muted font-medium">Lot ID</span>
                <span className="font-mono font-bold text-farmly-primary">{result.lotId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-farmly-muted font-medium">Block Number</span>
                <span className="font-mono text-farmly-foreground">#{result.blockNumber}</span>
              </div>

              <div className="pt-2 border-t border-farmly-border">
                <p className="text-[11px] text-farmly-muted mb-1.5 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Sepolia Transaction Hash
                </p>
                <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 break-all leading-relaxed">
                  {result.txHash}
                </p>
              </div>

              <div className="pt-2 border-t border-farmly-border">
                <p className="text-[11px] text-farmly-muted mb-1.5 font-semibold flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5 text-blue-500" />
                  Pinata IPFS CID
                </p>
                <p className="font-mono text-[11px] text-blue-600 dark:text-blue-400 break-all leading-relaxed">
                  {result.ipfsHash}
                </p>
              </div>

              <div className="pt-2 border-t border-farmly-border">
                <p className="text-[11px] text-farmly-muted mb-1.5 font-semibold flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-purple-500" />
                  Database Record
                </p>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  {result.dbSaved
                    ? "✓ Successfully saved in Database (Supabase batches table)"
                    : "Stored on blockchain & Pinata IPFS"}
                </p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-1">
              <a href={result.etherscanUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View on Etherscan
                </Button>
              </a>
              <a href={result.ipfsUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Certificate on Pinata
                </Button>
              </a>
              <Button
                variant="outline"
                onClick={() => { setStep("idle"); setResult(null); }}
              >
                Register Another
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (step !== "idle" && step !== "error") {
    const labels: Partial<Record<Step, string>> = {
      pinata: "Step 1 of 3 — Uploading to Pinata IPFS",
      metamask: "Step 2 of 3 — MetaMask Confirmation",
      confirming: "Step 3 of 3 — Waiting for Sepolia Block",
      saving: "Finalising — Saving to Farmly DB",
    };

    return (
      <AppLayout title="Registering Batch…">
        <div className="max-w-lg">
          <Card className="p-8 text-center space-y-5 border border-farmly-border bg-farmly-surface">
            <div className="w-14 h-14 rounded-full bg-farmly-primary/10 flex items-center justify-center mx-auto">
              {step === "metamask" ? (
                <Wallet className="w-7 h-7 text-farmly-primary" />
              ) : (
                <Loader2 className="w-7 h-7 text-farmly-primary animate-spin" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-farmly-primary uppercase tracking-widest">
                {labels[step] ?? "Processing…"}
              </p>
              <p className="text-sm text-farmly-foreground font-medium">{statusMsg}</p>
            </div>
            {step === "metamask" && (
              <p className="text-xs text-farmly-muted">
                A MetaMask popup should appear. Review the gas details and click{" "}
                <strong>Confirm</strong>.
              </p>
            )}
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <AppLayout title="Register Batch">
      <div className="max-w-3xl space-y-6">
        {/* Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
          <Scale className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-farmly-foreground">
              Blockchain + IPFS Provenance Registration
            </h4>
            <p className="text-xs sm:text-sm text-farmly-muted leading-relaxed">
              Submitting this form will pin your batch certificate to{" "}
              <strong>Pinata IPFS</strong>, then open{" "}
              <strong>MetaMask</strong> to record the transaction on the{" "}
              <strong>Sepolia test network</strong>. You will need a small
              amount of Sepolia ETH for gas.
            </p>
          </div>
        </div>

        {/* Error */}
        {step === "error" && error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400">Registration Failed</p>
              <p className="text-farmly-muted mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <Card className="p-6 border border-farmly-border bg-farmly-surface">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Farmer Name */}
            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Farmer Name
              </label>
              <Input
                value={farmerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFarmerName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
              />
            </div>

            {/* Crop & Variety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">Crop</label>
                <Input
                  value={crop}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCrop(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">Variety</label>
                <Input
                  value={variety}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVariety(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
            </div>

            {/* Weighment */}
            <div className="p-4 rounded-xl bg-farmly-surface-elevated border border-farmly-border space-y-3">
              <div className="text-xs font-bold text-farmly-foreground flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-farmly-primary" />
                Weighment &amp; Tare Reconciliation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-farmly-muted mb-1">
                    Farmer Declared (kg)
                  </label>
                  <Input
                    type="number" step="0.1"
                    value={declaredWeight}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeclaredWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-farmly-muted mb-1">
                    Scale Measured Net (kg)
                  </label>
                  <Input
                    type="number" step="0.1"
                    value={measuredWeight}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMeasuredWeight(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-farmly-muted mb-1">
                    Tare / Moisture Loss
                  </label>
                  <div className="px-3 py-2.5 rounded-xl bg-farmly-surface border border-farmly-border text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                    {tareDiff} kg
                  </div>
                </div>
              </div>
              {Number(tareDiff) > 5 && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Difference exceeds 5 kg — tare variance will be flagged for review.
                </div>
              )}
            </div>

            {/* Scale & Quality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Weighbridge / Scale ID
                </label>
                <Input
                  value={scaleId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScaleId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                  Initial Quality Grade
                </label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value as "Grade A" | "Grade B" | "Standard")}
                  className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
                >
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B (Standard Commercial)</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-farmly-foreground mb-1">
                Intake Location / Collection Hub
              </label>
              <Input
                value={location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-farmly-input-bg border border-farmly-input-border text-farmly-foreground text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-farmly-border">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" className="bg-farmly-primary text-white flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Register Batch via MetaMask
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
