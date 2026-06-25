import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/Section";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy policy",
  description:
    "How Pass Pilot stores assessments and reports, processes payments with Stripe, handles account authentication, and uses postcode and test-centre preferences.",
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
          <strong className="font-semibold text-brand-900">Location and profile preferences.</strong> When you sign up
          or update your account, we may ask for your postcode and, optionally, a preferred driving test centre or
          teaching area. We do not ask for your full street address. We use postcode and test-centre preferences to:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>personalise local driving content on Pass Pilot;</li>
          <li>improve local recommendations as the product develops;</li>
          <li>support future test-centre and route guidance features;</li>
          <li>generate anonymous, aggregated product analytics (for example by postcode area, test centre, or account role).</li>
        </ul>
        <p>
          Aggregated analytics do not identify you personally. We do not sell your personal data. We do not share your
          postcode with third parties for marketing. If we introduce new uses that need separate consent — such as
          insurance partnerships — we will ask explicitly before enabling them.
        </p>
        <p>
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-teal-800 underline underline-offset-4">
            Terms
          </Link>{" "}
          and this Privacy Policy.
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
