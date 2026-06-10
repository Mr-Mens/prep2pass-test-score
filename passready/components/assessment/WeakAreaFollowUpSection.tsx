"use client";

import { useEffect } from "react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";

import type { AssessmentFormValues, WeakAreaDetailEntry } from "@/lib/validation";
import type { WeakAreaId } from "@/lib/constants";
import {
  activeFollowUpCategories,
  pruneWeakAreaDetails,
  questionForFollowUpCategory,
  subtopicsForCategory,
  WEAK_AREA_FOLLOW_UP_CATEGORIES,
  type WeakAreaFollowUpCategoryId,
  type WeakAreaFollowUpSubtopicId,
} from "@/lib/weak-area-follow-up";

type Props = {
  control: Control<AssessmentFormValues>;
  setValue: UseFormSetValue<AssessmentFormValues>;
};

function getEntry(
  details: WeakAreaDetailEntry[] | undefined,
  category: WeakAreaFollowUpCategoryId,
): WeakAreaDetailEntry {
  return details?.find((d) => d.category === category) ?? { category, subtopics: [] };
}

export function WeakAreaFollowUpSection({ control, setValue }: Props) {
  const weakAreas = (useWatch({ control, name: "weakAreas", defaultValue: [] }) ?? []) as WeakAreaId[];
  const confidenceLevel = useWatch({ control, name: "confidenceLevel", defaultValue: 6 }) ?? 6;
  const details = (useWatch({ control, name: "weakAreaDetails", defaultValue: [] }) ??
    []) as WeakAreaDetailEntry[];

  const active = activeFollowUpCategories({ weakAreas, confidenceLevel });

  useEffect(() => {
    const pruned = pruneWeakAreaDetails(details, active);
    if (JSON.stringify(pruned) !== JSON.stringify(details)) {
      setValue("weakAreaDetails", pruned, { shouldValidate: true });
    }
  }, [active, details, setValue]);

  if (active.length === 0) return null;

  const updateEntry = (category: WeakAreaFollowUpCategoryId, next: WeakAreaDetailEntry) => {
    const rest = (details ?? []).filter((d) => d.category !== category);
    const hasContent = next.subtopics.length > 0 || Boolean(next.notes?.trim());
    setValue("weakAreaDetails", hasContent ? [...rest, next] : rest, { shouldValidate: true });
  };

  return (
    <div className="mt-6 rounded-xl border border-teal-200/70 bg-teal-50/40 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-teal-900">Tell us a bit more</p>
      <p className="mt-1 text-sm text-brand-700">Optional. Helps your report focus on what you actually find difficult.</p>

      <div className="mt-5 space-y-5">
        {active.map((categoryId) => {
          const meta = WEAK_AREA_FOLLOW_UP_CATEGORIES.find((c) => c.id === categoryId)!;
          const entry = getEntry(details, categoryId);
          const options = subtopicsForCategory(categoryId);

          return (
            <div key={categoryId} className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm">
              <p className="text-sm font-semibold text-brand-950">{meta.label}</p>
              <p className="mt-1 text-sm text-brand-700">{questionForFollowUpCategory(categoryId)}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {options.map((option) => {
                  const selected = entry.subtopics.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        const subtopics = selected
                          ? entry.subtopics.filter((id) => id !== option.id)
                          : [...entry.subtopics, option.id as WeakAreaFollowUpSubtopicId];
                        updateEntry(categoryId, { ...entry, subtopics });
                      }}
                      className={`min-h-[42px] rounded-lg border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-teal-600/35 bg-teal-50 font-medium text-teal-900"
                          : "border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-brand-500">
                Anything else?
              </label>
              <textarea
                rows={2}
                maxLength={200}
                placeholder="Optional, max 200 characters"
                value={entry.notes ?? ""}
                onChange={(e) => updateEntry(categoryId, { ...entry, notes: e.target.value })}
                className="mt-2 w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
