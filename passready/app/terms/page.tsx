import Link from "next/link";

import { Section } from "@/components/Section";

export default function TermsPage() {
  return (
    <Section eyebrow="Legal" title="Prep2Pass terms of use" contentClassName="max-w-3xl text-left">
      <div className="prose prose-sm max-w-none text-brand-700">
        <p>
          Test Ready Score is coaching-style guidance only — not official DVSA material, not a substitute for live
          instruction, and Prep2Pass is independent from DVSA. By using Prep2Pass you accept that scores and plans are not
          a pass guarantee.
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
