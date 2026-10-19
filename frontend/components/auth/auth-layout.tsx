import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
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

/** Login / signup shell: one centred column that scrolls as a single page. */
export function AuthLayout({ children, title, subtitle, alternateAction }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-farmly-bg overflow-x-hidden">
      {/* Soft brand glow behind the card */}
      <div
        className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 h-[420px] w-[720px] max-w-full rounded-full bg-farmly-accent/10 blur-[110px] dark:bg-farmly-primary/15"
        aria-hidden="true"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-8 py-5">
        <Logo size="md" />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-farmly-muted hover:text-farmly-foreground hover:bg-farmly-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-xl px-4 pt-4 pb-12 sm:pt-8">
        <div className="mb-7 text-center">
          <h1 className="text-[1.75rem] sm:text-[2.1rem] font-bold tracking-[-0.025em] text-farmly-foreground">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm sm:text-[15px] text-farmly-muted leading-relaxed">{subtitle}</p>
        </div>

        <div className="rounded-3xl border border-farmly-border bg-farmly-surface p-6 sm:p-9 farmly-lift">
          {children}

          <div className="mt-8 pt-6 border-t border-farmly-border text-center text-sm text-farmly-muted">
            {alternateAction.label}{" "}
            <Link
              href={alternateAction.href}
              className="font-semibold text-farmly-primary dark:text-farmly-accent-light underline-offset-4 hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded"
            >
              {alternateAction.linkText}
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-farmly-muted-dark">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-farmly-accent" />
            Verifiable &amp; Secure
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-farmly-accent" />
            Zero Data Sharing
          </span>
        </div>
      </main>

      <footer className="relative z-10 border-t border-farmly-border py-5 px-6 text-center text-xs text-farmly-muted-dark">
        &copy; {new Date().getFullYear()} {APP_CONFIG.name}. Modern agricultural infrastructure.
      </footer>
    </div>
  );
}
