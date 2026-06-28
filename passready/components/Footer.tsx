"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/BrandLogo";
import { BRAND_CTA, PRODUCT } from "@/lib/constants";

const year = new Date().getFullYear();

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/learning-centre", label: "Learning Centre" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
  { href: "/assessment", label: BRAND_CTA.getMyScore },
  { href: "/sample-report", label: "Sample report" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/instructor") || pathname === "/" || pathname === "/welcome") {
    return null;
  }

  return (
    <footer className="mt-auto shrink-0 border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="max-w-xl">
          <Link href="/" className="inline-flex max-w-full" aria-label={`${PRODUCT.name}, home`}>
            <span className="md:hidden">
              <BrandLogo variant="compact" />
            </span>
            <span className="hidden md:inline-flex">
              <BrandLogo variant="footer" />
            </span>
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-500">{PRODUCT.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            {PRODUCT.altTagline} {PRODUCT.name} is independent and not affiliated with DVSA.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-brand-700 sm:items-end">
          <nav className="grid grid-cols-2 gap-x-3 gap-y-1 sm:flex sm:flex-wrap sm:justify-end sm:gap-x-4 sm:gap-y-2" aria-label="Footer">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/my-reports"
            >
              My reports
            </Link>
          </nav>
          <p className="text-xs text-brand-500 sm:text-right">
            © {year} {PRODUCT.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
