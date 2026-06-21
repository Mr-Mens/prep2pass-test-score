import { reflectionTopicLabels } from "@/components/reflections/LessonReflectionsSummaryCard";
import { reflectionConfidenceDelta } from "@/lib/lesson-reflections/confidence";
import { LESSON_TYPE_LABELS } from "@/lib/lesson-reflections/constants";
import type { LessonReflectionRow } from "@/lib/lesson-reflections/types";
import { formatIsoDateUk } from "@/lib/formatting";
import { syllabusTopicLabel } from "@/lib/syllabus-topics";

type Props = {
  reflection: LessonReflectionRow;
  learnerName?: string | null;
};

function ChipList({ label, items, emphasis = false }: { label: string; items: string[]; emphasis?: boolean }) {
  const inner = (
    <>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${emphasis ? "text-teal-800" : "text-brand-500"}`}>
        {label}
      </p>
      {items.length > 0 ? (
        <p className={`mt-2 text-sm leading-relaxed ${emphasis ? "font-medium text-teal-950" : "text-brand-800"}`}>
          {reflectionTopicLabels(items)}
        </p>
      ) : (
        <p className="mt-2 text-sm text-brand-500">None noted</p>
      )}
    </>
  );

  if (emphasis) {
    return (
      <div className="rounded-xl border border-teal-200/60 bg-teal-50/35 p-4 ring-1 ring-teal-100/60 sm:col-span-2">
        {inner}
      </div>
    );
  }

  return <div>{inner}</div>;
}

export function ReflectionDetailView({ reflection, learnerName }: Props) {
  const confidenceDelta = reflectionConfidenceDelta(reflection);
  const perTopic =
    reflection.topic_confidence.length > 0
      ? reflection.topic_confidence
      : reflection.topics_practised.map((topicId) => ({
          topicId,
          before: reflection.confidence_before,
          after: reflection.confidence_after,
        }));

  return (
    <article className="space-y-5">
      <header className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Lesson reflection</p>
            <h1 className="mt-2 font-heading text-2xl font-semibold text-brand-950">
              {formatIsoDateUk(reflection.lesson_date)}
            </h1>
            {learnerName ? <p className="mt-1 text-sm text-brand-600">Learner: {learnerName}</p> : null}
          </div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-100">
            {LESSON_TYPE_LABELS[reflection.lesson_type]}
          </span>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Length</dt>
            <dd className="mt-1 text-sm font-semibold text-brand-950">{reflection.lesson_hours}h</dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Avg confidence</dt>
            <dd className="mt-1 text-sm font-semibold text-brand-950">
              {reflection.confidence_before} → {reflection.confidence_after}
              {confidenceDelta !== 0 ? (
                <span className={confidenceDelta > 0 ? " text-emerald-700" : " text-amber-800"}>
                  {" "}
                  ({confidenceDelta > 0 ? "+" : ""}
                  {confidenceDelta.toFixed(1)})
                </span>
              ) : null}
            </dd>
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Private practice</dt>
            <dd className="mt-1 text-sm font-semibold text-brand-950">
              {reflection.private_practice_planned ? "Planned" : "Not planned"}
            </dd>
          </div>
        </dl>
      </header>

      {perTopic.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Confidence by topic</p>
          <ul className="mt-4 space-y-3">
            {perTopic.map((entry) => {
              const delta = entry.after - entry.before;
              return (
                <li
                  key={entry.topicId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-brand-950">{syllabusTopicLabel(entry.topicId)}</p>
                  <p className="text-sm tabular-nums text-brand-800">
                    {entry.before} → {entry.after}
                    {delta !== 0 ? (
                      <span className={delta > 0 ? " font-semibold text-emerald-700" : " font-semibold text-amber-800"}>
                        {" "}
                        ({delta > 0 ? "+" : ""}
                        {delta})
                      </span>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6">
        <ChipList label="Topics practised" items={reflection.topics_practised} />
        <ChipList label="What went well" items={reflection.strengths} />
        <ChipList label="What was difficult" items={reflection.difficulties} />
        <ChipList label="Next lesson focus" items={reflection.next_focus} emphasis />
      </section>

      {reflection.difficulty_notes ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">Notes</p>
          <p className="mt-2 text-sm leading-relaxed text-brand-800">{reflection.difficulty_notes}</p>
        </section>
      ) : null}
    </article>
  );
}
