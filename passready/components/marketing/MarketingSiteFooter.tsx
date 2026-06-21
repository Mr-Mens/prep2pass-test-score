import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
import { PRODUCT, SITE_DEFAULT_DESCRIPTION } from "@/lib/constants";

const year = new Date().getFullYear();

const footerLinks = [
  { href: "/assessment", label: "Get your score" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function MarketingSiteFooter() {
  return (
    <footer className="border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <Link href="/" className="inline-flex max-w-full" aria-label={`${PRODUCT.name}, home`}>
              <BrandLogo variant="footer" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-brand-700">{SITE_DEFAULT_DESCRIPTION}</p>
            <p className="mt-2 text-xs text-brand-500">
              {PRODUCT.name} is independent and not affiliated with DVSA.
            </p>
          </div>
          <nav aria-label="Site" className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2 py-1.5 text-sm text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-10 border-t border-brand-100 pt-6 text-xs text-brand-500">
          © {year} {PRODUCT.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
