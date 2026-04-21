"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";

import { requestCheckoutSession } from "@/lib/api/create-checkout-session";
import { PREMIUM_PRICE, WEAK_AREA_OPTIONS } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";
import { savePendingAssessment } from "@/lib/storage";
import { assessmentSchema, type AssessmentFormValues } from "@/lib/validation";

import { Button } from "./Button";

const fieldClass =
  "mt-1 block min-h-[50px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3.5 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:min-h-0 sm:rounded-lg sm:px-3.5 sm:py-2.5";

const fieldDisabledClass =
  "mt-1 block min-h-[50px] w-full cursor-not-allowed rounded-xl border border-brand-100 bg-brand-50 px-4 py-3.5 text-sm text-brand-500 shadow-inner outline-none sm:min-h-0 sm:rounded-lg sm:px-3.5 sm:py-2.5";

const labelClass = "text-sm font-medium text-brand-900";

const hintClass = "mt-1 text-xs leading-relaxed text-brand-500";

const errorClass = "mt-1 text-sm text-red-700";

const sectionBox =
  "rounded-2xl border border-brand-200/70 bg-white p-5 shadow-card ring-1 ring-black/[0.02] sm:p-7 sm:shadow-sm sm:ring-0";

const CHECKOUT_VALUE_BULLETS = [
  "Your readiness score — explained in plain English",
  "A breakdown of your highest-risk driving skills",
  "A focused action plan for your next lessons",
  "An instructor-style coach note",
] as const;

const checkoutSubmitButtonClass = "w-full";

const TOTAL_STEPS = 6;

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

