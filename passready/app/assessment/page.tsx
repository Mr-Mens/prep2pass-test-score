import type { Metadata } from "next";

import { AssessmentForm } from "@/components/AssessmentForm";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "TestReady Score Assessment",
  description:
    "Complete your TestReady Score Assessment, then checkout once to unlock your Premium TestReady Score Report.",
};

export default function AssessmentPage() {
  return (
    <Section
      className="bg-brand-50"
      contentClassName="max-w-3xl"
      eyebrow="Prep2Pass"
      title="TestReady Score Assessment"
      subtitle="Answer honestly, then continue to secure checkout to unlock your Premium TestReady Score Report."
    >
      <div className="mb-8 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-brand-950">What you get</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-brand-700">
          <li>Personalised readiness summary in clear instructor-style language</li>
          <li>Prioritised risk areas and practical next steps for upcoming lessons</li>
          <li>Your Premium TestReady Score Report generated only after payment is verified</li>
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-brand-500">
          Checkout is secure (Stripe). Your answers are used to generate your report and improve the
          product. Accounts are coming later.
        </p>
      </div>
      <AssessmentForm />
    </Section>
  );
}
