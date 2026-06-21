import Link from "next/link";

import { Button } from "@/components/Button";
import { FaqItem } from "@/components/FaqItem";
import { LandingPricing } from "@/components/LandingPricing";
import { HeroScoreCard } from "@/components/marketing/HeroScoreCard";
import { MarketingSiteFooter } from "@/components/marketing/MarketingSiteFooter";
import { MarketingStickyCta } from "@/components/marketing/MarketingStickyCta";
import { PremiumReportFeatures } from "@/components/marketing/PremiumReportFeatures";
import { PricingTrustBadges } from "@/components/marketing/PricingTrustBadges";
import { TestCountdownPreview } from "@/components/marketing/TestCountdownPreview";
import { Section } from "@/components/Section";
import { TrustBadge } from "@/components/TrustBadge";
import { PREMIUM_MEMBER_UI, PRICING, BRAND_CTA, PRODUCT } from "@/lib/constants";
import { PUBLIC_FAQ } from "@/lib/content/public-faq";
import { getEffectiveLifetimeAccessByUserId } from "@/lib/server/effective-lifetime-access";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getServerAuthUser } from "@/lib/supabase/server";

const audienceCards = [
  {
    label: "Learners",
    headline: "Know if you're genuinely test ready.",
    body: "Track readiness, monitor progress, and know exactly what to practise next.",
    href: "/welcome?role=learner&next=%2Fassessment",
    cta: BRAND_CTA.getMyScore,
  },
  {
    label: "Instructors",
    headline: "Free tools for better pupil coaching.",
    body: "Digital mock tests, pupil tracking, readiness insights, and teaching support.",
    href: "/welcome?role=instructor",
    cta: "Instructor Access",
  },
  {
    label: "Parents",
    headline: "Support private practice with confidence.",
    body: "Know exactly what to practise and help your learner progress safely.",
    href: "/welcome?role=parent",
    cta: "Parent Access",
  },
] as const;

const socialProof = [
  { title: "Designed using real lesson experience", body: "Built from patterns seen across everyday teaching." },
  { title: "Built around practical test readiness", body: "Focused on what actually affects test day." },
  { title: "Created by a DVSA-approved driving instructor", body: "Instructor-led, not generic advice." },
  { title: "Focused on clear, practical next steps", body: "Plain English you can use straight away." },
] as const;

const failedTestCards = [
  {
    title: "Money",
    body: "A failed test can mean another test fee, additional lessons and months of waiting.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.375M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Time",
    body: "Many learners wait weeks or months for another practical test appointment.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Confidence",
    body: "A failed test can knock confidence and make the next attempt feel more stressful.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
        />
      </svg>
    ),
  },
] as const;

const valueCards = [
  {
    title: "Avoid expensive failed tests",
    body: "Spot weak areas before test day.",
    icon: "£",
  },
  {
    title: "Know what to practise next",
    body: "Turn uncertainty into a clear action plan.",
    icon: "→",
  },
  {
    title: "Track progress over time",
    body: "See your score improve.",
    icon: "↗",
  },
  {
    title: "Use it with your instructor",
    body: "Bring reports to lessons and agree clear targets.",
    icon: "✓",
  },
] as const;

const faqItems = PUBLIC_FAQ.slice(0, 6);

const microIconClass = "h-3.5 w-3.5 shrink-0";

function MicroClockIcon({ className = microIconClass }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function MicroLockIcon({ className = microIconClass }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
      />
    </svg>
  );
}

function MicroBookmarkIcon({ className = microIconClass }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
      />
    </svg>
  );
}

function CtaMicrocopy({ className = "text-brand-600" }: { className?: string }) {
  return (
    <p className={`mt-3 inline-flex items-center justify-center gap-1.5 text-xs leading-relaxed ${className}`}>
      <MicroClockIcon className="opacity-90" />
      <span className="opacity-90">{BRAND_CTA.takesFiveMinutes}</span>
    </p>
  );
}

