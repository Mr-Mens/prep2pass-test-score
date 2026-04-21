"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SITE } from "@/lib/constants";

import { Button } from "./Button";

const links = [
  { href: "/", label: "Home" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/report-lookup", label: "Find my report" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-200/60 bg-white/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80 md:border-brand-100/80 md:shadow-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-xl pr-2"
          onClick={() => setOpen(false)}
          aria-label={`${SITE.name} — Home`}
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-950 text-sm font-bold text-white shadow-sm">
            P2
          </span>
          <span className="font-heading text-sm font-semibold tracking-tight text-brand-950 sm:text-base">
            {SITE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-950" : "text-brand-700 hover:bg-brand-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Button
            href="/assessment"
            className="ml-2 !min-h-[44px] !px-4 !py-2.5 !text-sm"
          >
            Get My TestReady Score
          </Button>
        </nav>

        <div className="flex items-center md:hidden">
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-200/90 bg-white text-brand-900 shadow-sm transition active:bg-brand-50"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden className="text-xl leading-none">
              {open ? "×" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-brand-100 bg-white/98 shadow-inner md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-3 sm:px-6">
            <Button
              href="/assessment"
              variant="conversion"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Get My TestReady Score
            </Button>
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-xl px-4 py-3.5 text-sm font-medium ${
                    active ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
