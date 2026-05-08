import Link from "next/link";

import { Section } from "@/components/Section";

export default function PrivacyPage() {
  return (
    <Section eyebrow="Privacy" title="How Prep2Pass handles your details" contentClassName="max-w-3xl text-left">
      <div className="space-y-4 text-sm leading-relaxed text-brand-700">
        <p>
          We store learner assessments and reports against your Prep2Pass account on Supabase, process payments securely
          with Stripe (card data stays with Stripe), and only use emails for authentication unless you opted into other
          comms separately.
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
          confirms agreement with this stance.
        </p>
      </div>
    </Section>
  );
}
