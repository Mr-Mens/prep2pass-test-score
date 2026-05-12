"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/BrandLogo";

export function AuthScreenChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-12">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/welcome"
          className="mb-10 block rounded-xl outline-none ring-teal-600 ring-offset-2 focus-visible:ring-2"
        >
          <BrandLogo variant="auth" />
        </Link>
        {children}
      </div>
    </div>
  );
}
