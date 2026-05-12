"use client";

import type { ChangeEvent } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { computeWeightedSyllabusRatio } from "@/lib/syllabus-coverage";
import { SYLLABUS_TOPIC_CATALOG, SYLLABUS_TOTAL_TOPIC_COUNT } from "@/lib/syllabus-topics";
import type { AssessmentFormValues } from "@/lib/validation";

type Props = {
  control: Control<AssessmentFormValues>;
  errors?: FieldErrors<AssessmentFormValues>;
};

export function SyllabusTopicsSection({ control, errors }: Props) {
  return (
    <Controller
      name="topicsCovered"
      control={control}
      render={({ field }) => {
        const selected = new Set<string>(field.value ?? []);
        const simplePct =
          SYLLABUS_TOTAL_TOPIC_COUNT > 0 ? Math.round((selected.size / SYLLABUS_TOTAL_TOPIC_COUNT) * 100) : 0;
        const weighted = computeWeightedSyllabusRatio(Array.from(selected));

        function toggle(id: string, on: ChangeEvent<HTMLInputElement>) {
          const next = new Set(selected);
          if (on.target.checked) next.add(id);
          else next.delete(id);
          field.onChange(Array.from(next));
        }

        function selectAll(catIdx: number) {
          const items = [...SYLLABUS_TOPIC_CATALOG[catIdx]!.items];
          const next = new Set(selected);
          for (const it of items) next.add(it.id);
          field.onChange(Array.from(next));
        }

        function clearCat(catIdx: number) {
          const drop = new Set(SYLLABUS_TOPIC_CATALOG[catIdx]!.items.map((i) => i.id));
          const next = Array.from(selected).filter((id) => !drop.has(id));
          field.onChange(next);
        }

        return (
          <div className="space-y-5">
            <div className="rounded-2xl border border-teal-200/70 bg-teal-50/50 p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-900">Roadmap breadth</p>
                  <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-brand-950">
                    {selected.size}/{SYLLABUS_TOTAL_TOPIC_COUNT} topics
                  </p>
                  <p className="mt-1 text-xs text-brand-600">
                    Roughly{" "}
                    <span className="font-semibold text-brand-800">{simplePct}%</span> of checklist selected · weighted{" "}
                    <span className="font-semibold text-brand-800">{Math.round(weighted * 100)}%</span> realism signal
                  </p>
                </div>
              </div>
              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-white/70 ring-1 ring-teal-200/50"
                role="progressbar"
                aria-valuenow={simplePct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Syllabus topics selected"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-[width] duration-300"
                  style={{ width: `${Math.min(100, simplePct)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {SYLLABUS_TOPIC_CATALOG.map((cat, catIdx) => {
                const catTotal = cat.items.length;
                const catCov = cat.items.reduce((acc, i) => acc + (selected.has(i.id) ? 1 : 0), 0);
                const catPct = catTotal ? Math.round((catCov / catTotal) * 100) : 0;
                const sectionId = `syllabus-cat-${cat.key}`;
                return (
                  <details
                    key={cat.key}
                    id={sectionId}
                    open={catIdx <= 1}
                    className="group rounded-2xl border border-brand-200/85 bg-white p-4 shadow-sm open:shadow-card sm:p-5"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-2">
                          <span className="font-heading text-base font-semibold text-brand-950">{cat.title}</span>
                          <span className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                            {catCov}/{catTotal} ({catPct}%)
                          </span>
                        </span>
                        <span className="mt-2 block text-sm leading-relaxed text-brand-600">{cat.description}</span>
                      </span>
                      <span
                        aria-hidden
                        className="mt-1 shrink-0 text-brand-400 transition-transform group-open:rotate-180"
                      >
                        ▼
                      </span>
                    </summary>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
                        onClick={() => selectAll(catIdx)}
                      >
                        Select all · {cat.title}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-brand-100 px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50"
                        onClick={() => clearCat(catIdx)}
                      >
                        Clear this group
                      </button>
                    </div>
                    <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {cat.items.map((it) => {
                        const checked = selected.has(it.id);
                        return (
                          <li key={it.id}>
                            <label className="flex min-h-[48px] cursor-pointer gap-3 rounded-xl border border-brand-200/80 bg-brand-50/30 p-3.5 text-sm text-brand-950 shadow-inner has-[:checked]:border-teal-500/65 has-[:checked]:bg-teal-50/60 sm:min-h-0">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-6 w-6 shrink-0 rounded-md border-brand-300 text-teal-700 accent-teal-700 focus:ring-teal-600 sm:h-5 sm:w-5"
                                checked={checked}
                                onChange={(ev) => toggle(it.id, ev)}
                              />
                              <span className="leading-snug">{it.label}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </div>

            {errors?.topicsCovered?.message ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {errors.topicsCovered.message as string}
              </p>
            ) : null}

            <p className="text-xs leading-relaxed text-brand-500">
              Selecting a topic tells us where you&apos;ve spent seat time—it does{" "}
              <span className="font-semibold text-brand-700">not</span> imply top marks on test day yet.
            </p>
          </div>
        );
      }}
    />
  );
}
