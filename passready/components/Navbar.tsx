"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SITE } from "@/lib/constants";

import { Button } from "./Button";

const links = [
  { href: "/", label: "Home" },
  { href: "/sample-report", label: "Sample Report" },
  { href: "/report-lookup", label: "Find My Report" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
          aria-label={`${SITE.name} — Home`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-950 text-sm font-bold text-white">
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
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-950" : "text-brand-700 hover:bg-brand-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Button href="/assessment" className="ml-2 px-4 py-2 text-sm">
            Get My TestReady Score
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button href="/assessment" className="px-3 py-2 text-xs sm:text-sm">
            Get My TestReady Score
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-brand-200 text-brand-900"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Toggle menu</span>
            <span aria-hidden className="text-lg leading-none">
              {open ? "×" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-brand-100 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
