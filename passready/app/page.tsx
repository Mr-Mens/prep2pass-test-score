import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { FaqItem } from "@/components/FaqItem";
import { FeatureCard } from "@/components/FeatureCard";
import { HomeReportPreview } from "@/components/HomeReportPreview";
import { LandingPricing } from "@/components/LandingPricing";
import { Section } from "@/components/Section";
import { TestimonialCard } from "@/components/TestimonialCard";
import { TrustBadge } from "@/components/TrustBadge";
import { PRICING } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Test Ready Score by Prep2Pass",
  description:
    "Test Ready Score: a clear UK learner assessment with practical risks and focused next steps before your practical test. Created by a DVSA-approved driving instructor.",
};

export default function HomePage() {
  return (
    <>
      <section className="border-b border-brand-200/40 bg-gradient-to-b from-brand-50/90 via-white to-brand-50/50">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center md:max-w-2xl lg:max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500/90 lg:text-xs">
              Prep2Pass · Test Ready Score
            </p>
            <p className="mt-2 max-w-md text-center text-[11px] font-medium leading-snug text-brand-600/90 lg:text-xs">
              Created by a DVSA-approved driving instructor
            </p>
            <h1 className="mt-4 font-heading text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-brand-950 md:mt-5 md:text-4xl lg:mt-6 lg:text-5xl">
              Know if you&apos;re ready to pass before you book your test
            </h1>
            <p className="mt-4 max-w-sm text-pretty text-[0.9375rem] leading-relaxed text-brand-600/90 md:mt-5 md:max-w-xl md:text-base lg:mt-6 lg:max-w-2xl">
              Get a clear readiness score, risk breakdown, and focused action plan so you know exactly what to improve
              before test day.
            </p>
            <div
              className="mt-6 w-full max-w-[22rem] space-y-3 rounded-2xl border border-brand-200/40 bg-brand-50/40 px-4 py-4 text-left ring-1 ring-black/[0.02] md:mt-7 lg:mt-8 lg:max-w-md lg:px-5 lg:py-5"
              role="group"
              aria-label="Example Test Ready Score breakdown"
            >
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-100/80 pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400/90 lg:text-[11px]">
                    Sample score
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-brand-800 lg:text-3xl">
                    72/100
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-teal-50/90 px-3 py-1 text-xs font-medium text-teal-900/90 ring-1 ring-teal-200/70 lg:px-4 lg:py-1.5 lg:text-sm">
                  Nearly Test Ready
                </span>
              </div>
              <p className="text-xs leading-snug text-brand-700 lg:text-[13px]">
                <span className="font-semibold text-brand-900">Focus areas:</span> roundabouts, observations, junction
                planning
              </p>
              <p className="text-xs leading-snug text-brand-700 lg:text-[13px]">
                <span className="font-semibold text-brand-900">Estimated:</span> 8–12 lesson hours
              </p>
            </div>
            <div className="mt-9 flex w-full max-w-md justify-center md:mt-11 lg:mt-14 lg:max-w-none">
              <Button
                href="/assessment"
                variant="conversion"
                className="w-full lg:w-auto lg:min-w-[17.5rem]"
              >
                Get My Test Ready Score
              </Button>
            </div>
            <p className="mt-4 max-w-md text-[11px] leading-snug text-brand-600/90 md:text-xs">
              Secure account · Progress saved · Instant access
            </p>
            <p className="mt-5 text-[11px] leading-snug text-brand-500/90 md:mt-4 lg:text-xs">
              Built for learners, parents supervising practice, and driving instructors.
            </p>
            <p className="mt-3 text-[11px] leading-snug text-brand-400/90 lg:text-xs">
              From £3.99 one-off · £9.99 lifetime progress access · Secure checkout
            </p>
          </div>

          <div id="pricing" className="mx-auto mt-14 max-w-5xl md:mt-16 lg:mt-20">
            <LandingPricing />
          </div>
        </div>
      </section>

      <Section
        className="bg-white"
        eyebrow="Before you book"
        title="Avoid booking before you&apos;re ready"
        subtitle="Failed tests cost money, confidence, and time. Test Ready Score helps you spot weak areas early, plan better lessons, and avoid guessing whether you&apos;re ready."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Avoid wasting money on failed tests", body: "See where risk sits before you pay test fees twice." },
            { title: "Know what to practise next", body: "Turn your answers into priorities for your upcoming sessions." },
            {
              title: "Turn vague feedback into clear actions",
              body: 'Structured next steps instead of guessing what “almost ready” meant.',
            },
            { title: "Track progress before test day", body: "Lifetime access keeps scores and plans in one timeline." },
          ].map((item) => (
            <TrustBadge key={item.title} title={item.title} description={item.body} />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Preview"
        title="See what your report includes"
        subtitle="Your premium report turns your answers into a clear score, risk breakdown, and practical next steps."
      >
        <div className="mx-auto max-w-5xl">
          <HomeReportPreview />
        </div>
      </Section>

      <Section
        eyebrow="Premium report"
        title="What you unlock after checkout"
        subtitle="Everything below is produced from your assessment and designed to support real lessons — not hype."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            title="Readiness score"
            description="A clear score out of 100 showing how close you are to test readiness."
            icon={<span aria-hidden>◎</span>}
          />
          <FeatureCard
            title="Risk breakdown"
            description="Your highest-risk driving skills, organised by what is most likely to affect your practical test."
            icon={<span aria-hidden>▦</span>}
          />
          <FeatureCard
            title="Focused action plan"
            description="Specific next steps for your upcoming lessons or private practice."
            icon={<span aria-hidden>→</span>}
          />
          <FeatureCard
            title="Coach note + lesson-hour estimate"
            description="Instructor-style guidance with a realistic range of how many more lesson hours you may need."
            icon={<span aria-hidden>✓</span>}
          />
        </div>
      </Section>

      <Section className="bg-white" eyebrow="How it works" title="Three clear steps" subtitle="Fast to complete, straightforward to act on.">
        <ol className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Complete your assessment",
              body: "Answer questions about lessons, confidence, mock test outcomes, fault patterns, and areas you find difficult.",
            },
            {
              step: "02",
              title: "Unlock your Test Ready Score",
              body: "Get your score, risk breakdown, coach note, action plan, and lesson-hour estimate after secure checkout.",
            },
            {
              step: "03",
              title: "Improve with focused action",
              body: "Use your report with your instructor, parent, or private practice plan to focus on what matters most.",
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
        eyebrow="Trust"
        title="Built to give honest, practical guidance"
        subtitle="No promises, no hype. Created by a DVSA-approved driving instructor to give learners clear, structured insight they can use in real lessons."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TrustBadge
            title="Created by an approved driving instructor"
            description="Structured around how practical tests assess skill, explained in calm, plain English."
          />
          <TrustBadge
            title="Built around practical test readiness"
            description="Risks and actions relate to recurring test themes, not generic tips."
          />
          <TrustBadge
            title="Clear, plain-English guidance"
            description="Straightforward language you can bring to your next lesson conversation."
          />
          <TrustBadge
            title="Secure checkout and saved progress"
            description="Stripe payments and saved reports tied to your account so you can come back anytime."
          />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-brand-500">
          Prep2Pass is independent and not affiliated with DVSA.
        </p>
      </Section>

      <Section className="bg-white" eyebrow="Use cases" title="Example ways learners use the report">
        <div className="grid gap-6 md:grid-cols-3">
          <TestimonialCard quote={"I can show my instructor exactly what I'm struggling with."} />
          <TestimonialCard quote={"I know what to focus on instead of just hoping I'm ready."} />
          <TestimonialCard quote="My parent can help me practise the right things between lessons." />
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Questions before you start">
        <div className="mx-auto grid max-w-4xl gap-4">
          {[
            {
              q: "Is this official DVSA guidance?",
              a: "No. Prep2Pass is independent and not affiliated with DVSA. Test Ready Score is created by a DVSA-approved driving instructor to support lesson planning alongside your instructor — it does not replace them or official DVSA materials.",
            },
            {
              q: "Does this guarantee I will pass?",
              a: "No. There is no pass guarantee. You still need real-road performance and professional instruction. This tool helps you prioritise weak areas with a structured view.",
            },
            {
              q: "Can I use this with my instructor?",
              a: "Yes. Many learners bring the readiness score and action plan into their next lesson to agree focused practice. It is meant to complement your instructor, not substitute for them.",
            },
            {
              q: "Can parents use this for private practice?",
              a: "Yes. Supervisors can use the risk breakdown and next steps to plan practice drives between paid lessons.",
            },
            {
              q: "Can I track my progress over time?",
              a: `Yes — choose ${PRICING.lifetime.display} lifetime progress access for a private timeline of scores and saved reports tied to your account email.`,
            },
            {
              q: "What happens after I pay?",
              a: "Your payment is confirmed through Stripe; your Premium report is generated and shown in-app. Your report stays linked to your secure account so you can retrieve it later using the email you used at checkout.",
            },
            {
              q: "How much does it cost?",
              a: `${PRICING.single.display} for one premium report or ${PRICING.lifetime.display} for unlimited premium reports and progress tracking on your email. No subscription.`,
            },
            {
              q: "Is my report saved securely?",
              a: "Reports are stored for your email-linked account via secure retrieval. Checkout is encrypted through Stripe.",
            },
          ].map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </Section>

      <Section
        className="bg-white"
        eyebrow="Start"
        title="Ready to check your test readiness?"
        subtitle="Complete the assessment in a few minutes and get a clear plan for what to improve next."
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-2 pt-1 text-center">
          <Button href="/assessment" variant="conversion" className="w-full sm:w-auto sm:min-w-[14rem]">
            Get My Test Ready Score
          </Button>
          <p className="text-[11px] leading-relaxed text-brand-500 lg:text-xs">
            From £3.99 one-off · £9.99 lifetime progress access · Secure checkout
          </p>
        </div>
      </Section>
    </>
  );
}
