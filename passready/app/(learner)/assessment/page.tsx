import type { Metadata } from "next";

import Link from "next/link";

import { AssessmentForm } from "@/components/AssessmentForm";
import { Button } from "@/components/Button";
import { LearnerNotificationsPanel } from "@/components/learner/LearnerNotificationsPanel";
import { BRAND_CTA, PREMIUM_MEMBER_UI, PRICING, PRODUCT, SMART_UI } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { getFreeAssessmentByUserId } from "@/lib/server/repositories/entitlements-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";
import { assessmentDataSchema, type AssessmentPayload, type ReadinessLabel } from "@/lib/validation";

export const metadata: Metadata = buildPageMetadata({
  title: `Get Your ${PRODUCT.score}`,
  description:
    "Answer a few questions and receive your Test Ready Score and readiness band. Start a 7-day Premium trial to unlock your full report and dashboard.",
  path: "/assessment",
});

const FREE_VALUE_BULLETS = [
  `Your ${PRODUCT.score} and readiness band on a free account`,
  "Connect with your instructor on Pass Pilot",
  `${PRICING.subscription.trialDays}-day Premium trial unlocks your ${SMART_UI.report.toLowerCase()}`,
  `${SMART_UI.reports}, ${SMART_UI.debriefs}, and ${SMART_UI.insights} with Premium`,
] as const;

const PREMIUM_VALUE_BULLETS = [
  `Unlimited ${PRODUCT.score} assessments`,
  `${SMART_UI.personalisedReports} with every save`,
  `${SMART_UI.debriefs} and ${SMART_UI.insights} on your dashboard`,
  `${PREMIUM_MEMBER_UI.journey} and lesson reflections`,
] as const;

