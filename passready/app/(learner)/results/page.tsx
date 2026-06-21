import type { Metadata } from "next";

import { Suspense } from "react";

import { ResultsView } from "@/components/ResultsView";

export const metadata: Metadata = {
  title: "Your Premium Test Ready Score Report",
  description:
    "Premium Test Ready Score Report from Pass Pilot: score, risks, and next steps from your latest assessment. Created by a DVSA-approved driving instructor.",
};

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-16 text-center text-brand-600">Loading…</div>}>
      <ResultsView />
    </Suspense>
  );
}
