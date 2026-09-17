import React from "react";
import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { FOOTER_SECTIONS, APP_CONFIG } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-farmly-border bg-farmly-surface/80 pt-16 pb-12 text-white">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-12 border-b border-farmly-border">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" showTagline={false} />
            <p className="text-farmly-muted text-sm max-w-sm leading-relaxed">
              {APP_CONFIG.tagline}. Connecting growers, buyers, and agricultural services
              through unified, accessible digital infrastructure.
            </p>
            <div className="pt-2 text-xs text-farmly-muted-dark">
              Built for farmers, cooperatives, and modern agri-chains.
            </div>
          </div>

          {/* Dynamic Link Columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-sm font-semibold tracking-wider text-white uppercase">
                {section.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-farmly-muted hover:text-white transition-colors duration-150 inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farmly-accent rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-farmly-muted">
          <div>
            &copy; {currentYear} {APP_CONFIG.name}. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#privacy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#terms"
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-farmly-accent">Verifiable &amp; Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
