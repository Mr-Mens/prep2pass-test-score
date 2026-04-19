"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";

import { requestCheckoutSession } from "@/lib/api/create-checkout-session";
import { WEAK_AREA_OPTIONS } from "@/lib/constants";
import { ApiRequestError } from "@/lib/errors";
import { savePendingAssessment } from "@/lib/storage";
import { assessmentSchema, type AssessmentFormValues } from "@/lib/validation";

import { Button } from "./Button";

const fieldClass =
  "mt-1 block w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200";

const fieldDisabledClass =
  "mt-1 block w-full cursor-not-allowed rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-500 shadow-inner outline-none";

const labelClass = "text-sm font-medium text-brand-900";

const hintClass = "mt-1 text-xs leading-relaxed text-brand-500";

const errorClass = "mt-1 text-sm text-red-700";

const sectionBox = "rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6";

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
    <legend className="block w-full border-b border-brand-100 pb-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
        Step {step} of {TOTAL_STEPS}
      </span>
      <span className="mt-1 block text-base font-semibold text-brand-950">{title}</span>
      {hint ? <span className={`${hintClass} mt-2 block max-w-prose`}>{hint}</span> : null}
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className={sectionBox}>
        <SectionHeader
          step={1}
          title="About you"
          hint="Used on-device for now; checkout email can power delivery of your Premium TestReady Score Report later."
        />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
        <div className="mt-5 grid gap-5">
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
            <div className="mt-2 flex flex-wrap gap-4">
              {(["yes", "no"] as const).map((v) => (
                <label key={v} className="inline-flex items-center gap-2 text-sm text-brand-800">
                  <input type="radio" value={v} className="h-4 w-4" {...register("testBooked")} />
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
        <div className="mt-5 grid gap-5">
          <div>
            <p className={labelClass}>Have you taken a mock driving test?</p>
            <div className="mt-2 flex flex-wrap gap-4">
              {(["yes", "no"] as const).map((v) => (
                <label key={v} className="inline-flex items-center gap-2 text-sm text-brand-800">
                  <input type="radio" value={v} className="h-4 w-4" {...register("mockTestTaken")} />
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
                    className={`inline-flex items-center gap-2 text-sm ${
                      disabled ? "cursor-not-allowed text-brand-400" : "text-brand-800"
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="h-4 w-4"
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
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {WEAK_AREA_OPTIONS.map((opt) => {
                const checked = field.value?.includes(opt.id) ?? false;
                return (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-sm text-brand-900 hover:bg-brand-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-brand-300 text-teal-700 focus:ring-teal-600"
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
        <div className="mt-5">
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

      {submitError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-brand-500">
          By continuing you agree this assessment is for information only — not professional driving
          instruction. Secure checkout unlocks your Premium TestReady Score Report.
        </p>
        <Button type="submit" disabled={isSubmitting} className="w-full px-6 py-3 text-base sm:w-auto">
          {isSubmitting ? "Starting checkout…" : "Continue to Checkout"}
        </Button>
      </div>
    </form>
  );
}
