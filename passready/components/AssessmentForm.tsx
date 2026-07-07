"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";

import { requestAssessmentScore } from "@/lib/api/score-assessment";
import { requestCheckoutSession } from "@/lib/api/create-checkout-session";
import { requestFinaliseReport } from "@/lib/api/finalise-report";
import { BRAND_CTA, LIFETIME_MEMBER_UI, PRICING, PRODUCT, SMART_UI, WEAK_AREA_OPTIONS } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";
import {
  clearAssessmentFormDraft,
  mergeAssessmentFormDefaults,
  saveAssessmentFormDraft,
  shouldPersistAssessmentFormDraft,
} from "@/lib/assessment-form-draft";
import {
  clearPendingAssessment,
  savePendingAssessment,
  saveScoredAssessment,
} from "@/lib/storage";
import {
  assessmentSchema,
  parseAssessmentSubmitValues,
  type AssessmentFormValues,
  type AssessmentPayload,
  type CheckoutPriceTier,
  type ReadinessLabel,
} from "@/lib/validation";

import { Button } from "./Button";
import { PricingTrustBadges } from "@/components/marketing/PricingTrustBadges";
import { MockTestReflectionSection } from "./MockTestReflectionSection";
import { WeakAreaFollowUpSection } from "./assessment/WeakAreaFollowUpSection";
import { SyllabusTopicsSection } from "./assessment/SyllabusTopicsSection";

const fieldClass =
  "mt-1 block min-h-[50px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3.5 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:min-h-0 sm:rounded-lg sm:px-3.5 sm:py-2.5";

const fieldDisabledClass =
  "mt-1 block min-h-[50px] w-full cursor-not-allowed rounded-xl border border-brand-100 bg-brand-50 px-4 py-3.5 text-sm text-brand-500 shadow-inner outline-none sm:min-h-0 sm:rounded-lg sm:px-3.5 sm:py-2.5";

const labelClass = "text-sm font-medium text-brand-900";

const hintClass = "mt-1 text-xs leading-relaxed text-brand-500";

const errorClass = "mt-1 text-sm text-red-700";

const sectionBox =
  "rounded-2xl border border-brand-200/70 bg-white p-5 shadow-card ring-1 ring-black/[0.02] sm:p-7 sm:shadow-sm sm:ring-0";

const FREE_LOCKED_SECTIONS = [
  { title: SMART_UI.report, lines: ["Your complete Premium write-up with coach note and syllabus context."] },
  { title: SMART_UI.debrief, lines: ["An instructor-style summary of how you drive and what to tighten next."] },
  { title: "Test risks", lines: ["Junction timing and late observation patterns that could cause a fail."] },
  { title: SMART_UI.recommendations, lines: ["Two high-frequency drills and a structured mock reset before your next check."] },
  { title: "Guided hours estimate", lines: ["A realistic band for how many more lesson hours you may need."] },
  { title: "Learning roadmap", lines: ["Syllabus topics covered versus still to practise on your journey."] },
  { title: SMART_UI.insights, lines: ["Score arc and trends across saved Premium checkpoints."] },
  { title: "Lesson reflections", lines: ["Post-lesson logs that feed progress insights after each session."] },
  { title: "Lesson history", lines: ["Upcoming and completed lessons with your instructor."] },
  { title: "Parent sharing", lines: ["Let a parent or supervisor view reports and support private practice."] },
] as const;

const CHECKOUT_VALUE_BULLETS = [
  `${SMART_UI.report}, explained in plain English`,
  "A roadmap of syllabus topics touched versus still to practise",
  "A breakdown of your highest-priority driving skills",
  `A focused action plan with your ${SMART_UI.recommendations.toLowerCase()}`,
  `An instructor-style ${SMART_UI.debrief.toLowerCase()}`,
  "A realistic band for how many more lesson hours you may need across your Learning Journey",
] as const;

const checkoutSubmitButtonClass = "w-full";

const TOTAL_STEPS = 7;

