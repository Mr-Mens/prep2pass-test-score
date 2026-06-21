import Link from "next/link";

import { LESSON_TYPE_LABELS } from "@/lib/lesson-reflections/constants";
import { reflectionConfidenceDelta } from "@/lib/lesson-reflections/confidence";
import type { LessonReflectionRow } from "@/lib/lesson-reflections/types";
import { formatIsoDateUk } from "@/lib/formatting";

type ReflectionRow = LessonReflectionRow & { learner_name?: string | null };

type Props = {
  reflections: ReflectionRow[];
  detailHref: (id: string) => string;
  emptyMessage?: string;
};

export function ReflectionListSection({
  reflections,
  detailHref,
  emptyMessage = "No reflections yet. Log your first lesson to unlock insights.",
}: Props) {
  if (reflections.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-5 py-8 text-center text-sm text-brand-600">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reflections.map((row) => {
        const delta = reflectionConfidenceDelta(row);
        return (
          <li key={row.id}>
            <Link
              href={detailHref(row.id)}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-950">{formatIsoDateUk(row.lesson_date)}</p>
                <p className="mt-0.5 text-xs text-brand-600">
                  {LESSON_TYPE_LABELS[row.lesson_type]} · {row.lesson_hours}h
                  {row.learner_name ? ` · ${row.learner_name}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Confidence</p>
                <p className="text-sm font-semibold tabular-nums text-brand-950">
                  {row.confidence_before}→{row.confidence_after}
                  {delta !== 0 ? (
                    <span className={delta > 0 ? " text-emerald-700" : " text-amber-800"}>
                      {" "}
                      ({delta > 0 ? "+" : ""}
                      {Number.isInteger(delta) ? delta : delta.toFixed(1)})
                    </span>
                  ) : null}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
