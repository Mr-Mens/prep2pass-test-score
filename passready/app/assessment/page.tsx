import type { Metadata } from "next";

import { AssessmentForm } from "@/components/AssessmentForm";
import { Section } from "@/components/Section";
import { PREMIUM_PRICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "TestReady Score Assessment",
  description:
    "Complete your TestReady Score Assessment, then pay once for your full Premium report: score, risks, next steps, coach note, and a rough lesson-hour band. Created by a DVSA-approved driving instructor.",
};

const VALUE_BULLETS = [
  "Your readiness score, explained in plain English",
  "A breakdown of your highest-risk driving skills",
  "A focused action plan for your next lessons",
  "An instructor-style coach note",
  "A realistic band for how many more lesson hours you may need before test readiness",
] as const;

export default function AssessmentPage() {
  return (
    <Section className="max-md:bg-transparent bg-brand-50" contentClassName="max-w-3xl">
      <div className="mb-10 rounded-2xl border border-brand-200/70 bg-white p-5 shadow-card ring-1 ring-teal-900/[0.05] sm:mb-12 sm:p-8 sm:shadow-sm sm:ring-0">
        <h1 className="text-center font-heading text-2xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-left sm:text-3xl">
          Start your TestReady Score
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-brand-600 sm:text-left sm:text-base">
          Takes less than 60 seconds. No account needed.
        </p>
        <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-brand-800">
          {VALUE_BULLETS.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-brand-100 pt-5 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
          {PREMIUM_PRICE} one-time • Full Premium report after checkout, including lesson-hour estimate
        </p>
      </div>
      <AssessmentForm />
    </Section>
  );
}
