import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/Section";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy policy",
  description:
    "How Pass Pilot stores assessments and reports, processes payments with Stripe, and handles account authentication.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Section eyebrow="Privacy" title="How Pass Pilot handles your details" contentClassName="max-w-3xl text-left">
      <div className="space-y-4 text-sm leading-relaxed text-brand-700">
        <p>
          We store learner assessments and reports against your Pass Pilot account on Supabase, process payments
          securely with Stripe (card data stays with Stripe), and only use emails for authentication unless you opted
          into other comms separately.
        </p>
        <p>
          You can retrieve reports only whilst signed in; magic-link email lookups are discontinued in favour of
          accounts to reduce accidental exposure.
        </p>
        <p>
          Returning to{" "}
          <Link href="/signup" className="font-semibold text-teal-800 underline underline-offset-4">
            signup
          </Link>{" "}
          acknowledges this policy alongside the Terms of use.
        </p>
      </div>
    </Section>
  );
}
