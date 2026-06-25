"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { PRODUCT } from "@/lib/constants";

export function AuthScreenChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/welcome"
          className="mb-10 block rounded-xl text-center outline-none ring-teal-600 ring-offset-2 focus-visible:ring-2"
          aria-label={`${PRODUCT.name} welcome`}
        >
          <BrandLogo variant="auth" />
          <p className="sr-only">{PRODUCT.name}</p>
          <p
            className="mt-3 font-heading text-xl font-semibold tracking-tight text-brand-950"
            aria-hidden="true"
          >
            <span className="text-brand-900">Pass</span>{" "}
            <span className="text-teal-700">Pilot</span>
          </p>
        </Link>
        {children}
      </div>
    </div>
  );
}
