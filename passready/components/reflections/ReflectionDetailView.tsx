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

function TopicBlock({
  title,
  items,
  empty = "None noted",
  tone = "default",
}: {
  title: string;
  items: string[];
  empty?: string;
  tone?: "default" | "strength" | "difficulty" | "focus";
}) {
  const tones = {
    default: "border-brand-100 bg-white",
    strength: "border-emerald-200/70 bg-emerald-50/40",
    difficulty: "border-amber-200/70 bg-amber-50/35",
    focus: "border-teal-200/70 bg-teal-50/40",
  } as const;
  const titleTone = {
    default: "text-brand-500",
    strength: "text-emerald-800",
    difficulty: "text-amber-900",
    focus: "text-teal-900",
  } as const;

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${tones[tone]}`}>
      <h2 className={`text-xs font-semibold uppercase tracking-wide ${titleTone[tone]}`}>{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-brand-900 ring-1 ring-brand-100"
            >
              {syllabusTopicLabel(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-brand-500">{empty}</p>
      )}
    </section>
  );
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
    <article className="space-y-4">
      <header className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        {learnerName ? (
          <p className="text-sm font-semibold text-teal-800">{learnerName}</p>
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Lesson reflection</p>
        )}
        <h1 className="mt-1 font-heading text-2xl font-semibold text-brand-950 sm:text-3xl">
          {formatIsoDateUk(reflection.lesson_date)}
        </h1>
        <p className="mt-2 text-sm text-brand-600">
          {LESSON_TYPE_LABELS[reflection.lesson_type]} · {reflection.lesson_hours}h
          {reflection.private_practice_planned ? " · Private practice planned" : ""}
        </p>
        <p className="mt-4 text-sm text-brand-800">
          <span className="font-semibold text-brand-950">Confidence:</span> {reflection.confidence_before} →{" "}
          {reflection.confidence_after}
          {confidenceDelta !== 0 ? (
            <span className={confidenceDelta > 0 ? " font-semibold text-emerald-700" : " font-semibold text-amber-800"}>
              {" "}
              ({confidenceDelta > 0 ? "+" : ""}
              {confidenceDelta.toFixed(1)})
            </span>
          ) : null}
        </p>
        {reflection.topics_practised.length > 0 ? (
          <p className="mt-2 text-sm text-brand-600">
            <span className="font-medium text-brand-800">Practised:</span>{" "}
            {reflectionTopicLabels(reflection.topics_practised)}
          </p>
        ) : null}
      </header>

      <TopicBlock title="What went well" items={reflection.strengths} tone="strength" />
      <TopicBlock title="What was difficult" items={reflection.difficulties} tone="difficulty" />

      {reflection.difficulty_notes ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-500">Pupil notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
            {reflection.difficulty_notes}
          </p>
        </section>
      ) : null}

      <TopicBlock title="Next lesson focus" items={reflection.next_focus} tone="focus" empty="No focus suggested" />

      {perTopic.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-500">Confidence by topic</h2>
          <ul className="mt-4 divide-y divide-brand-100">
            {perTopic.map((entry) => {
              const delta = entry.after - entry.before;
              return (
                <li key={entry.topicId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-brand-950">{syllabusTopicLabel(entry.topicId)}</p>
                  <p className="text-sm tabular-nums text-brand-700">
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
    </article>
  );
}
