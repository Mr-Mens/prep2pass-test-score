import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { FaqItem } from "@/components/FaqItem";
import { FeatureCard } from "@/components/FeatureCard";
import { PricingCard } from "@/components/PricingCard";
import { Section } from "@/components/Section";
import { TestimonialCard } from "@/components/TestimonialCard";
import { TrustBadge } from "@/components/TrustBadge";
import { PREMIUM_PRICE, SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "TestReady Score by Prep2Pass",
  description:
    "Get your TestReady Score — a clear UK learner assessment with practical risks and next steps before your practical test.",
};

export default function HomePage() {
  return (
    <>
      <section className="border-b border-brand-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Prep2Pass · UK learner drivers
            </p>
            <h1 className="mt-5 font-heading text-balance text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
              Get confident on test readiness,{" "}
              <span className="text-brand-700">before</span> you risk test-day surprises.
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-brand-600">
              TestReady Score by Prep2Pass turns your lessons and mock performance into a Premium
              TestReady Score Report you can use with your instructor — clear score, risks, and next
              actions.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button href="/assessment" className="w-full px-6 py-3 text-base sm:w-auto">
                Get My TestReady Score
              </Button>
              <Button href="/sample-report" variant="secondary" className="w-full px-6 py-3 text-base sm:w-auto">
                See Sample Report
              </Button>
            </div>
            <p className="mt-4 text-xs text-brand-500">
              {PREMIUM_PRICE} one-time payment · secure checkout · no subscription
            </p>
          </div>
          <PricingCard
            price={PREMIUM_PRICE}
            bullets={[
              "Readiness score with plain-language explanation",
              "Risk breakdown based on your current weak areas",
              "Focused action plan for your next lessons",
              "Coach note and realistic lesson-hour guidance",
            ]}
          />
        </div>
      </section>

      <Section
        eyebrow="Trust & credibility"
        title="Built to give honest, practical guidance"
        subtitle="No promises, no hype. Just structured insight you can use in real lessons."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TrustBadge
            title="Built for learner drivers"
            description="Designed around practical test prep, not generic driving tips."
          />
          <TrustBadge
            title="Practical, structured guidance"
            description="Score, risks, and actions are organised so you know what to focus on next."
          />
          <TrustBadge
            title="Payment-secure checkout"
            description="One-time payment through Stripe with server-side verification before report unlock."
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
              title: "Unlock your Premium TestReady Score Report",
              body: `Pay ${PREMIUM_PRICE} once through secure checkout to generate your full Premium TestReady Score Report.`,
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
        subtitle="Structured, instructor-style guidance — not generic tips."
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
        {/* Placeholder-style testimonials. Replace with approved real testimonials before production use. */}
        <div className="grid gap-6 md:grid-cols-3">
          <TestimonialCard
            quote="It helped me explain to my instructor exactly what I was struggling with before my next lesson."
            person="Sample learner quote"
            meta="Placeholder content"
          />
          <TestimonialCard
            quote="The risk breakdown made my practice sessions less random and more focused."
            person="Sample learner quote"
            meta="Placeholder content"
          />
          <TestimonialCard
            quote="I liked seeing one score, then specific actions instead of vague confidence advice."
            person="Sample learner quote"
            meta="Placeholder content"
          />
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Questions learners ask before paying">
        <div className="mx-auto grid max-w-4xl gap-4">
          {[
            {
              q: "Is this official DVSA guidance?",
              a: "No. Prep2Pass is independent guidance designed to support lesson planning and self-review.",
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
        subtitle={`A few minutes to assess. One payment of ${PREMIUM_PRICE} unlocks your Premium TestReady Score Report.`}
      >
        <div className="text-center">
          <Button href="/assessment" className="px-7 py-3 text-base">
            Get My TestReady Score
          </Button>
        </div>
      </Section>
    </>
  );
}
