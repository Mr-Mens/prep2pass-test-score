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

function TakeawayRow({
  title,
  items,
  empty = "Not noted",
}: {
  title: string;
  items: string[];
  empty?: string;
}) {
  return (
    <div className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
      <h2 className="text-sm font-semibold text-brand-950">{title}</h2>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item} className="text-sm leading-snug text-brand-800">
              {syllabusTopicLabel(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-400">{empty}</p>
      )}
    </div>
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
      <header className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
        {learnerName ? (
          <p className="text-sm font-semibold text-teal-800">{learnerName}</p>
        ) : (
          <p className="text-xs font-semibold text-brand-500">Lesson reflection</p>
        )}
        <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          {formatIsoDateUk(reflection.lesson_date)}
        </h1>
        <p className="mt-2 text-sm text-brand-600">
          {LESSON_TYPE_LABELS[reflection.lesson_type]} · {reflection.lesson_hours}h
          {reflection.private_practice_planned ? " · Private practice planned" : ""}
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-brand-500">Confidence</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-brand-950">
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
          {reflection.topics_practised.length > 0 ? (
            <div>
              <dt className="text-xs font-semibold text-brand-500">Practised</dt>
              <dd className="mt-1 text-sm leading-snug text-brand-800">
                {reflectionTopicLabels(reflection.topics_practised)}
              </dd>
            </div>
          ) : null}
        </dl>
      </header>

      <section className="rounded-2xl border border-brand-100 bg-white px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold text-brand-500">This lesson</p>
        <div className="mt-3 divide-y divide-brand-100">
          <TakeawayRow title="Went well" items={reflection.strengths} />
          <TakeawayRow title="Was difficult" items={reflection.difficulties} />
          <TakeawayRow title="Next focus" items={reflection.next_focus} empty="Not set" />
        </div>
      </section>

      {reflection.difficulty_notes ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-brand-950">
            {learnerName ? "Pupil notes" : "Your notes"}
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-800">
            {reflection.difficulty_notes}
          </p>
        </section>
      ) : null}

      {perTopic.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-brand-950">Confidence by topic</h2>
          <ul className="mt-3 divide-y divide-brand-100">
            {perTopic.map((entry) => {
              const delta = entry.after - entry.before;
              return (
                <li
                  key={entry.topicId}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                >
                  <p className="text-sm text-brand-800">{syllabusTopicLabel(entry.topicId)}</p>
                  <p className="text-sm font-medium tabular-nums text-brand-950">
                    {entry.before} → {entry.after}
                    {delta !== 0 ? (
                      <span className={delta > 0 ? " text-emerald-700" : " text-amber-800"}>
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
