import Link from "next/link";

import { LESSON_TYPE_LABELS } from "@/lib/lesson-reflections/constants";
import { reflectionConfidenceDelta } from "@/lib/lesson-reflections/confidence";
import type { LessonReflectionRow } from "@/lib/lesson-reflections/types";
import { formatIsoDateUk } from "@/lib/formatting";
import { syllabusTopicLabel } from "@/lib/syllabus-topics";

type ReflectionRow = LessonReflectionRow & { learner_name?: string | null };

type Props = {
  reflections: ReflectionRow[];
  detailHref: (id: string) => string;
  emptyMessage?: string;
};

function highlightLine(row: ReflectionRow): string | null {
  if (row.next_focus[0]) return `Next: ${syllabusTopicLabel(row.next_focus[0])}`;
  if (row.difficulties[0]) return `Hard: ${syllabusTopicLabel(row.difficulties[0])}`;
  if (row.strengths[0]) return `Went well: ${syllabusTopicLabel(row.strengths[0])}`;
  return null;
}

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
    <ul className="space-y-2">
      {reflections.map((row) => {
        const delta = reflectionConfidenceDelta(row);
        const highlight = highlightLine(row);
        return (
          <li key={row.id}>
            <Link
              href={detailHref(row.id)}
              className="block rounded-2xl border border-brand-100 bg-white px-4 py-3.5 transition hover:border-teal-200 hover:bg-teal-50/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-950">{formatIsoDateUk(row.lesson_date)}</p>
                  <p className="mt-0.5 text-xs text-brand-600">
                    {LESSON_TYPE_LABELS[row.lesson_type]} · {row.lesson_hours}h
                    {row.learner_name ? ` · ${row.learner_name}` : ""}
                  </p>
                  {highlight ? <p className="mt-1.5 text-sm text-brand-700">{highlight}</p> : null}
                </div>
                <p className="shrink-0 text-right text-xs font-semibold tabular-nums text-brand-800">
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
