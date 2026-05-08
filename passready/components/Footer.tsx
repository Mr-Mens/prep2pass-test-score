import Link from "next/link";

import { SITE } from "@/lib/constants";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-3 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-md">
          <p className="text-base font-semibold text-brand-950">{SITE.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            Built by a DVSA-approved driving instructor for learner drivers in the UK: clear signals, honest guidance,
            and a calm path to test day. Prep2Pass is independent and not affiliated with DVSA.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm text-brand-700 sm:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer">
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
              Get My Test Ready Score
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/sample-report"
            >
              See Sample Report
            </Link>
            <Link
              className="rounded-lg px-2 py-1.5 text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="/report-lookup"
            >
              My reports
            </Link>
          </nav>
          <p className="text-xs text-brand-500">
            © {year} {SITE.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
