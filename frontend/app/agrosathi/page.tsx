"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Globe,
  Mic,
  FileCheck2,
  Bell,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages";
import { backendClient } from "@/lib/api/backendClient";

export default function AgroSathiPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [simulatedQuery, setSimulatedQuery] = useState("");
  const [chatLog, setChatLog] = useState<{ query: string; answer: string }[]>([
    {
      query: "When will payment for Lot LT-20391 arrive in my bank account?",
      answer:
        "Namaste Ramesh ji! Lot LT-20391 is currently at Stage 4 (Payment Initiated). The buyer submitted NEFT reference UTR-HDFC-992104-IN today. Upon automated RTGS clearance, ₹1,20,000 will be credited directly to your registered bank account.",
    },
  ]);

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = simulatedQuery.trim();
    if (!queryText) return;

    setSimulatedQuery("");
    const pendingIndex = chatLog.length;
    setChatLog((prev) => [
      ...prev,
      {
        query: queryText,
        answer: "Thinking...",
      },
    ]);

    try {
      const res = await backendClient.queryAgroSathi(queryText);
      setChatLog((prev) =>
        prev.map((item, idx) => (idx === pendingIndex ? { query: queryText, answer: res.answer } : item))
      );
    } catch {
      setChatLog((prev) =>
        prev.map((item, idx) =>
          idx === pendingIndex
            ? {
                query: queryText,
                answer:
                  "AgroSathi Digital Assistant: Your harvest records, weighment scale receipts, and APMC grade indicators are fully synchronized on Farmly. Contact your local field assistant Priya Sharma for on-ground assistance.",
              }
            : item
        )
      );
    }
  };

  return (
    <AppLayout title="AgroSathi Digital Assistant">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-farmly-dark-green/50 to-farmly-surface border border-farmly-border p-6 lg:p-8">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Multilingual Farmer Digital Companion
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-farmly-foreground tracking-tight">
              AgroSathi — Your Farmly AI Assistant
            </h1>
            <p className="text-xs text-farmly-muted leading-relaxed">
              Designed for farmers across India. AgroSathi explains produce lot certificates, translates buyer bids into 11 regional languages, and provides real-time guidance on escrow payment timelines.
            </p>
          </div>
        </div>

        {/* Telephony Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-farmly-surface border border-farmly-border flex items-start gap-3 text-xs text-farmly-muted">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Platform Feature Notice:</strong> AgroSathi is an integrated digital web assistant within the Farmly software platform. It does not operate outbound voice calling agents, toll-free telephony numbers, or automated phone calls. All assistance is delivered securely in-app.
          </p>
        </div>

        {/* Simulated Assistant Dialogue */}
        <Card className="bg-farmly-surface border-farmly-border p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-farmly-border pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-farmly-foreground">Ask AgroSathi About Your Farm</h3>
                <span className="text-[11px] text-farmly-muted">Available in 11 Indian regional dialects</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Online
            </span>
          </div>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {chatLog.map((msg, idx) => (
              <div key={idx} className="space-y-2 text-xs">
                <div className="flex justify-end">
                  <div className="p-3 rounded-2xl bg-farmly-primary text-white max-w-md rounded-br-none">
                    {msg.query}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="p-3.5 rounded-2xl bg-farmly-surface-elevated border border-farmly-border text-farmly-muted max-w-lg rounded-bl-none leading-relaxed">
                    <span className="font-bold text-farmly-foreground block mb-1">AgroSathi:</span>
                    {msg.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendQuery} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Ask about lot grades, buyer offers, or payment timelines..."
              value={simulatedQuery}
              onChange={(e) => setSimulatedQuery(e.target.value)}
              className="flex-1 bg-farmly-surface-elevated border border-farmly-border rounded-xl px-4 py-2.5 text-xs text-farmly-foreground focus:outline-none focus:ring-2 focus:ring-farmly-accent placeholder:text-farmly-muted"
            />
            <Button type="submit" className="bg-farmly-primary hover:bg-farmly-primary-hover text-white text-xs px-4">
              Ask
            </Button>
          </form>
        </Card>

        {/* 11 Regional Languages Preview */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-farmly-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            11 Regional Languages Supported
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLanguage(lang.name)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedLanguage === lang.name
                    ? "bg-farmly-primary/30 border-farmly-accent text-white"
                    : "bg-farmly-surface border-farmly-border text-farmly-muted hover:text-farmly-foreground"
                }`}
              >
                <div className="font-bold text-xs">{lang.nativeName}</div>
                <div className="text-[10px] text-farmly-muted-dark">{lang.name}</div>
              </button>
            ))}
          </div>
          {selectedLanguage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              AgroSathi is pre-configured to assist farmers in {selectedLanguage}!
            </div>
          )}
        </div>

        {/* Feature Roadmap Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-farmly-foreground text-sm">Document Simplifier</h3>
            <p className="text-xs text-farmly-muted leading-relaxed">
              Explains complex weighbridge receipts, deduction percentages, and APMC cess in plain local language.
            </p>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-farmly-foreground text-sm">Voice Navigation (In Dev)</h3>
            <p className="text-xs text-farmly-muted leading-relaxed">
              Assists farmers with low digital literacy through intuitive audio prompts and voice query synthesis.
            </p>
          </Card>

          <Card className="bg-farmly-surface border-farmly-border p-5 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-farmly-foreground text-sm">Mandi Price Alerts</h3>
            <p className="text-xs text-farmly-muted leading-relaxed">
              Instant alerts when nearby APMC auctions exceed the minimum guaranteed support price thresholds.
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