type ScorePreview = {
  assessment: AssessmentPayload;
  readinessScore: number;
  readinessLabel: ReadinessLabel;
};

function readinessBadgeClass(label: ReadinessLabel) {
  if (label === "Needs More Time") return "bg-red-50 text-red-900 ring-red-200";
  if (label === "Building Consistency") return "bg-amber-50 text-amber-950 ring-amber-200";
  if (label === "Nearly Test Ready") return "bg-sky-50 text-sky-950 ring-sky-200";
  return "bg-teal-50 text-teal-950 ring-teal-200";
}

function scorePreviewLine(label: ReadinessLabel): string {
  if (label === "Needs More Time")
    return "Core safety themes need more seat time before a test date feels responsible.";
  if (label === "Building Consistency")
    return "Patterns are forming; keep drilling the same routines until they hold under pressure.";
  if (label === "Nearly Test Ready")
    return "You are close; tighten observations and mock pressure so test day feels familiar.";
  return "Strong baseline; polish edge cases and keep one refresher mock before test week.";
}

function LockedPreviewBlock({
  title,
  lines,
}: {
  title: string;
  lines: readonly string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-brand-200/80 bg-brand-50/65 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-900">{title}</p>
        <span className="inline-flex items-center rounded-full border border-brand-300/80 bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-600">
          Locked
        </span>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-brand-200/70 bg-white/60 px-3 py-3">
        <div className="space-y-2 opacity-35 blur-[4px] select-none" aria-hidden>
          {lines.map((line) => (
            <p key={line} className="text-sm leading-relaxed text-brand-700">
              {line}
            </p>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-white/35 backdrop-blur-[3px]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/95 via-white/80 to-transparent" />
      </div>
    </div>
  );
}

function SectionHeader({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <legend className="block w-full">
      <div className="flex flex-col gap-2 border-b border-brand-200/70 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <span className="font-heading text-lg font-semibold leading-snug tracking-tight text-brand-950 sm:text-xl">
          {title}
        </span>
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-500">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>
      {hint ? <p className={`${hintClass} mt-3 max-w-prose`}>{hint}</p> : null}
    </legend>
  );
}

async function fetchLifetimeAccessFromSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
    if (!res.ok) return false;
    const raw = (await res.json()) as { user?: { lifetimeAccess?: boolean; id?: string } | null };
    return Boolean(raw.user?.id && raw.user.lifetimeAccess);
  } catch {
    return false;
  }
}

export type AssessmentFormProps = {
  /** When set (signed-in Pass Pilot account email), email is read-only */
  lockedAccountEmail?: string;
  prefilledFullName?: string;
  /** Server hint: skips payment UI when true; `/api/checkout/create-session` re-verifies before finalising */
  hasLifetimeAccess?: boolean;
  /** When the free assessment was already used, show the post-assessment screen instead of the form */
  initialPreview?: ScorePreview | null;
  /** Lift the mobile submit bar above LearnerChrome bottom tabs */
  stackAboveMobileNav?: boolean;
};

export function AssessmentForm({
  lockedAccountEmail,
  prefilledFullName,
  hasLifetimeAccess = false,
  initialPreview = null,
  stackAboveMobileNav = false,
}: AssessmentFormProps = {}) {
  const router = useRouter();
  const submitLock = useRef(false);
  const initialDefaults = useMemo(
    () => mergeAssessmentFormDefaults({ prefilledFullName, lockedAccountEmail }),
    // Restore saved draft once on mount; account props override name/email when signed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScorePreview | null>(initialPreview);
  const [unlocking, setUnlocking] = useState(false);
  /** True while scoring is done and we are finalising a lifetime report (full Premium, no preview step). */
  const [premiumBuild, setPremiumBuild] = useState(false);
  const [lifetimeVerifiedFromSession, setLifetimeVerifiedFromSession] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<CheckoutPriceTier>("subscription");
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: initialDefaults,
  });

  const formValues = watch();
  const formValuesRef = useRef(formValues);
  formValuesRef.current = formValues;

  const flushFormDraft = useCallback(() => {
    const values = formValuesRef.current;
    if (shouldPersistAssessmentFormDraft(values)) {
      saveAssessmentFormDraft(values);
    }
  }, []);

  const testBooked = watch("testBooked");
  const mockTestTaken = watch("mockTestTaken");
  const confidenceLevel = watch("confidenceLevel");
  const showLifetimeAssessmentChrome = Boolean(lockedAccountEmail && hasLifetimeAccess);

  const testDateEnabled = testBooked === "yes";

  const runCheckoutOrFinalise = useCallback(
    async (
      assessment: AssessmentPayload,
      tier: CheckoutPriceTier,
    ): Promise<{ kind: "finalised" } | { kind: "stripe"; url: string }> => {
      const checkout = await requestCheckoutSession(assessment, tier);
      if (checkout.skipCheckout) {
        const finalised = await requestFinaliseReport({
          entitlementToken: checkout.entitlementToken,
          assessment,
        });
        saveScoredAssessment({
          version: 2,
          submittedAt: new Date().toISOString(),
          assessment: finalised.assessment,
          result: finalised.result,
        });
        clearPendingAssessment();
        clearAssessmentFormDraft();
        router.replace(finalised.persisted ? `/reports/${finalised.reportId}` : "/results");
        return { kind: "finalised" };
      }
      return { kind: "stripe", url: checkout.url };
    },
    [router],
  );

  useEffect(() => {
    if (preview) return;
    const timer = window.setTimeout(() => {
      flushFormDraft();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [formValues, preview, flushFormDraft]);

  useEffect(() => {
    if (preview) return;
    const onPageHide = () => flushFormDraft();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      flushFormDraft();
    };
  }, [preview, flushFormDraft]);

  useEffect(() => {
    if (mockTestTaken === "no") {
      setValue("mockTestResult", "not_taken", { shouldValidate: true });
      setValue("seriousFaults", "", { shouldValidate: true });
      setValue("drivingFaults", "", { shouldValidate: true });
    }
  }, [mockTestTaken, setValue]);

  useEffect(() => {
    if (testBooked === "no") {
      setValue("testDate", "", { shouldValidate: true });
    }
  }, [testBooked, setValue]);

  useEffect(() => {
    if (!preview) return;
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("checkout");
    if (q === "lifetime") setCheckoutTier("lifetime");
  }, [preview]);

  const onSubmit: SubmitHandler<AssessmentFormValues> = async (values) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitError(null);
    try {
      const parsed = parseAssessmentSubmitValues(values);
      if (!parsed.success) {
        setSubmitError(parsed.message);
        return;
      }
      const assessment = parsed.data;

      savePendingAssessment({
        version: 1,
        createdAt: new Date().toISOString(),
        assessment,
      });

      const scored = await requestAssessmentScore(assessment);

      let hasUnlimitedReports = Boolean(hasLifetimeAccess);
      if (lockedAccountEmail && !hasUnlimitedReports) {
        hasUnlimitedReports = await fetchLifetimeAccessFromSession();
        if (hasUnlimitedReports) setLifetimeVerifiedFromSession(true);
      }

      if (lockedAccountEmail && hasUnlimitedReports) {
        setPremiumBuild(true);
        try {
          const out = await runCheckoutOrFinalise(assessment, "single");
          if (out.kind === "finalised") {
            return;
          }
          window.location.assign(out.url);
          return;
        } catch (e) {
          const message =
            e instanceof ApiRequestError
              ? e.message
              : "We could not save your full report. Try again or use the unlock step below.";
          setSubmitError(message);
        } finally {
          setPremiumBuild(false);
        }
      }

      setPreview({
        assessment,
        readinessScore: scored.result.readinessScore,
        readinessLabel: scored.result.readinessLabel,
      });
      clearAssessmentFormDraft();
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? e.message
          : "We could not score your assessment. Check your connection and try again.";
      setSubmitError(message);
    } finally {
      submitLock.current = false;
    }
  };

  async function onUnlockFullReport() {
    if (!preview || submitLock.current) return;
    submitLock.current = true;
    setUnlocking(true);
    setSubmitError(null);
    try {
      if (preview.assessment) {
        const out = await runCheckoutOrFinalise(preview.assessment, "subscription");
        if (out.kind === "stripe") {
          window.location.assign(out.url);
        }
        return;
      }

      const res = await fetch("/api/subscription/create-checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/checkout/success" }),
      });
      const json = (await res.json()) as { success?: boolean; url?: string; error?: { message?: string } | string };
      if (!json.success || !json.url) {
        const message =
          typeof json.error === "string"
            ? json.error
            : (json.error as { message?: string } | undefined)?.message ?? "Could not start checkout.";
        setSubmitError(message);
        return;
      }
      window.location.assign(json.url);
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? e.message
          : "We could not start checkout. Check your connection and try again.";
      setSubmitError(message);
    } finally {
      submitLock.current = false;
      setUnlocking(false);
    }
  }

  const mobileScrollPadClass = stackAboveMobileNav
    ? "pb-4"
    : "pb-[calc(7.25rem+env(safe-area-inset-bottom))]";
  const mobileStickyBarClass = stackAboveMobileNav ? "" : "bottom-0";
  const mobileFormShellClass = stackAboveMobileNav
    ? "flex max-h-[min(100%,calc(100dvh-8rem-env(safe-area-inset-bottom)))] flex-col overflow-hidden md:block md:max-h-none"
    : "";
  const mobileFieldsScrollClass = stackAboveMobileNav
    ? "min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] md:contents md:overflow-visible"
    : "contents";

  function renderMobileSubmitBar() {
    return (
      <div
        className={
          stackAboveMobileNav
            ? "shrink-0 border-t border-brand-200/90 bg-white pt-3 md:hidden"
            : `fixed inset-x-0 z-40 max-w-full overflow-x-hidden border-t border-brand-200/90 bg-white/95 px-4 pt-3 shadow-[0_-8px_32px_rgba(28,34,48,0.08)] backdrop-blur-lg md:hidden ${mobileStickyBarClass}`
        }
        style={{
          paddingBottom: stackAboveMobileNav
            ? "0.75rem"
            : "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        {submitError ? (
          <p className="mb-2 text-center text-xs font-medium text-red-800">{submitError}</p>
        ) : (
          !showLifetimeAssessmentChrome && (
            <p className="mb-2 text-center text-[11px] leading-snug text-brand-500/90">
              {PRICING.subscription.display}/month · Secure Stripe checkout · Cancel anytime
            </p>
          )
        )}
        <Button
          type="submit"
          variant="conversion"
          disabled={isSubmitting}
          className={checkoutSubmitButtonClass}
        >
          {isSubmitting ? (premiumBuild ? `Building your ${SMART_UI.report.toLowerCase()}…` : "Scoring...") : BRAND_CTA.getMyScore}
        </Button>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-brand-400">
          Information only, not a substitute for professional instruction
          {showLifetimeAssessmentChrome ? " · Saves to your account automatically" : null}
        </p>
      </div>
    );
  }

  function renderPostAssessmentPreview() {
    if (!preview) return null;

    return (
      <div className={`space-y-6 sm:space-y-8 md:pb-0 ${mobileScrollPadClass}`}>
        <section className="rounded-2xl border border-brand-200/80 bg-white p-5 shadow-card ring-1 ring-black/[0.02] sm:p-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.13em] text-brand-500 sm:text-left">
            {PRODUCT.score}
          </p>
          <div className="mt-5 flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
            <p className="text-6xl font-semibold tracking-tight text-brand-950 tabular-nums">{preview.readinessScore}</p>
            <span
              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset ${readinessBadgeClass(
                preview.readinessLabel,
              )}`}
            >
              {preview.readinessLabel}
            </span>
            <p className="max-w-prose text-sm leading-relaxed text-brand-700">
              {scorePreviewLine(preview.readinessLabel)}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-200/80 bg-white p-5 shadow-card ring-1 ring-black/[0.02] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-brand-500">Premium features</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FREE_LOCKED_SECTIONS.map((section) => (
              <LockedPreviewBlock key={section.title} title={section.title} lines={section.lines} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-200/90 bg-white p-5 shadow-card ring-1 ring-teal-900/[0.06] sm:p-8">
          {lockedAccountEmail && (hasLifetimeAccess || lifetimeVerifiedFromSession) ? (
            <>
              <h2 className="text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">
                Save your full {SMART_UI.report}
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-700">
                Your active subscription includes unlimited {SMART_UI.reports.toLowerCase()}. We attach this assessment to your
                timeline with no extra payment per report.
              </p>
              {submitError ? (
                <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {submitError}
                </p>
              ) : null}
              <div className="mt-6">
                <Button
                  type="button"
                  variant="conversion"
                  disabled={unlocking}
                  className="w-full min-h-[52px] sm:min-w-[18rem]"
                  onClick={() => void onUnlockFullReport()}
                >
                  {unlocking ? "Saving your report…" : `Save full ${SMART_UI.report}`}
                </Button>
                <p className="mt-3 text-xs leading-relaxed text-brand-600">
                  No checkout step. Confirmed again on the server before we store your report.
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold tracking-tight text-brand-950 sm:text-xl">
                Unlock your full {PRODUCT.score} experience
              </h2>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-700">{PRICING.subscription.trialMessage}</p>
              <p className="mt-2 max-w-prose text-xs font-medium leading-relaxed text-brand-600">
                {PRICING.subscription.trialDays}-day free trial, then {PRICING.subscription.display}/month. Cancel anytime
                · Graduate Mode stops billing when you pass.
              </p>
              {submitError ? (
                <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                  {submitError}
                </p>
              ) : null}
              <div className="mt-6">
                <Button
                  type="button"
                  variant="conversion"
                  disabled={unlocking}
                  className="w-full min-h-[52px] sm:min-w-[18rem]"
                  onClick={() => void onUnlockFullReport()}
                >
                  {unlocking ? "Please wait…" : PRICING.subscription.trialCta}
                </Button>
                <p className="mt-3 text-xs leading-relaxed text-brand-600">
                  Secure Stripe checkout · Dashboard, lessons, reflections, and unlimited assessments included
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  if (preview) {
    return renderPostAssessmentPreview();
  }

  return (
    <form
      id="pass-pilot-assessment"
      onSubmit={handleSubmit(onSubmit, () => {
        setSubmitError("Please check the highlighted fields above and try again.");
      })}
      className={`min-w-0 overflow-x-hidden sm:space-y-10 md:pb-0 ${mobileFormShellClass} ${stackAboveMobileNav ? "" : `space-y-6 ${mobileScrollPadClass}`}`}
    >
      <div className={mobileFieldsScrollClass}>
      <fieldset className={sectionBox}>
        <SectionHeader
          step={1}
          title="About you"
          hint="We use this to personalise your report and keep it saved securely to your Pass Pilot account."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div className="sm:col-span-1">
            <label className={labelClass} htmlFor="fullName">
              Full name
            </label>
            <input id="fullName" className={fieldClass} autoComplete="name" {...register("fullName")} />
            {errors.fullName ? <p className={errorClass}>{errors.fullName.message}</p> : null}
          </div>
          <div className="sm:col-span-1">
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={lockedAccountEmail ? fieldDisabledClass : fieldClass}
              autoComplete="email"
              inputMode="email"
              readOnly={Boolean(lockedAccountEmail)}
              {...register("email")}
            />
            <p className={hintClass}>
              {lockedAccountEmail
                ? "This is your Pass Pilot account email. It stays on every report you save."
                : "Used for secure storage on your Pass Pilot account after checkout."}
            </p>
            {errors.email ? <p className={errorClass}>{errors.email.message}</p> : null}
          </div>
        </div>
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={2}
          title="Lessons & test plan"
          hint="Rough numbers are fine. Consistency matters more than perfect recall."
        />
        <div className="mt-6 grid gap-4 sm:gap-5">
          <div>
            <label className={labelClass} htmlFor="lessonsTaken">
              Approximate full lessons taken
            </label>
            <input
              id="lessonsTaken"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={fieldClass}
              {...register("lessonsTaken")}
            />
            <p className={hintClass}>Count full sessions rather than short top-ups.</p>
            {errors.lessonsTaken ? <p className={errorClass}>{errors.lessonsTaken.message}</p> : null}
          </div>

          <div>
            <p className={labelClass}>Is your practical test booked?</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              {(["yes", "no"] as const).map((v) => (
                <label
                  key={v}
                  className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-brand-100 bg-white px-3.5 py-2.5 text-sm text-brand-800 shadow-sm has-[:checked]:border-teal-600/35 has-[:checked]:bg-teal-50/50 sm:min-h-0 sm:px-3 sm:py-2"
                >
                  <input type="radio" value={v} className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" {...register("testBooked")} />
                  <span className="capitalize">{v}</span>
                </label>
              ))}
            </div>
            {errors.testBooked ? <p className={errorClass}>{errors.testBooked.message}</p> : null}
          </div>

          <div>
            <label className={`${labelClass} ${!testDateEnabled ? "text-brand-600" : ""}`} htmlFor="testDate">
              Test date
            </label>
            <input
              id="testDate"
              type="date"
              disabled={!testDateEnabled}
              className={testDateEnabled ? fieldClass : fieldDisabledClass}
              {...register("testDate")}
            />
            <p className={hintClass}>
              {testDateEnabled
                ? "Choose your DVSA test date so we can factor in proximity to test week."
                : "Enable this by selecting “Yes” above if your test is already booked."}
            </p>
            {errors.testDate ? <p className={errorClass}>{errors.testDate.message}</p> : null}
          </div>
        </div>
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={3}
          title="Topics you've covered so far"
          hint="Select the areas you've already learned or practised during lessons or private practice. Honesty narrows readiness realism. This isn't a test grade on each skill."
        />
        <SyllabusTopicsSection control={control} errors={errors} />
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={4}
          title="Mock test"
          hint="Mocks are the closest safe proxy to exam pressure, so answer honestly."
        />
        <div className="mt-6 grid gap-4 sm:gap-5">
          <div>
            <p className={labelClass}>Have you taken a mock driving test?</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              {(["yes", "no"] as const).map((v) => (
                <label
                  key={v}
                  className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-brand-100 bg-white px-3.5 py-2.5 text-sm text-brand-800 shadow-sm has-[:checked]:border-teal-600/35 has-[:checked]:bg-teal-50/50 sm:min-h-0 sm:px-3 sm:py-2"
                >
                  <input type="radio" value={v} className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" {...register("mockTestTaken")} />
                  <span className="capitalize">{v}</span>
                </label>
              ))}
            </div>
            {errors.mockTestTaken ? <p className={errorClass}>{errors.mockTestTaken.message}</p> : null}
          </div>

          <div>
            <p className={`${labelClass} ${mockTestTaken !== "yes" ? "text-brand-600" : ""}`}>Mock test result</p>
            <p className={hintClass}>
              {mockTestTaken === "yes"
                ? "Select pass or fail from your most representative mock."
                : mockTestTaken === "no"
                  ? "Locked to “Not taken” until you select “Yes” above."
                  : "Select whether you have taken a mock first."}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {(
                [
                  { value: "pass", label: "Pass" },
                  { value: "fail", label: "Fail" },
                  { value: "not_taken", label: "Not taken" },
                ] as const
              ).map((opt) => {
                const disabled =
                  mockTestTaken === undefined ||
                  (mockTestTaken === "no" && opt.value !== "not_taken") ||
                  (mockTestTaken === "yes" && opt.value === "not_taken");
                return (
                  <label
                    key={opt.value}
                    className={`flex min-h-[48px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm shadow-sm sm:min-h-0 sm:px-3 sm:py-2 ${
                      disabled
                        ? "cursor-not-allowed border-brand-50 bg-brand-50/50 text-brand-400"
                        : "cursor-pointer border-brand-100 bg-white text-brand-800 has-[:checked]:border-teal-600/35 has-[:checked]:bg-teal-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="h-5 w-5 shrink-0 sm:h-4 sm:w-4"
                      disabled={disabled}
                      {...register("mockTestResult")}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.mockTestResult ? <p className={errorClass}>{errors.mockTestResult.message}</p> : null}
          </div>
        </div>
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={5}
          title="Tell us what happened in your mock test (optional)"
          hint="This helps personalise your report. Keep it quick."
        />
        <MockTestReflectionSection control={control} register={register} setValue={setValue} errors={errors} />
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={6}
          title="Recent performance"
          hint={
            mockTestTaken === "yes"
              ? "Use one recent mock or marked lesson that felt typical, not your best-ever day."
              : "Fault counts apply after a mock or marked session. If you have not done a mock yet, skip this section."
          }
        />
        {mockTestTaken === "yes" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div>
            <label className={labelClass} htmlFor="seriousFaults">
              Serious faults <span className="font-normal text-brand-500">(optional)</span>
            </label>
            <input
              id="seriousFaults"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className={fieldClass}
              placeholder="Leave blank if you do not have a count"
              {...register("seriousFaults")}
            />
            <p className={hintClass}>
              From your mock or a recent marked session if you have it. Leave blank otherwise.
            </p>
            {errors.seriousFaults ? <p className={errorClass}>{errors.seriousFaults.message}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="drivingFaults">
              Driving faults <span className="font-normal text-brand-500">(optional)</span>
            </label>
            <input
              id="drivingFaults"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className={fieldClass}
              placeholder="Leave blank if you do not have a count"
              {...register("drivingFaults")}
            />
            <p className={hintClass}>Same session as serious faults, when you have both counts.</p>
            {errors.drivingFaults ? <p className={errorClass}>{errors.drivingFaults.message}</p> : null}
          </div>
        </div>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-brand-600">
            You said you have not done a mock yet, so we will not use fault counts in your report. Book a mock with your
            instructor when you are ready.
          </p>
        )}
        <div className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <label className={labelClass} htmlFor="confidenceLevel">
              Confidence going into the test
            </label>
            <p className="text-sm font-semibold text-brand-800">{confidenceLevel ?? "-"}/10</p>
          </div>
          <input
            id="confidenceLevel"
            type="range"
            min={1}
            max={10}
            className="mt-3 w-full accent-teal-700"
            {...register("confidenceLevel", { valueAsNumber: true })}
          />
          <p className={hintClass}>1 = very uneasy, 10 = calm and consistent under pressure.</p>
          {errors.confidenceLevel ? <p className={errorClass}>{errors.confidenceLevel.message}</p> : null}
        </div>
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={7}
          title="Focus areas"
          hint="Tick skills that still wobble under test-like pressure. Honesty improves the snapshot."
        />

        <Controller
          name="weakAreas"
          control={control}
          render={({ field }) => (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              {WEAK_AREA_OPTIONS.map((opt) => {
                const checked = field.value?.includes(opt.id) ?? false;
                return (
                  <label
                    key={opt.id}
                    className="flex min-h-[52px] cursor-pointer gap-3 rounded-xl border border-brand-200/80 bg-white p-3.5 text-sm text-brand-900 shadow-sm active:bg-brand-50/80 sm:min-h-0 sm:border-brand-100 sm:bg-brand-50/40 sm:shadow-none sm:hover:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-brand-300 text-teal-700 focus:ring-teal-600 sm:h-4 sm:w-4"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? (field.value ?? []).filter((x) => x !== opt.id)
                          : [...(field.value ?? []), opt.id];
                        field.onChange(next);
                      }}
                    />
                    <span>
                      <span className="font-medium">{opt.label}</span>
                      <span className="mt-1 block text-xs text-brand-600">{opt.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.weakAreas ? <p className={errorClass}>{errors.weakAreas.message as string}</p> : null}

        <WeakAreaFollowUpSection control={control} setValue={setValue} />
      </fieldset>

      <div className="rounded-2xl border border-brand-200/90 bg-white p-5 shadow-card ring-1 ring-teal-900/[0.06] sm:p-8 sm:shadow-sm sm:ring-0">
        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-500/90 sm:text-left">
          {showLifetimeAssessmentChrome ? LIFETIME_MEMBER_UI.journeyInsights : "Checkout"}
        </p>
        {showLifetimeAssessmentChrome ? (
          <>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-brand-950 sm:mt-0 sm:text-xl">
              {LIFETIME_MEMBER_UI.badge}
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-700">{LIFETIME_MEMBER_UI.unlimited}</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-brand-600">{LIFETIME_MEMBER_UI.progressRhythm}</p>
            <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-brand-800">
              {CHECKOUT_VALUE_BULLETS.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-brand-950 sm:mt-0 sm:text-xl">
              Unlock your Test Ready Score
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-700">
              See exactly what could cause you to fail, and how to fix it before your test. You also get a realistic band for
              how many more lesson hours you may need to keep building skills, so you can plan with your ADI.
            </p>
            <p className="mt-2 max-w-prose text-xs font-medium leading-relaxed text-brand-600">
              Everything listed below is included in your {SMART_UI.report.toLowerCase()} once checkout completes (not in the free preview).
            </p>
            <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-brand-800">
              {CHECKOUT_VALUE_BULLETS.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 font-semibold text-teal-700" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">{PRICING.subscription.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-950">
                {PRICING.subscription.display}
                <span className="ml-2 text-lg font-medium text-brand-500">/ month</span>
              </p>
              <p className="mt-2 text-sm font-medium text-brand-700">Until you pass or cancel</p>
              <p className="mt-2 text-xs leading-relaxed text-brand-600">{PRICING.subscription.hint}</p>
              <PricingTrustBadges className="mt-4" />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-brand-600">
              Secure Stripe checkout · Cancel anytime · Graduate Mode stops billing when you pass
            </p>
          </>
        )}
        {!showLifetimeAssessmentChrome ? null : (
          <p className="mt-6 border-t border-brand-100 pt-6 text-xs leading-relaxed text-brand-500">
            Full Premium detail loads as soon as we finish scoring. Already included in your membership.
          </p>
        )}
        {!showLifetimeAssessmentChrome ? (
          <p className="mt-2 text-xs leading-relaxed text-brand-500/90">
            Most learners book their test too early. This helps you prepare with more clarity.
          </p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-brand-500/90">
            Take your time answering; clarity here makes the roadmap later feel steadier between lessons.
          </p>
        )}
      </div>

      {submitError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 md:order-none"
        >
          {submitError}
        </div>
      ) : null}
      </div>

      <div className="mt-10 hidden flex-col gap-5 border-t border-brand-100/80 pt-8 md:flex">
        <Button
          type="submit"
          variant="conversion"
          disabled={isSubmitting}
          className={checkoutSubmitButtonClass}
        >
          {isSubmitting ? (premiumBuild ? `Building your ${SMART_UI.report.toLowerCase()}…` : "Scoring...") : BRAND_CTA.getMyScore}
        </Button>
        <p className="text-center text-xs leading-relaxed text-brand-500">
          For information only, not a substitute for professional instruction.
          {showLifetimeAssessmentChrome
            ? ` Your ${SMART_UI.report.toLowerCase()} attaches to Pass Pilot as part of lifetime access.`
            : " Your answers generate your Test Ready Score Report after payment."}
        </p>
      </div>

      {renderMobileSubmitBar()}
    </form>
  );
}
