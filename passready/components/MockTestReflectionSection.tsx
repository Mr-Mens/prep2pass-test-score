"use client";

import { useEffect } from "react";
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";

import {
  detailsForCategory,
  MOCK_REFLECTION_CATEGORIES,
  type MockReflectionCategoryId,
} from "@/lib/mock-reflection";
import type { AssessmentFormValues } from "@/lib/validation";

type Props = {
  control: Control<AssessmentFormValues>;
  register: UseFormRegister<AssessmentFormValues>;
  setValue: UseFormSetValue<AssessmentFormValues>;
  errors: FieldErrors<AssessmentFormValues>;
};

export function MockTestReflectionSection({ control, register, setValue, errors }: Props) {
  const selectedCategories = useWatch({ control, name: "mockReflectionCategories", defaultValue: [] });
  const selectedDetails = useWatch({ control, name: "mockReflectionDetails", defaultValue: [] });
  const notesValue = useWatch({ control, name: "extraNotes", defaultValue: "" }) ?? "";

  useEffect(() => {
    const categories = selectedCategories ?? [];
    const details = selectedDetails ?? [];
    const allowedDetailIds = new Set(
      categories.flatMap((categoryId) => detailsForCategory(categoryId as MockReflectionCategoryId).map((d) => d.id)),
    );
    const filtered = details.filter((detailId) => allowedDetailIds.has(detailId));
    if (filtered.length !== details.length) {
      setValue("mockReflectionDetails", filtered, { shouldValidate: true });
    }
  }, [selectedCategories, selectedDetails, setValue]);

  const categories = selectedCategories ?? [];

  return (
    <div className="mt-6 space-y-5">
      <Controller
        name="mockReflectionCategories"
        control={control}
        render={({ field }) => (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {MOCK_REFLECTION_CATEGORIES.map((category) => {
              const checked = field.value?.includes(category.id) ?? false;
              return (
                <label
                  key={category.id}
                  className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-brand-200/80 bg-white px-3.5 py-3 text-sm text-brand-900 shadow-sm active:bg-brand-50/80 sm:min-h-0 sm:px-3 sm:py-2.5"
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 rounded border-brand-300 text-teal-700 focus:ring-teal-600 sm:h-4 sm:w-4"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? (field.value ?? []).filter((id) => id !== category.id)
                        : [...(field.value ?? []), category.id];
                      field.onChange(next);
                    }}
                  />
                  <span className="font-medium">{category.label}</span>
                </label>
              );
            })}
          </div>
        )}
      />

      {categories.length > 0 ? (
        <Controller
          name="mockReflectionDetails"
          control={control}
          render={({ field }) => (
            <div className="space-y-4 rounded-xl border border-brand-200/70 bg-brand-50/55 p-4">
              {categories.map((categoryId) => {
                const category = MOCK_REFLECTION_CATEGORIES.find((item) => item.id === categoryId);
                const options = detailsForCategory(categoryId as MockReflectionCategoryId);
                if (!category || options.length === 0) return null;

                return (
                  <div key={categoryId}>
                    <p className="text-xs font-semibold uppercase tracking-[0.09em] text-brand-600">{category.label}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {options.map((option) => {
                        const selected = field.value?.includes(option.id) ?? false;
                        return (
                          <label
                            key={option.id}
                            className={`flex min-h-[42px] cursor-pointer items-center rounded-lg border px-3 py-2 text-sm transition ${
                              selected
                                ? "border-teal-600/35 bg-teal-50 text-teal-900"
                                : "border-brand-200 bg-white text-brand-800"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={selected}
                              onChange={() => {
                                const next = selected
                                  ? (field.value ?? []).filter((id) => id !== option.id)
                                  : [...(field.value ?? []), option.id];
                                field.onChange(next);
                              }}
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        />
      ) : null}

      <div>
        <textarea
          rows={3}
          maxLength={250}
          className="block min-h-[96px] w-full rounded-xl border border-brand-200 bg-white px-4 py-3 text-sm text-brand-950 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 sm:rounded-lg"
          placeholder="e.g. rushed a roundabout, didn’t check mirrors properly, struggled with reverse parking"
          {...register("extraNotes")}
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-xs leading-relaxed text-brand-500">Optional quick context for a more personalised report.</p>
          <p className="shrink-0 text-xs text-brand-500">{notesValue.length}/250</p>
        </div>
        {errors.extraNotes ? <p className="mt-1 text-sm text-red-700">{errors.extraNotes.message}</p> : null}
      </div>
    </div>
  );
}