export async function MarketingHomePage() {
  const sessionUser = await getServerAuthUser();

  let hasPremiumAccess = false;
  if (sessionUser?.id && sessionUser.emailConfirmedAt && isSupabaseConfigured()) {
    try {
      hasPremiumAccess = await getEffectiveLifetimeAccessByUserId(sessionUser.id);
    } catch {
      hasPremiumAccess = false;
    }
  }

  const hideLearnerPricing = Boolean(sessionUser?.emailConfirmedAt && hasPremiumAccess);

  return (
    <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-brand-200/40">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/90 via-white to-teal-50/35" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(45,212,191,0.18),transparent)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center rounded-full border border-teal-200/70 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800 shadow-sm">
                Pass Pilot
              </p>
              <p className="mt-3 text-xs font-medium text-brand-600">
                Created by a DVSA-approved driving instructor
              </p>
              <h1 className="mt-5 font-heading text-balance text-[1.75rem] font-semibold leading-[1.08] tracking-[-0.025em] text-brand-950 sm:text-4xl lg:text-[2.75rem]">
                Stop guessing if you&apos;re ready for your driving test.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-brand-700 lg:mx-0">
                Get your Test Ready Score, personalised action plan and realistic lesson-hour estimate in minutes.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-brand-600 lg:mx-0">
                Stop wasting money on failed tests and stop guessing whether you&apos;re ready. Know where you stand
                and what to improve next.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button href="/assessment" variant="conversion" className="w-full sm:w-auto sm:min-w-[12rem]">
                  {BRAND_CTA.getMyScore}
                </Button>
                <Button href="/sample-report" variant="secondary" className="w-full sm:w-auto sm:min-w-[12rem]">
                  {BRAND_CTA.viewSampleReport}
                </Button>
              </div>
              <CtaMicrocopy />
              <p className="mt-3 text-xs text-brand-600">Secure account · Progress saved · Cancel anytime</p>
              <p className="mt-2 text-xs text-brand-500">
                Built for learners, instructors and parents supporting private practice.
              </p>
              {!hideLearnerPricing ? (
                <div className="mt-5 text-left">
                  <p className="text-sm font-semibold text-brand-800">
                    {PRICING.subscription.display}/month until you pass or cancel.
                  </p>
                  <PricingTrustBadges className="mt-3" />
                </div>
              ) : (
                <p className="mt-4 text-sm text-teal-800">
                  {PREMIUM_MEMBER_UI.badge} ·{" "}
                  <Link href="/dashboard" className="font-semibold underline-offset-4 hover:underline">
                    Go to dashboard
                  </Link>
                </p>
              )}
            </div>

            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <HeroScoreCard />
            </div>
          </div>
        </div>
      </section>

      {/* FOMO / problem statement */}
      <Section
        className="border-b border-brand-100/80 bg-gradient-to-b from-teal-50/30 to-white"
        eyebrow="Clarity"
        title="Stop relying on guesswork and start preparing with a plan."
      >
        <p className="mx-auto max-w-2xl text-center text-base leading-relaxed text-brand-700">
          Know where you stand, understand your biggest risks and focus your lessons on what matters most.
        </p>
      </Section>

      {/* Failed test cost */}
      <Section
        className="bg-white"
        eyebrow="The real cost"
        title="Failed tests cost more than just the test fee."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {failedTestCards.map((card) => (
            <div
              key={card.title}
              className="group rounded-2xl border border-brand-100/90 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200/70 hover:shadow-md"
            >
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800 ring-1 ring-amber-200/70 shadow-sm transition group-hover:from-amber-100 group-hover:to-orange-100"
                aria-hidden
              >
                {card.icon}
              </span>
              <h3 className="mt-4 font-heading text-base font-semibold text-brand-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{card.body}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-brand-700">
          Pass Pilot helps you make more informed decisions about when to book and what to improve before test
          day.
        </p>
      </Section>

      {/* Report features */}
      <Section
        eyebrow="Your report"
        title={`What's included in your ${PRODUCT.report}`}
        subtitle="Designed to help you and your instructor focus on what matters most before test day."
      >
        <PremiumReportFeatures />
        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-brand-100 bg-brand-50/40 px-5 py-4 text-center text-sm leading-relaxed text-brand-700">
          Built to support your instructor&apos;s professional judgement, not replace it. Pass Pilot gives learners,
          instructors and parents a structured way to understand progress and agree clear next steps together.
        </div>
        <p className="mt-6 text-center">
          <Link href="/sample-report" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
            View full sample report →
          </Link>
        </p>
      </Section>

      {/* Test countdown */}
      <Section className="bg-white" eyebrow="Test day focus" title="Stay focused as test day approaches">
        <TestCountdownPreview />
      </Section>

      {/* Why learners use Pass Pilot */}
      <Section eyebrow="Value" title="Why learners use Pass Pilot">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueCards.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition hover:border-teal-200/70 hover:shadow-md"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-800 ring-1 ring-teal-100"
                aria-hidden
              >
                {item.icon}
              </span>
              <h3 className="mt-4 text-sm font-semibold text-brand-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Audience */}
      <Section className="bg-white" eyebrow="Audience" title="Built for everyone involved in learning to drive">
        <div className="grid gap-5 md:grid-cols-3">
          {audienceCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group flex h-full flex-col rounded-2xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/40 p-7 shadow-sm ring-1 ring-brand-50 transition hover:-translate-y-0.5 hover:border-teal-200/70 hover:shadow-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">{card.label}</p>
              <h3 className="mt-3 font-heading text-lg font-semibold leading-snug text-brand-950">{card.headline}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-600">{card.body}</p>
              <span className="mt-6 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 group-hover:underline">
                {card.cta} →
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Social proof, preserved with existing metric badges */}
      <Section
        eyebrow="Experience"
        title="Built from real-world driving instruction experience"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {socialProof.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-brand-100 bg-brand-50/25 p-5 shadow-sm transition hover:border-teal-200/60 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold leading-snug text-brand-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-600">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-medium text-brand-600">
            1000+ lessons&apos; worth of teaching experience
          </span>
          <span className="rounded-full border border-dashed border-brand-200 bg-brand-50/50 px-4 py-2 text-xs font-medium text-brand-500">
            Used by learners and instructors across the UK
          </span>
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" className="bg-white" eyebrow="Plans" title="Simple pricing">
        {hideLearnerPricing ? (
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm font-medium text-teal-900">{PREMIUM_MEMBER_UI.badge}</p>
            <p className="mt-3 text-sm leading-relaxed text-brand-700">
              <Link href="/dashboard" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
                Open dashboard
              </Link>
            </p>
          </div>
        ) : null}
        <LandingPricing hideLearnerCard={hideLearnerPricing} />
      </Section>

      {/* Trust */}
      <Section
        eyebrow="Trust"
        title="Pass Pilot gives honest, practical guidance"
        subtitle="Pass Pilot gives learners, parents and instructors a structured way to understand progress and focus on what matters most before test day."
      >
        <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-teal-200/70 bg-teal-50/50 p-6 text-center shadow-sm ring-1 ring-teal-100/80">
          <h3 className="font-heading text-base font-semibold text-brand-950 sm:text-lg">
            Built to support your instructor&apos;s professional judgement, not replace it.
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-brand-700">
            Pass Pilot gives learners, instructors and parents a structured way to understand progress and agree
            clear next steps together.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TrustBadge title="Created by an approved driving instructor" description="Instructor-led insight." />
          <TrustBadge title="Built around practical test readiness" description="Real test-day themes." />
          <TrustBadge title="Clear plain-English guidance" description="No jargon or hype." />
          <TrustBadge title="Secure checkout and saved progress" description="Stripe billing · saved reports." />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-brand-500">
          Pass Pilot is independent and not affiliated with DVSA.
        </p>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="bg-white" eyebrow="FAQ" title="Questions before you start">
        <div className="mx-auto grid max-w-4xl gap-4">
          {faqItems.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <section className="border-t border-brand-100 bg-gradient-to-br from-brand-950 via-brand-900 to-teal-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-300/90">Start today</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to check your test readiness?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-brand-200">
            Complete the assessment in a few minutes and get a clear plan for what to improve next.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              href="/assessment"
              variant="conversion"
              className="w-full max-w-sm !border-white/20 !bg-white !text-brand-950 hover:!bg-brand-50"
            >
              {BRAND_CTA.getMyScore}
            </Button>
            <Button
              href="/sample-report"
              variant="secondary"
              className="w-full max-w-sm !border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
            >
              {BRAND_CTA.viewSampleReport}
            </Button>
            <div className="mt-2 flex flex-col items-center gap-1 text-xs leading-relaxed text-brand-300">
              <p className="inline-flex items-center gap-1.5">
                <MicroClockIcon />
                <span>{BRAND_CTA.takesFiveMinutes}</span>
              </p>
              <p className="inline-flex items-center gap-1.5">
                <MicroLockIcon />
                <span>Secure account</span>
                <span className="text-brand-400/80" aria-hidden>
                  ·
                </span>
                <MicroBookmarkIcon />
                <span>Progress saved</span>
              </p>
            </div>
            {!hideLearnerPricing ? (
              <div className="mt-3 space-y-1 text-xs leading-relaxed text-brand-300">
                <p>{PRICING.subscription.display}/month until you pass or cancel</p>
                <p>Secure checkout · Cancel anytime</p>
                <p className="text-teal-200/90">Record your pass and we&apos;ll automatically stop future billing.</p>
              </div>
            ) : (
              <Link href="/dashboard" className="mt-3 text-sm font-semibold text-teal-200 underline-offset-4 hover:underline">
                Go to your dashboard →
              </Link>
            )}
          </div>
        </div>
      </section>

      <MarketingStickyCta hidden={hideLearnerPricing} />
      <MarketingSiteFooter />
    </div>
  );
}
