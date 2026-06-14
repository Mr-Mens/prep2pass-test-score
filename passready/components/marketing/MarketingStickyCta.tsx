"use client";

import Link from "next/link";

import { BRAND_CTA, PRICING } from "@/lib/constants";

type Props = {
  hidden?: boolean;
};

export function MarketingStickyCta({ hidden = false }: Props) {
  if (hidden) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-200/80 bg-white/95 px-4 py-3 shadow-[0_-8px_32px_rgba(15,40,54,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/assessment"
        className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-teal-900/18 bg-accent text-base font-semibold text-white shadow-[0_2px_10px_rgba(15,118,110,0.42)]"
      >
        {BRAND_CTA.getMyScore}
      </Link>
      <p className="mt-2 text-center text-[10px] leading-snug text-brand-500">
        {PRICING.subscription.display}/month until you pass or cancel
      </p>
    </div>
  );
}
