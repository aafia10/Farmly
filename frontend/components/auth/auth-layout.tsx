import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sprout, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { APP_CONFIG } from "@/lib/constants";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  alternateAction: {
    label: string;
    linkText: string;
    href: string;
  };
}

export function AuthLayout({
  children,
  title,
  subtitle,
  alternateAction,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-farmly-bg flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full py-6 px-4 sm:px-8 flex items-center justify-between border-b border-farmly-border/50 bg-farmly-surface/50 backdrop-blur-sm">
        <Logo size="md" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-farmly-muted hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded-lg px-2.5 py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
        {/* Subtle Ambient Background */}
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] rounded-full bg-farmly-primary/10 blur-[130px]"
          aria-hidden="true"
        />

        <div className="w-full max-w-xl relative z-10">
          <div className="rounded-3xl border border-farmly-border bg-farmly-surface shadow-2xl p-6 sm:p-10">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-farmly-surface-elevated border border-farmly-accent/30 text-emerald-300 mb-4 shadow-sm">
                <Sprout className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {title}
              </h1>
              <p className="mt-2 text-sm text-farmly-muted leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Form Body */}
            {children}

            {/* Alternate Link Footer */}
            <div className="mt-8 pt-6 border-t border-farmly-border/50 text-center text-sm text-farmly-muted">
              {alternateAction.label}{" "}
              <Link
                href={alternateAction.href}
                className="font-semibold text-farmly-accent hover:text-emerald-300 underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded"
              >
                {alternateAction.linkText}
              </Link>
            </div>
          </div>

          {/* Trust assurances below card */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-farmly-muted-dark">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-farmly-accent" />
              Verifiable &amp; Secure
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-farmly-accent" />
              Zero Data Sharing
            </span>
          </div>
        </div>
      </main>

      {/* Auth Footer */}
      <footer className="py-4 px-6 text-center text-xs text-farmly-muted-dark border-t border-farmly-border/40">
        &copy; {new Date().getFullYear()} {APP_CONFIG.name}. Modern agricultural infrastructure.
      </footer>
    </div>
  );
}
