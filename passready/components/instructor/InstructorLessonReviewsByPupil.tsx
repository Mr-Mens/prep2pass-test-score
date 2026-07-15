"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LESSON_TYPE_LABELS } from "@/lib/lesson-reflections/constants";
import { reflectionConfidenceDelta } from "@/lib/lesson-reflections/confidence";
import type { LessonReflectionRow } from "@/lib/lesson-reflections/types";
import { formatIsoDateUk } from "@/lib/formatting";

export type ReviewPupilOption = {
  pupilId: string;
  learnerUserId: string | null;
  name: string;
};

type ReflectionRow = LessonReflectionRow & { learner_name?: string | null };

type Props = {
  pupils: ReviewPupilOption[];
  reflections: ReflectionRow[];
};

type PupilGroup = {
  key: string;
  name: string;
  reflections: ReflectionRow[];
};

function buildGroups(pupils: ReviewPupilOption[], reflections: ReflectionRow[]): PupilGroup[] {
  const byLearner = new Map<string, ReflectionRow[]>();
  for (const row of reflections) {
    const list = byLearner.get(row.user_id) ?? [];
    list.push(row);
    byLearner.set(row.user_id, list);
  }

  const groups: PupilGroup[] = pupils.map((pupil) => {
    const reflectionsForPupil = pupil.learnerUserId ? (byLearner.get(pupil.learnerUserId) ?? []) : [];
    if (pupil.learnerUserId) byLearner.delete(pupil.learnerUserId);
    return {
      key: pupil.pupilId,
      name: pupil.name,
      reflections: reflectionsForPupil,
    };
  });

  // Reflections from linked accounts that are no longer in the pupil list.
  for (const [learnerUserId, orphanRows] of Array.from(byLearner.entries())) {
    groups.push({
      key: `orphan-${learnerUserId}`,
      name: orphanRows[0]?.learner_name?.trim() || "Former pupil",
      reflections: orphanRows,
    });
  }

  return groups.sort((a, b) => {
    if (b.reflections.length !== a.reflections.length) return b.reflections.length - a.reflections.length;
    return a.name.localeCompare(b.name);
  });
}

export function InstructorLessonReviewsByPupil({ pupils, reflections }: Props) {
  const groups = useMemo(() => buildGroups(pupils, reflections), [pupils, reflections]);
  const defaultOpen = groups.find((g) => g.reflections.length > 0)?.key ?? null;
  const [openKey, setOpenKey] = useState<string | null>(defaultOpen);

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-5 py-8 text-center text-sm text-brand-600">
        No linked pupils yet. Invite a pupil, then mark lessons complete so they can submit reflections.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {groups.map((group) => {
        const open = openKey === group.key;
        const count = group.reflections.length;
        return (
          <li key={group.key} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setOpenKey(open ? null : group.key)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-brand-50/50"
              aria-expanded={open}
            >
              <div className="min-w-0">
                <p className="truncate font-heading text-base font-semibold text-brand-950">{group.name}</p>
                <p className="mt-0.5 text-xs text-brand-600">
                  {count === 0
                    ? "No reflections yet"
                    : `${count} reflection${count === 1 ? "" : "s"}`}
                </p>
              </div>
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-200 text-brand-700 transition ${
                  open ? "rotate-180 bg-teal-50 text-teal-800" : "bg-white"
                }`}
                aria-hidden
              >
                ▾
              </span>
            </button>

            {open ? (
              <div className="border-t border-brand-100 bg-brand-50/30 px-3 py-3 sm:px-4">
                {group.reflections.length === 0 ? (
                  <p className="px-1 py-3 text-sm text-brand-600">
                    When this pupil logs a lesson reflection, it will appear here.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {group.reflections.map((row) => {
                      const delta = reflectionConfidenceDelta(row);
                      return (
                        <li key={row.id}>
                          <Link
                            href={`/instructor/reflections/${row.id}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-white px-3.5 py-3 transition hover:border-teal-200 hover:shadow-sm"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-brand-950">
                                {formatIsoDateUk(row.lesson_date)}
                              </p>
                              <p className="mt-0.5 text-xs text-brand-600">
                                {LESSON_TYPE_LABELS[row.lesson_type]} · {row.lesson_hours}h
                              </p>
                            </div>
                            <p className="text-xs font-semibold tabular-nums text-brand-800">
                              Confidence {row.confidence_before}→{row.confidence_after}
                              {delta !== 0 ? (
                                <span className={delta > 0 ? " text-emerald-700" : " text-amber-800"}>
                                  {" "}
                                  ({delta > 0 ? "+" : ""}
                                  {Number.isInteger(delta) ? delta : delta.toFixed(1)})
                                </span>
                              ) : null}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
