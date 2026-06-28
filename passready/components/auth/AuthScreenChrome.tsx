"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { PRODUCT } from "@/lib/constants";

type Props = {
  children: ReactNode;
  /** When false, show logo only (no Pass / Pilot wordmark). */
  showWordmark?: boolean;
};

export function AuthScreenChrome({ children, showWordmark = true }: Props) {
  return (
    <div className="app-chrome-top app-viewport-shell flex flex-col overflow-x-hidden px-4 pb-12 sm:px-6 sm:pb-16 sm:pt-12">
      <div className="mx-auto w-full min-w-0 max-w-lg">
        <Link
          href="/welcome"
          className="mb-10 block rounded-xl text-center outline-none ring-teal-600 ring-offset-2 focus-visible:ring-2"
          aria-label={`${PRODUCT.name} welcome`}
        >
          <BrandLogo variant="auth" />
          {showWordmark ? (
            <p
              className="mt-3 font-heading text-xl font-semibold tracking-tight text-brand-950"
              aria-hidden="true"
            >
              <span className="text-brand-900">Pass</span>{" "}
              <span className="text-teal-700">Pilot</span>
            </p>
          ) : (
            <span className="sr-only">{PRODUCT.name}</span>
          )}
        </Link>
        {children}
      </div>
    </div>
  );
}
