import type { Metadata } from "next";
import Link from "next/link";

import { SupervisorDisclaimers } from "@/components/supervisor/SupervisorDisclaimers";

export const metadata: Metadata = {
  title: "Share with instructor · Coming soon",
};

export default function SupervisorSharePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/supervisor" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
        ← Back to dashboard
      </Link>
      <header className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
        <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          Coming Soon
        </span>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-brand-950">Share with instructor</h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-700">
          Soon you will be able to share practice logs, progress summaries, and agreed focus areas with your
          learner&apos;s Approved Driving Instructor, always with your learner&apos;s consent.
        </p>
      </header>
      <ul className="space-y-3 rounded-2xl border border-brand-100 bg-white p-6 text-sm text-brand-700 shadow-sm">
        <li>· Share private practice session logs</li>
        <li>· Send readiness summaries between lessons</li>
        <li>· Highlight focus areas for the next professional lesson</li>
      </ul>
      <SupervisorDisclaimers compact />
    </div>
  );
}
