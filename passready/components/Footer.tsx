import Link from "next/link";

import { SITE } from "@/lib/constants";

const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
        <div className="max-w-md">
          <p className="text-base font-semibold text-brand-950">{SITE.name}</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            Built for learner drivers in the UK first — clear signals, honest guidance, and a
            calm path to test day.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm text-brand-700 sm:items-end">
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
            <Link className="hover:text-brand-950" href="/">
              Home
            </Link>
            <Link className="hover:text-brand-950" href="/assessment">
              Get your TestReady Score
            </Link>
            <Link className="hover:text-brand-950" href="/sample-report">
              See Sample Report
            </Link>
            <Link className="hover:text-brand-950" href="/report-lookup">
              Find My Report
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
