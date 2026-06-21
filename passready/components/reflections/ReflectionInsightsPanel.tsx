import type { ReflectionInsights } from "@/lib/lesson-reflections/types";

type Props = {
  insights: ReflectionInsights;
  title?: string;
};

export function ReflectionInsightsPanel({ insights, title = "Progress Insights" }: Props) {
  return (
    <section className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-brand-800">{insights.confidenceTrend.summary}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Repeated weaknesses</p>
          <ul className="mt-2 space-y-1 text-sm text-brand-800">
            {insights.repeatedWeaknesses.length > 0 ? (
              insights.repeatedWeaknesses.map((item) => (
                <li key={item.topicId}>
                  {item.label} · {item.count}x
                </li>
              ))
            ) : (
              <li className="text-brand-600">No repeated difficulties yet.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Improving topics</p>
          <ul className="mt-2 space-y-1 text-sm text-brand-800">
            {insights.improvingTopics.length > 0 ? (
              insights.improvingTopics.map((item) => (
                <li key={item.topicId}>
                  {item.label} · {item.count}x
                </li>
              ))
            ) : (
              <li className="text-brand-600">Log strengths to track improvement.</li>
            )}
          </ul>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Under-practised topics</p>
          <p className="mt-2 text-sm text-brand-800">
            {insights.underPractisedTopics.length > 0
              ? insights.underPractisedTopics.map((item) => item.label).join(" · ")
              : "Great breadth so far across your recent reflections."}
          </p>
        </div>
      </div>

      {insights.highlights.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-teal-100 pt-4 text-sm text-brand-800">
          {insights.highlights.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
