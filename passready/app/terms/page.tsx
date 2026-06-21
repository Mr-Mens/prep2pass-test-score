import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/Section";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of use",
  description: "Pass Pilot terms of use: coaching-style guidance, no pass guarantee, and independent status from DVSA.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <Section eyebrow="Legal" title="Pass Pilot terms of use" contentClassName="max-w-3xl text-left">
      <div className="prose prose-sm max-w-none text-brand-700">
        <p>
          Pass Pilot is coaching-style guidance only: it is not official DVSA material, not a substitute for live
          instruction, and Pass Pilot stays independent from DVSA. When you continue using Pass Pilot you accept scores
          and coaching plans cannot guarantee passing the practical driving test.
        </p>
        <p className="mt-4">
          Returning to{" "}
          <Link href="/signup" className="font-semibold text-teal-800 underline underline-offset-4">
            signup
          </Link>{" "}
          acknowledges these terms alongside the Privacy Policy.
        </p>
      </div>
    </Section>
  );
}