export function AssessmentForm() {
  const submitLock = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      lessonsTaken: "",
      testBooked: undefined,
      testDate: "",
      mockTestTaken: undefined,
      mockTestResult: "not_taken",
      seriousFaults: "",
      drivingFaults: "",
      confidenceLevel: 6,
      weakAreas: [],
      extraNotes: "",
    },
  });

  const testBooked = watch("testBooked");
  const mockTestTaken = watch("mockTestTaken");
  const confidenceLevel = watch("confidenceLevel");

  const testDateEnabled = testBooked === "yes";

  useEffect(() => {
    if (mockTestTaken === "no") {
      setValue("mockTestResult", "not_taken", { shouldValidate: true });
    }
  }, [mockTestTaken, setValue]);

  useEffect(() => {
    if (testBooked === "no") {
      setValue("testDate", "", { shouldValidate: true });
    }
  }, [testBooked, setValue]);

  const onSubmit: SubmitHandler<AssessmentFormValues> = async (values) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitError(null);
    try {
      const parsed = assessmentSchema.safeParse(values);
      if (!parsed.success) return;

      savePendingAssessment({
        version: 1,
        createdAt: new Date().toISOString(),
        assessment: parsed.data,
      });

      const checkout = await requestCheckoutSession(parsed.data);
      window.location.assign(checkout.url);
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? e.message
          : "We could not start checkout. Check your connection and try again.";
      setSubmitError(message);
    } finally {
      submitLock.current = false;
    }
  };

  return (
    <form
      id="prep2pass-assessment"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 pb-[calc(7.25rem+env(safe-area-inset-bottom))] sm:space-y-10 md:pb-0"
    >
      <fieldset className={sectionBox}>
        <SectionHeader
          step={1}
          title="About you"
          hint="Used on-device for now; checkout email can power delivery of your Premium TestReady Score Report later."
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
              className={fieldClass}
              autoComplete="email"
              inputMode="email"
              {...register("email")}
            />
            <p className={hintClass}>Used for report delivery after checkout — not shared beyond Prep2Pass in this MVP.</p>
            {errors.email ? <p className={errorClass}>{errors.email.message}</p> : null}
          </div>
        </div>
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={2}
          title="Lessons & test plan"
          hint="Rough numbers are fine — consistency matters more than perfect recall."
        />
        <div className="mt-6 grid gap-4 sm:gap-5">
          <div>
            <label className={labelClass} htmlFor="lessonsTaken">
              Approximate full lessons taken
            </label>
            <input
              id="lessonsTaken"
              type="number"
              min={0}
              inputMode="numeric"
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
          title="Mock test"
          hint="Mocks are the closest safe proxy to exam pressure — answer honestly."
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
          step={4}
          title="Recent performance"
          hint="Use one recent lesson or mock that felt typical — not your best-ever day."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
          <div>
            <label className={labelClass} htmlFor="seriousFaults">
              Serious faults
            </label>
            <input
              id="seriousFaults"
              type="number"
              min={0}
              className={fieldClass}
              {...register("seriousFaults")}
            />
            <p className={hintClass}>Must be zero or positive — serious faults weigh heavily in scoring.</p>
            {errors.seriousFaults ? <p className={errorClass}>{errors.seriousFaults.message}</p> : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="drivingFaults">
              Driving faults
            </label>
            <input
              id="drivingFaults"
              type="number"
              min={0}
              className={fieldClass}
              {...register("drivingFaults")}
            />
            <p className={hintClass}>From the same session as serious faults above.</p>
            {errors.drivingFaults ? <p className={errorClass}>{errors.drivingFaults.message}</p> : null}
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-end justify-between gap-4">
              <label className={labelClass} htmlFor="confidenceLevel">
                Confidence going into the test
              </label>
              <p className="text-sm font-semibold text-brand-800">{confidenceLevel ?? "—"}/10</p>
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
            {errors.confidenceLevel ? (
              <p className={errorClass}>{errors.confidenceLevel.message}</p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={5}
          title="Focus areas"
          hint="Tick skills that still wobble under test-like pressure — honesty improves the snapshot."
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
      </fieldset>

      <fieldset className={sectionBox}>
        <SectionHeader
          step={6}
          title="Anything else?"
          hint="Optional context your instructor would find useful — test centre, car type, nerves, etc."
        />
        <div className="mt-6">
          <label className={labelClass} htmlFor="extraNotes">
            Extra notes (optional)
          </label>
          <textarea
            id="extraNotes"
            rows={5}
            className={`${fieldClass} resize-y`}
            placeholder="e.g. test centre, car type, nerves on independent driving, instructor focus this week…"
            {...register("extraNotes")}
          />
          {errors.extraNotes ? <p className={errorClass}>{errors.extraNotes.message}</p> : null}
        </div>
      </fieldset>

      <div className="rounded-2xl border border-brand-200/90 bg-white p-5 shadow-card ring-1 ring-teal-900/[0.06] sm:p-8 sm:shadow-sm sm:ring-0">
        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-500/90 sm:text-left">
          Checkout
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-brand-950 sm:mt-0 sm:text-xl">
          Unlock your TestReady Score
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-brand-700">
          See exactly what could cause you to fail — and how to fix it before your test.
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
        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-t border-brand-100 pt-6">
          <p>
            <span className="text-3xl font-semibold tracking-tight text-brand-950">{PREMIUM_PRICE}</span>
            <span className="ml-2 text-sm font-medium text-brand-600">one-time</span>
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-brand-600">
          Secure payment powered by Stripe · No subscription · No hidden charges
        </p>
        <p className="mt-2 text-xs leading-relaxed text-brand-500/90">
          Most learners book their test too early — this helps you prepare with more clarity.
        </p>
      </div>

      {submitError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 md:order-none"
        >
          {submitError}
        </div>
      ) : null}

      <div className="mt-10 hidden flex-col gap-5 border-t border-brand-100/80 pt-8 md:flex">
        <Button
          type="submit"
          variant="conversion"
          disabled={isSubmitting}
          className={checkoutSubmitButtonClass}
        >
          {isSubmitting ? "Starting checkout…" : "Continue to Secure Checkout"}
        </Button>
        <p className="text-center text-xs leading-relaxed text-brand-500">
          For information only — not a substitute for professional instruction. Your answers generate your
          TestReady Score report after payment.
        </p>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-200/90 bg-white/95 px-4 pt-3 shadow-[0_-8px_32px_rgba(28,34,48,0.08)] backdrop-blur-lg md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {submitError ? (
          <p className="mb-2 text-center text-xs font-medium text-red-800">{submitError}</p>
        ) : (
          <p className="mb-2 text-center text-[11px] leading-snug text-brand-500/90">
            Stripe-secured checkout · One-time payment · No subscription
          </p>
        )}
        <Button
          type="submit"
          variant="conversion"
          disabled={isSubmitting}
          className={checkoutSubmitButtonClass}
        >
          {isSubmitting ? "Starting checkout…" : "Continue to Secure Checkout"}
        </Button>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-brand-400">
          Information only — not a substitute for professional instruction
        </p>
      </div>
    </form>
  );
}
