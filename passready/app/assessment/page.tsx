import type { Metadata } from "next";

import { AssessmentForm } from "@/components/AssessmentForm";
import { Section } from "@/components/Section";
import { LIFETIME_MEMBER_UI, PRICING } from "@/lib/constants";
import { getLifetimeAccessByUserId } from "@/lib/server/repositories/entitlements-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { createSupabaseServerClient, getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Test Ready Score Assessment",
  description:
    "Complete your Test Ready Score assessment, then checkout for your full Premium report: score, risks, next steps, coach note, and lesson-hour band. Created by a DVSA-approved driving instructor.",
};

const VALUE_BULLETS = [
  "Your readiness score, explained in plain English",
  "A breakdown of your highest-risk driving skills",
  "A focused action plan for your next lessons",
  "An instructor-style coach note",
  "A realistic band for how many more lesson hours you may need before test readiness",
] as const;

export default async function AssessmentPage() {
  const sessionUser = await getServerAuthUser();

  let hasLifetimeAccess = false;
  if (sessionUser?.id && isSupabaseConfigured()) {
    try {
      hasLifetimeAccess = await getLifetimeAccessByUserId(sessionUser.id);
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
    <Section className="max-md:bg-transparent bg-brand-50" contentClassName="max-w-3xl">
      <div className="mb-10 rounded-2xl border border-brand-200/70 bg-white p-5 shadow-card ring-1 ring-teal-900/[0.05] sm:mb-12 sm:p-8 sm:shadow-sm sm:ring-0">
        <h1 className="text-center font-heading text-2xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-left sm:text-3xl">
          Start your Test Ready Score assessment
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-brand-600 sm:text-left sm:text-base">
          {hasLifetimeAccess ? (
            <>
              Signed in securely · Unlimited Premium reports · {LIFETIME_MEMBER_UI.journey}
            </>
          ) : (
            <>Secure account · Progress saved · Instant access once checkout clears.</>
          )}
        </p>
        {!hasLifetimeAccess ? (
          <p className="mt-2 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
            Your reports are saved securely to your account so only you can access them.
          </p>
        ) : (
          <p className="mt-2 text-center text-xs leading-relaxed text-brand-500 sm:text-left">
            {LIFETIME_MEMBER_UI.badge} · {LIFETIME_MEMBER_UI.unlimited}
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
            {PRICING.single.display} one-off · {PRICING.lifetime.display} lifetime · Full Premium report after checkout,
            including lesson-hour estimate
          </p>
        ) : (
          <p className="mt-6 border-t border-brand-100 pt-5 text-center text-xs leading-relaxed text-brand-600 sm:text-left">
            Your next report saves straight to Prep2Pass and opens in full Premium—no checkout step on this journey.
          </p>
        )}
      </div>
      <AssessmentForm
        lockedAccountEmail={sessionUser?.email}
        prefilledFullName={firstNameHint || undefined}
        hasLifetimeAccess={hasLifetimeAccess}
      />
    </Section>
  );
}
