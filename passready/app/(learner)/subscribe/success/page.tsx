import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Subscription active · Test Ready Score",
};

export default function SubscribeSuccessPage() {
  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-teal-200 bg-teal-50/60 p-8 text-center shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Subscription active</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950">You&apos;re all set</h1>
      <p className="mt-3 text-sm leading-relaxed text-brand-700">
        Unlimited assessments, progress tracking, and Premium AI reports are now unlocked on your account.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white"
      >
        Go to dashboard
      </Link>
    </section>
  );
}