export default async function AssessmentPage() {
  const sessionUser = await getServerAuthUser();
  const isConfirmedLearner = Boolean(sessionUser?.emailConfirmedAt);

  let hasLifetimeAccess = false;
  let canStartAssessment = true;
  let isGraduated = false;
  let hasUsedFreeAssessment = false;
  let initialPreview: {
    assessment: AssessmentPayload;
    readinessScore: number;
    readinessLabel: ReadinessLabel;
  } | null = null;

  let firstNameHint = "";
  if (sessionUser) {
    const sb = createSupabaseServerClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    const md = user?.user_metadata as Record<string, unknown> | undefined;
    firstNameHint =
      (typeof md?.first_name === "string" && md.first_name.trim()) ||
      (typeof md?.firstName === "string" && md.firstName.trim()) ||
      "";
  }

  if (sessionUser?.id && isSupabaseConfigured()) {
    try {
      const access = await getLearnerAccessStatus(sessionUser.id);
      hasLifetimeAccess = access.hasPremiumAccess;
      canStartAssessment = access.canStartAssessment;
      isGraduated = access.isGraduated;
      hasUsedFreeAssessment = access.hasUsedFreeAssessment;

      if (hasUsedFreeAssessment && !hasLifetimeAccess) {
        const free = await getFreeAssessmentByUserId(sessionUser.id);
        if (free) {
          const parsedAssessment = free.assessmentData
            ? assessmentDataSchema.safeParse(free.assessmentData)
            : null;
          initialPreview = {
            assessment: parsedAssessment?.success
              ? parsedAssessment.data
              : ({
                  fullName: firstNameHint || "Learner",
                  email: sessionUser.email ?? "",
                  lessonsTaken: 0,
                  testBooked: "no" as const,
                  testDate: "",
                  mockTestTaken: "no" as const,
                  mockTestResult: "not_taken" as const,
                  seriousFaults: 0,
                  drivingFaults: 0,
                  confidenceLevel: 6,
                  weakAreas: [],
                  weakAreaDetails: [],
                  mockReflectionCategories: [],
                  mockReflectionDetails: [],
                  extraNotes: "",
                  syllabusCaptureVersion: 1,
                  topicsCovered: [],
                } satisfies AssessmentPayload),
            readinessScore: free.score,
            readinessLabel: free.label as ReadinessLabel,
          };
        }
      }
    } catch {
      hasLifetimeAccess = false;
    }
  }

  const showPostAssessmentOnly = Boolean(initialPreview);
  const showIntro = !showPostAssessmentOnly;
  const valueBullets = hasLifetimeAccess ? PREMIUM_VALUE_BULLETS : FREE_VALUE_BULLETS;

  return (
    <section className="overflow-x-hidden pb-4">
      <div className="mx-auto w-full max-w-3xl">
        {isConfirmedLearner ? <LearnerNotificationsPanel /> : null}

        {showIntro ? (
          <div className="mb-10 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:mb-12 sm:p-8">
            <h1 className="text-center font-heading text-2xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-left sm:text-3xl">
              {hasLifetimeAccess
                ? BRAND_CTA.updateMyScore
                : hasUsedFreeAssessment
                  ? `Your ${PRODUCT.score}`
                  : BRAND_CTA.getYourScore}
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-brand-600 sm:text-left sm:text-base">
              {hasLifetimeAccess
                ? PREMIUM_MEMBER_UI.unlimited
                : isConfirmedLearner
                  ? "Free accounts include one assessment with your score and readiness band."
                  : BRAND_CTA.entrySubtext}
            </p>
            <p className="mt-3 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
              {isConfirmedLearner && hasLifetimeAccess ? (
                <>
                  Signed in securely · Unlimited {SMART_UI.reports.toLowerCase()} · {PREMIUM_MEMBER_UI.journey}
                </>
              ) : isConfirmedLearner ? (
                <>
                  Signed in · One free assessment · {PRICING.subscription.trialCta} for full access
                </>
              ) : (
                <>Sign in to save your free score · {PRICING.subscription.trialMessage}</>
              )}
            </p>
            {!isConfirmedLearner ? (
              <p className="mt-2 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
                Already have an account?{" "}
                <Link
                  href="/welcome?role=learner&next=%2Fassessment"
                  className="font-semibold text-teal-800 underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to complete your free assessment.
              </p>
            ) : null}
            <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-brand-800">
              {valueBullets.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {!hasLifetimeAccess ? (
              <p className="mt-6 border-t border-brand-100 pt-5 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
                {PRICING.subscription.trialMessage}
              </p>
            ) : (
              <p className="mt-6 border-t border-brand-100 pt-5 text-center text-xs leading-relaxed text-brand-600 sm:text-left">
                Your next report saves straight to Pass Pilot and opens as a full {SMART_UI.report.toLowerCase()}. No per-report checkout.
              </p>
            )}
          </div>
        ) : null}

        {isGraduated ? (
          <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6 text-center">
            <h2 className="font-heading text-xl font-semibold text-brand-950">Graduate Mode active</h2>
            <p className="mt-3 text-sm text-brand-700">{PREMIUM_MEMBER_UI.graduateNote}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button href="/my-reports" variant="conversion" className="min-h-[48px]">
                {BRAND_CTA.viewScoreHistory}
              </Button>
              <Button href="/dashboard" variant="secondary" className="min-h-[48px]">
                Dashboard
              </Button>
            </div>
          </section>
        ) : showPostAssessmentOnly || canStartAssessment ? (
          <AssessmentForm
            lockedAccountEmail={isConfirmedLearner ? sessionUser?.email : undefined}
            prefilledFullName={isConfirmedLearner ? firstNameHint || undefined : undefined}
            hasLifetimeAccess={hasLifetimeAccess}
            initialPreview={initialPreview}
            stackAboveMobileNav={isConfirmedLearner}
          />
        ) : (
          <section className="rounded-2xl border border-brand-200 bg-white p-6 text-center shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-brand-950">Free assessment used</h2>
            <p className="mt-3 text-sm text-brand-700">{PRICING.subscription.trialMessage}</p>
            <Button href="/subscribe" variant="conversion" className="mt-6 min-h-[48px]">
              {PRICING.subscription.trialCta}
            </Button>
          </section>
        )}
      </div>
    </section>
  );
}
