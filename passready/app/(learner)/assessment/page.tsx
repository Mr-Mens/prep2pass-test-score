import type { Metadata } from "next";

import Link from "next/link";

import { AssessmentForm } from "@/components/AssessmentForm";
import { Button } from "@/components/Button";
import { BRAND_CTA, PREMIUM_MEMBER_UI, PRICING, PRODUCT } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata({
  title: `Get Your ${PRODUCT.score}`,
  description:
    "Answer a few questions and receive your personalised Pass Pilot readiness score, risks and action plan. Created by a DVSA-approved driving instructor.",
  path: "/assessment",
});

const VALUE_BULLETS = [
  "Your readiness score, explained in plain English",
  "A breakdown of your highest-risk driving skills",
  "A focused action plan for your next lessons",
  "An instructor-style coach note",
  "A realistic band for how many more lesson hours you may need before test readiness",
] as const;

export default async function AssessmentPage() {
  const sessionUser = await getServerAuthUser();
  const isConfirmedLearner = Boolean(sessionUser?.emailConfirmedAt);

  let hasLifetimeAccess = false;
  let canStartAssessment = true;
  if (sessionUser?.id && isSupabaseConfigured()) {
    try {
      const access = await getLearnerAccessStatus(sessionUser.id);
      hasLifetimeAccess = access.hasPremiumAccess;
      canStartAssessment = access.canStartAssessment;
    } catch {
      hasLifetimeAccess = false;
    }
  }

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

  return (
    <section className="pb-4">
      <div className="mx-auto w-full max-w-3xl">
      <div className="mb-10 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:mb-12 sm:p-8">
        <h1 className="text-center font-heading text-2xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-left sm:text-3xl">
          {BRAND_CTA.getYourScore}
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-brand-600 sm:text-left sm:text-base">
          {BRAND_CTA.entrySubtext}
        </p>
        <p className="mt-3 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
          {isConfirmedLearner && hasLifetimeAccess ? (
            <>
              Signed in securely · Unlimited Premium reports · {PREMIUM_MEMBER_UI.journey}
            </>
          ) : isConfirmedLearner ? (
            <>Signed in · Subscribe for unlimited reports · {PRICING.subscription.display}/month</>
          ) : (
            <>
              No sign-in needed to start · {PRICING.subscription.display}/month after your free score preview
            </>
          )}
        </p>
        {!isConfirmedLearner ? (
          <p className="mt-2 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
            Already have an account?{" "}
            <Link href="/welcome?role=learner&next=%2Fassessment" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
              Sign in
            </Link>{" "}
            to save reports to your learner dashboard.
          </p>
        ) : !hasLifetimeAccess ? (
          <p className="mt-2 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
            Your reports are saved securely to your account so only you can access them.
          </p>
        ) : (
          <p className="mt-2 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
            {PREMIUM_MEMBER_UI.badge} · {PREMIUM_MEMBER_UI.unlimited}
          </p>
        )}
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
        {!hasLifetimeAccess ? (
          <p className="mt-6 border-t border-brand-100 pt-5 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
            {PRICING.subscription.display}/month · Full Premium report after subscription · Cancel or Graduate Mode
            when you pass
          </p>
        ) : (
          <p className="mt-6 border-t border-brand-100 pt-5 text-center text-xs leading-relaxed text-brand-600 sm:text-left">
            Your next report saves straight to Pass Pilot and opens in full Premium. No per-report checkout.
          </p>
        )}
      </div>
      {!canStartAssessment ? (
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
      ) : (
        <AssessmentForm
          lockedAccountEmail={isConfirmedLearner ? sessionUser?.email : undefined}
          prefilledFullName={isConfirmedLearner ? firstNameHint || undefined : undefined}
          hasLifetimeAccess={hasLifetimeAccess}
        />
      )}
      </div>
    </section>
  );
}
