import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { FaqItem } from "@/components/FaqItem";
import { FeatureCard } from "@/components/FeatureCard";
import { PricingCard } from "@/components/PricingCard";
import { Section } from "@/components/Section";
import { TestimonialCard } from "@/components/TestimonialCard";
import { TrustBadge } from "@/components/TrustBadge";
import { PREMIUM_PRICE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "TestReady Score by Prep2Pass",
  description:
    "Get your TestReady Score: a clear UK learner assessment with practical risks and next steps before your practical test. Created by a DVSA-approved driving instructor.",
};

export default function HomePage() {
  return (
    <>
      <section className="border-b border-brand-200/40 bg-gradient-to-b from-brand-50/90 via-white to-brand-50/50">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center md:max-w-2xl lg:max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500/90 lg:text-xs">
              Prep2Pass • TestReady Score
            </p>
            <p className="mt-2 max-w-md text-center text-[11px] font-medium leading-snug text-brand-600/90 lg:text-xs">
              Created by a DVSA-approved driving instructor
            </p>
            <h1 className="mt-4 font-heading text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-brand-950 md:mt-5 md:text-4xl lg:mt-6 lg:text-5xl">
              Know if you&apos;re ready to pass before you book your test
            </h1>
            <p className="mt-4 max-w-sm text-pretty text-[0.9375rem] leading-relaxed text-brand-600/90 md:mt-5 md:max-w-xl md:text-base lg:mt-6 lg:max-w-2xl">
              Get a clear breakdown of what might hold you back, and exactly what to fix.
            </p>
            <div
              className="mt-6 flex w-full max-w-[17.5rem] items-center justify-between gap-3 rounded-2xl border border-brand-200/40 bg-brand-50/40 px-4 py-3 ring-1 ring-black/[0.02] md:mt-7 lg:mt-8 lg:max-w-[20rem] lg:gap-4 lg:px-5 lg:py-4"
              role="group"
              aria-label="Example TestReady Score: 72, Nearly Test Ready"
            >
              <div className="text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400/90 lg:text-[11px]">
                  Sample
                </p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight text-brand-800 lg:text-3xl">
                  72
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-teal-50/90 px-3 py-1 text-xs font-medium text-teal-900/90 ring-1 ring-teal-200/70 lg:px-4 lg:py-1.5 lg:text-sm">
                Nearly Test Ready
              </span>
            </div>
            <div className="mt-9 flex w-full max-w-md justify-center md:mt-11 lg:mt-14 lg:max-w-none">
              <Button
                href="/assessment"
                variant="conversion"
                className="w-full lg:w-auto lg:min-w-[17.5rem]"
              >
                Get My TestReady Score
              </Button>
            </div>
            <p className="mt-5 text-[11px] leading-snug text-brand-400/90 md:mt-5 lg:mt-6 lg:text-xs">
              £4.99 one-time • Instant report
            </p>
          </div>
          <div className="mx-auto mt-14 max-w-sm md:mt-16 md:max-w-md lg:mt-20 lg:max-w-md">
            <PricingCard price={PREMIUM_PRICE} />
          </div>
        </div>
      </section>

      <Section
        eyebrow="Trust & credibility"
        title="Built to give honest, practical guidance"
        subtitle="No promises, no hype. Created by a DVSA-approved driving instructor, with structured insight you can use in real lessons."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TrustBadge
            title="Built for learner drivers"
            description="Created by a DVSA-approved driving instructor around practical test prep, not generic driving tips."
          />
          <TrustBadge
            title="Practical, structured guidance"
            description="Score, risks, and actions are organised so you know what to focus on next."
          />
          <TrustBadge
            title="Payment-secure checkout"
            description="One-time payment through Stripe, safe and secure."
          />
        </div>
      </Section>

      <Section
        className="bg-white"
        eyebrow="How it works"
        title="Three clear steps"
        subtitle="Fast to complete, straightforward to act on."
      >
        <ol className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Complete your TestReady Score Assessment",
              body: "Share lessons, mock outcomes, fault patterns, and the areas that still feel shaky.",
            },
            {
              step: "02",
              title: "Unlock your TestReady Score",
              body: `Pay ${PREMIUM_PRICE} once through secure checkout for your full report: score, risks, and next steps.`,
            },
            {
              step: "03",
              title: "Improve with focused action",
              body: "Use your score, risk breakdown, and next steps to guide upcoming lessons.",
            },
          ].map((item) => (
            <li key={item.step} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{item.step}</p>
              <h3 className="mt-2 text-lg font-semibold text-brand-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{item.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section
        eyebrow="Premium TestReady Score Report"
        title="What you unlock after checkout"
        subtitle="Structured, instructor-style guidance, not generic tips."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            title="Readiness signal"
            description="A single readiness score and label that summarises where you are right now."
            icon={<span aria-hidden>◎</span>}
          />
          <FeatureCard
            title="Risk breakdown"
            description="Specific risk areas that are most likely to impact your practical test result."
            icon={<span aria-hidden>▦</span>}
          />
          <FeatureCard
            title="Personalised next steps"
            description="Concrete actions for your next lessons so progress is visible week by week."
            icon={<span aria-hidden>→</span>}
          />
          <FeatureCard
            title="Coach note + hour guidance"
            description="Clear coaching message plus realistic lesson-hour recommendation for your stage."
            icon={<span aria-hidden>✓</span>}
          />
        </div>
      </Section>

      <Section className="bg-white" eyebrow="Customer-style examples" title="How learners describe the value">
        <div className="grid gap-6 md:grid-cols-3">
          <TestimonialCard
            quote="It helped me explain to my instructor exactly what I was struggling with before my next lesson."
            person="Sample learner quote"
          />
          <TestimonialCard
            quote="The risk breakdown made my practice sessions less random and more focused."
            person="Sample learner quote"
          />
          <TestimonialCard
            quote="I liked seeing one score, then specific actions instead of vague confidence advice."
            person="Sample learner quote"
          />
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Questions learners ask before paying">
        <div className="mx-auto grid max-w-4xl gap-4">
          {[
            {
              q: "Is this official DVSA guidance?",
              a: "No. Prep2Pass is an independent tool, created by a DVSA-approved driving instructor and designed around the skills assessed in the UK driving test.\n\nIt is designed to complement your instructor's advice, not replace it.",
            },
            {
              q: "Does this guarantee I will pass?",
              a: "No. It gives a structured readiness view, but your instructor and real-world performance remain essential.",
            },
            {
              q: "What happens after I pay?",
              a: "Your payment is verified securely, then your Premium TestReady Score Report is generated and shown in-app.",
            },
            {
              q: "Is this better than asking my instructor?",
              a: "It complements your instructor. The best use is taking your report into your next lesson conversation.",
            },
            {
              q: "Can I view my report later?",
              a: "Yes. Use Find My Report with your checkout email to open stored Premium TestReady Score Reports.",
            },
            {
              q: "What if AI is unavailable?",
              a: "Prep2Pass falls back to deterministic scoring and still delivers a complete Premium TestReady Score Report.",
            },
            {
              q: "How much does it cost?",
              a: `It is ${PREMIUM_PRICE} as a one-time payment. There is no subscription.`,
            },
          ].map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </Section>

      <Section
        className="bg-white"
        eyebrow="Ready?"
        title="Get your TestReady Score"
        subtitle={`A few minutes to assess. ${PREMIUM_PRICE} one-time unlocks your full report.`}
      >
        <div className="mx-auto max-w-md px-2 pt-1 text-center">
          <Button
            href="/assessment"
            variant="conversion"
            className="w-full sm:w-auto sm:min-w-[14rem]"
          >
            Get My TestReady Score
          </Button>
        </div>
      </Section>
    </>
  );
}
