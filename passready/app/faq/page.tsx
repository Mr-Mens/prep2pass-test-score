import type { Metadata } from "next";

import { FaqItem } from "@/components/FaqItem";
import { Section } from "@/components/Section";
import { redirectIfAuthenticated } from "@/lib/server/redirect-if-authenticated";

const FAQ = [
  {
    q: "Is this official DVSA guidance?",
    a: "No. Prep2Pass is independent and not affiliated with DVSA. Test Ready Score is produced by a DVSA-approved driving instructor to complement lessons.",
  },
  {
    q: "Does this guarantee I will pass?",
    a: "No. There is no pass guarantee. You still need real-road performance and professional instruction.",
  },
  {
    q: "Can I use this with my instructor?",
    a: "Yes. Many learners bring the readiness score and action plan into their next lesson to agree focused practice.",
  },
  {
    q: "What is lifetime access?",
    a: "Lifetime access lets you run unlimited Premium reports and unlock progress tracking across your journey.",
  },
  {
    q: "Can parents use Prep2Pass?",
    a: "Yes. Parents and supervisors can link to a learner account to view scores, reports, and practice guidance.",
  },
] as const;

export const metadata: Metadata = {
  title: "FAQ · Test Ready Score",
  description: "Frequently asked questions about Test Ready Score and Prep2Pass.",
};

export default async function FaqPage() {
  await redirectIfAuthenticated();

  return (
    <Section className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">FAQ</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          Frequently asked questions
        </h1>
        <div className="mt-10 space-y-4">
          {FAQ.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </Section>
  );
}
