import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, QrCode, Users, Sprout } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { FarmlyMark } from "@/components/common/farmly-mark";
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

const VALUE_POINTS = [
  { icon: Sprout, title: "From field to buyer", text: "Register farmers, crops and harvest lots in minutes." },
  { icon: QrCode, title: "Traceable by design", text: "Every lot carries a verifiable record and QR journey." },
  { icon: Users, title: "Built for every role", text: "Farmers, field helpers, distributors and retailers." },
];

export function AuthLayout({ children, title, subtitle, alternateAction }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-farmly-bg grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Brand panel (large screens) */}
      <aside className="relative hidden lg:flex lg:sticky lg:top-0 lg:h-screen flex-col justify-between overflow-hidden bg-gradient-to-br from-[#145C43] via-[#0F4A36] to-[#0B3D2E] p-10 xl:p-14 text-white">
        {/* Field-row texture and soft light */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 22px)" }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-[#3EB081]/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#2F8F68]/20 blur-3xl" aria-hidden="true" />

        <Link href="/" className="relative inline-flex items-center gap-3 w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-xl" aria-label="Farmly Home">
          <FarmlyMark className="h-11 w-11 drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)]" />
          <span className="text-2xl font-bold tracking-tight">Farmly</span>
        </Link>

        <div className="relative space-y-8 max-w-md">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9FE3C2]">One platform for every farm</p>
            <h2 className="text-3xl xl:text-4xl font-bold leading-tight tracking-[-0.025em]">
              The digital infrastructure for modern farming.
            </h2>
          </div>
          <ul className="space-y-4">
            {VALUE_POINTS.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-[18px] w-[18px] text-[#9FE3C2]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t}</span>
                  <span className="block text-sm text-white/70 leading-relaxed">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-5 text-xs text-white/70">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#9FE3C2]" /> Verifiable &amp; secure
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#9FE3C2]" /> Zero data sharing
          </span>
        </div>
      </aside>

      {/* Form side */}
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 sm:px-10 py-5">
          <div className="lg:invisible">
            <Logo size="sm" />
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-farmly-muted hover:text-farmly-foreground hover:bg-farmly-surface-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 sm:px-8 pb-10">
          <div className="w-full max-w-xl">
            <div className="rounded-3xl border border-farmly-border bg-farmly-surface p-6 sm:p-10 farmly-lift">
              <div className="mb-8">
                <h1 className="text-2xl sm:text-[1.9rem] font-bold tracking-[-0.025em] text-farmly-foreground">{title}</h1>
                <p className="mt-2 text-sm text-farmly-muted leading-relaxed">{subtitle}</p>
              </div>

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

            {/* Trust assurances (small screens; the brand panel shows them on large screens) */}
            <div className="mt-6 flex lg:hidden items-center justify-center gap-6 text-xs text-farmly-muted-dark">
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

        <footer className="py-4 px-6 text-center text-xs text-farmly-muted-dark">
          &copy; {new Date().getFullYear()} {APP_CONFIG.name}. Modern agricultural infrastructure.
        </footer>
      </div>
    </div>
  );
}
