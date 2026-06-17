import Link from "next/link";

import { Section } from "@/components/Section";

export default function TermsPage() {
  return (
    <Section eyebrow="Legal" title="Prep2Pass terms of use" contentClassName="max-w-3xl text-left">
      <div className="prose prose-sm max-w-none text-brand-700">
        <p>
          Pass Pilot is coaching-style guidance only: it is not official DVSA material, not a substitute for live
          instruction, and Prep2Pass stays independent from DVSA. When you continue using Prep2Pass you accept scores and coaching
          plans cannot guarantee passing the practical driving test.
        </p>
        <p className="mt-4">
          Returning to {" "}
          <Link href="/signup" className="font-semibold text-teal-800 underline underline-offset-4">
            signup
          </Link>{" "}
          acknowledges these terms alongside the Privacy Policy.
        </p>
      </div>
    </Section>
  );
}
