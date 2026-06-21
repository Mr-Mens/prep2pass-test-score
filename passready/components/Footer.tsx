"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/BrandLogo";
import { BRAND_CTA, PRODUCT } from "@/lib/constants";

const year = new Date().getFullYear();

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/instructor") || pathname === "/" || pathname === "/welcome") {
    return null;
  }

  return (
    <footer className="border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-3 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-xl">
          <Link
            href="/"
            className="inline-flex max-w-full"
            aria-label={`${PRODUCT.name}, home`}
          >
            <BrandLogo variant="footer" />
          </Link>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-500">{PRODUCT.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            {PRODUCT.altTagline} {PRODUCT.name} is independent and not affiliated with DVSA.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm text-brand-700 sm:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer">
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/learning-centre"
            >
              Learning Centre
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/pricing"
            >
              Pricing
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/faq"
            >
              FAQ
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/about"
            >
              About
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/"
            >
              Home
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/assessment"
            >
              {BRAND_CTA.getMyScore}
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/sample-report"
            >
              See Sample Report
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/privacy"
            >
              Privacy
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/my-reports"
            >
              My reports
            </Link>
          </nav>
          <p className="text-xs text-brand-500">
            © {year} {PRODUCT.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
