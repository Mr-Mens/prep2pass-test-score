import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { FaqItem } from "@/components/FaqItem";
import { FeatureCard } from "@/components/FeatureCard";
import { HomeReportPreview } from "@/components/HomeReportPreview";
import { LandingPricing } from "@/components/LandingPricing";
import { Section } from "@/components/Section";
import { TestimonialCard } from "@/components/TestimonialCard";
import { TrustBadge } from "@/components/TrustBadge";
import { LIFETIME_MEMBER_UI, PRICING } from "@/lib/constants";
import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Test Ready Score by Prep2Pass",
  description:
    "Test Ready Score: a clear UK learner assessment with practical risks and focused next steps before your practical test. Created by a DVSA-approved driving instructor.",
};

export default async function HomePage() {
  const sessionUser = await getServerAuthUser();

  let hasLifetimeAccess = false;
  if (sessionUser?.id && sessionUser.emailConfirmedAt && isSupabaseConfigured()) {
    try {
      hasLifetimeAccess = await getLifetimeAccessByUserId(sessionUser.id);
    } catch {
      hasLifetimeAccess = false;
    }
  }

  const suppressAcquisitionPricing = Boolean(sessionUser?.emailConfirmedAt && hasLifetimeAccess);

  const faqItems = suppressAcquisitionPricing
    ? ([
        {
          q: "Is this official DVSA guidance?",
          a: "No. Prep2Pass is independent and not affiliated with DVSA. Test Ready Score is produced by a DVSA-approved driving instructor to complement lessons. Nothing here substitutes for your instructor or official DVSA materials.",
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
          a: `${LIFETIME_MEMBER_UI.unlimited} Your Prep2Pass account keeps a dated timeline so you can see how checkpoints move between lessons.`,
        },
        {
          q: "Is my report saved securely?",
          a: "Yes. Saved reports stay linked to your account. Only you access them while signed in with your Prep2Pass credentials.",
        },
      ] satisfies { q: string; a: string }[])
    : ([
        {
          q: "Is this official DVSA guidance?",
          a: "No. Prep2Pass is independent and not affiliated with DVSA. Test Ready Score is produced by a DVSA-approved driving instructor to complement lessons. Nothing here substitutes for your instructor or official DVSA materials.",
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
          a: `Yes. Pick ${PRICING.lifetime.display} lifetime progress access for a private timeline of scores and saved reports tied to your account email.`,
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
      ] satisfies { q: string; a: string }[]);

  const trustProgressBody = suppressAcquisitionPricing
    ? "Saved reports stack into a dated timeline whenever you rerun the assessment signed in."
    : "Lifetime access keeps scores and plans in one timeline.";

  const howSteps = suppressAcquisitionPricing
    ? [
        {
          step: "01",
          title: "Complete your assessment",
          body: "Answer questions about lessons, confidence, mock test outcomes, fault patterns, and areas you find difficult.",
        },
        {
          step: "02",
          title: "Generate your Premium report",
          body: "Included with your Prep2Pass account: your full score, coaching note, action plan, and lesson-hour estimate save automatically.",
        },
        {
          step: "03",
          title: "Improve with focused action",
          body: "Use your report with your instructor, parent, or private practice plan to focus on what matters most.",
        },
      ]
    : [
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
      ];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-brand-200/50">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/95 via-white to-teal-50/40" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[min(36rem,70vh)] bg-[radial-gradient(ellipse_75%_55%_at_50%_-8%,rgba(45,212,191,0.2),transparent_68%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[-15%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-teal-200/30 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-20%] left-[-18%] h-[24rem] w-[24rem] rounded-full bg-brand-300/25 blur-[90px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(28,43,56,0.035)_1px,transparent_1px)] [background-size:26px_26px]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-[5.25rem] sm:px-6 sm:pb-16 sm:pt-24 lg:px-8 lg:pb-[4.75rem] lg:pt-[6.75rem]">
          <div className="mx-auto grid max-w-md grid-cols-1 items-start gap-9 text-center sm:max-w-2xl md:gap-10 lg:mx-0 lg:max-w-none lg:grid-cols-12 lg:gap-x-12 lg:gap-y-8 lg:text-left">
            <div className="flex flex-col items-center lg:col-span-7 lg:items-start lg:py-2">
              <div className="flex flex-col items-center gap-2 lg:items-start">
                <p className="inline-flex items-center rounded-full border border-teal-200/70 bg-white/75 px-[13px] py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-teal-800 shadow-sm backdrop-blur-sm lg:text-[11.5px]">
                  Prep2Pass · Test Ready Score
                </p>
                <p className="text-[11px] font-medium leading-snug text-brand-600 lg:text-xs">
                  Created by a DVSA-approved driving instructor
                </p>
              </div>
              <h1 className="mt-5 font-heading text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-brand-950 sm:mt-6 sm:text-[2.125rem] md:text-4xl lg:mt-7 lg:text-[2.875rem] lg:leading-[1.06]">
                Know if you&apos;re ready to pass before you book your test
              </h1>
              <p className="mt-4 max-w-xl text-pretty text-[0.9375rem] leading-relaxed text-brand-700 sm:mt-5 sm:text-lg lg:max-w-xl">
                Get a clear readiness score, risk breakdown, and focused action plan so you know exactly what to improve
                before test day.
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-[22rem] justify-center sm:max-w-md lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:-mt-4 lg:self-center lg:justify-end">
              <div
                className="relative w-full overflow-hidden rounded-[1.375rem] border border-white/90 bg-white/80 px-[18px] py-[18px] text-left shadow-[0_38px_80px_-38px_rgba(15,40,54,0.45),inset_0_1px_0_0_rgba(255,255,255,0.92)] ring-1 ring-brand-950/[0.045] backdrop-blur-md sm:px-[22px] sm:py-[22px]"
                role="group"
                aria-label="Example Test Ready Score breakdown"
              >
                <div
                  className="pointer-events-none absolute -right-14 -top-16 h-[11rem] w-[11rem] rounded-full bg-teal-200/35 blur-[48px]"
                  aria-hidden
                />
                <div className="relative space-y-[14px] sm:space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-brand-100 pb-3.5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400 sm:text-[11px]">
                        Sample score
                      </p>
                      <p className="mt-1 font-heading text-3xl font-semibold tabular-nums tracking-tight text-brand-900 sm:text-[2.125rem]">
                        72/100
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gradient-to-br from-teal-50 to-teal-100/95 px-[14px] py-1 text-xs font-semibold text-teal-950 ring-1 ring-teal-200/85 sm:text-sm">
                      Nearly Test Ready
                    </span>
                  </div>
                  <p className="text-xs leading-snug text-brand-700 sm:text-[13px]">
                    <span className="font-semibold text-brand-900">Focus areas:</span> roundabouts, observations,
                    junction planning
                  </p>
                  <p className="text-xs leading-snug text-brand-700 sm:text-[13px]">
                    <span className="font-semibold text-brand-900">Estimated:</span> 8–12 lesson hours
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center lg:col-span-7 lg:items-start lg:space-y-1">
              <div className="flex w-full max-w-[22rem] justify-center lg:max-w-none lg:justify-start">
                <Button
                  href="/assessment"
                  variant="conversion"
                  className="w-full lg:w-auto lg:min-w-[17.75rem]"
                >
                  Get My Test Ready Score
                </Button>
              </div>
              <p className="mt-4 max-w-md text-[11px] leading-relaxed text-brand-600 md:text-[12px]">
                Secure account · Progress saved · Instant access
              </p>
              <p className="mt-3 max-w-md text-[11px] leading-relaxed text-brand-500 md:text-[12px]">
                Built for learners, parents supervising practice, and driving instructors.
              </p>
              {suppressAcquisitionPricing ? (
                <p className="mt-2 max-w-md text-[11px] leading-relaxed text-teal-800/95 md:text-[12px]">
                  {LIFETIME_MEMBER_UI.badge} · {LIFETIME_MEMBER_UI.unlimited}
                </p>
              ) : (
                <p className="mt-2 max-w-md text-[11px] leading-relaxed text-brand-400 md:text-[12px]">
                  From £3.99 one-off · £9.99 lifetime progress access · Secure checkout
                </p>
              )}
            </div>
          </div>

          {!suppressAcquisitionPricing ? (
            <div
              id="pricing"
              className="relative mx-auto mt-14 max-w-5xl border-t border-brand-200/55 pt-12 sm:mt-16 sm:pt-14 lg:mt-20"
            >
              <LandingPricing />
            </div>
          ) : (
            <div className="relative mx-auto mt-14 max-w-5xl border-t border-teal-200/40 pt-12 sm:mt-16 sm:pt-14 lg:mt-20">
              <p className="text-center text-sm font-medium leading-relaxed text-teal-900">{LIFETIME_MEMBER_UI.badge}</p>
              <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-brand-700">
                {LIFETIME_MEMBER_UI.unlimited}{" "}
                <span className="text-brand-600">
                  Go to{" "}
                  <a href="/dashboard" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
                    your dashboard
                  </a>
                  {" · "}
                  <a href="/my-reports" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
                    saved reports
                  </a>
                </span>
              </p>
            </div>
          )}
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
            {
              title: "Track progress before test day",
              body: trustProgressBody,
            },
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
        title={suppressAcquisitionPricing ? "What your membership includes" : "What you unlock after checkout"}
        subtitle={
          suppressAcquisitionPricing
            ? "Everything below is already yours on Prep2Pass—consistent structure for every new assessment."
            : "Everything below comes from your assessment and is tuned for real lessons rather than hype."
        }
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
          {howSteps.map((item) => (
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
            title={suppressAcquisitionPricing ? "Secure account · saved reports" : "Secure checkout and saved progress"}
            description={
              suppressAcquisitionPricing
                ? "Each checkpoint stays tied to Prep2Pass so signed-in retrieval stays simple between devices."
                : "Stripe payments and saved reports tied to your account so you can come back anytime."
            }
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
          {faqItems.map((item) => (
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
          {suppressAcquisitionPricing ? (
            <p className="text-[11px] leading-relaxed text-brand-600 lg:text-xs">
              Unlimited Premium checkpoints on this account · No pricing prompts as you practise
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-brand-500 lg:text-xs">
              From £3.99 one-off · £9.99 lifetime progress access · Secure checkout
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
