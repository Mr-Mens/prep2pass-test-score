import type { ReflectionInsights } from "@/lib/lesson-reflections/types";

type Props = {
  insights: ReflectionInsights;
  title?: string;
};

function TopicPills({
  items,
  empty,
  tone = "neutral",
}: {
  items: Array<{ topicId: string; label: string; count?: number }>;
  empty: string;
  tone?: "neutral" | "watch" | "good";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-brand-500">{empty}</p>;
  }

  const toneClass =
    tone === "watch"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : tone === "good"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : "border-brand-200 bg-white text-brand-900";

  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item.topicId} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass}`}>
          {item.label}
          {item.count != null && item.count > 1 ? (
            <span className="ml-1 tabular-nums opacity-70">{item.count}×</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ConfidenceBadge({ insights }: { insights: ReflectionInsights }) {
  const { direction, averageDelta, summary } = insights.confidenceTrend;
  const hasData = summary !== "Log a lesson to start";

  const badgeClass =
    direction === "up"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : direction === "down"
        ? "bg-amber-50 text-amber-950 ring-amber-200"
        : "bg-brand-50 text-brand-800 ring-brand-200";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${badgeClass}`}>
        {hasData ? `Confidence ${summary.toLowerCase()}` : summary}
      </span>
      {hasData ? (
        <span className="text-xs tabular-nums text-brand-500">
          {averageDelta > 0 ? "+" : ""}
          {averageDelta.toFixed(1)} avg · last lessons
        </span>
      ) : null}
    </div>
  );
}

export function ReflectionInsightsPanel({ insights, title = "Progress insights" }: Props) {
  const takeaway = insights.highlights[0] ?? null;

  return (
    <section className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{title}</p>
        <div className="mt-3">
          <ConfidenceBadge insights={insights} />
        </div>
        {takeaway ? (
          <p className="mt-3 text-base font-semibold text-brand-950">{takeaway}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold text-brand-700">Needs work</p>
          <div className="mt-2">
            <TopicPills
              items={insights.repeatedWeaknesses}
              empty="Nothing repeating yet"
              tone="watch"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-700">Going well</p>
          <div className="mt-2">
            <TopicPills items={insights.improvingTopics} empty="Log what went well" tone="good" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-brand-700">Not covered yet</p>
          <div className="mt-2">
            <TopicPills
              items={insights.underPractisedTopics.slice(0, 4)}
              empty="Good coverage so far"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
