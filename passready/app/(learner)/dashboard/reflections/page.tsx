import type { Metadata } from "next";

import { Button } from "@/components/Button";
import { ReflectionInsightsPanel } from "@/components/reflections/ReflectionInsightsPanel";
import { ReflectionInsightsStrip } from "@/components/reflections/ReflectionInsightsStrip";
import { ReflectionListSection } from "@/components/reflections/ReflectionListSection";
import { buildReflectionDashboardSummary, buildReflectionInsights } from "@/lib/lesson-reflections/insights";
import { listLessonReflectionsForLearner } from "@/lib/server/repositories/lesson-reflections-repository";
import { getCachedServerAuthUser } from "@/lib/server/cached-user-data";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Lesson Reflections",
  description: `Log lessons and track confidence trends on ${SITE.name}.`,
};

export default async function LearnerReflectionsPage() {
  const user = (await getCachedServerAuthUser())!;
  const reflections = await listLessonReflectionsForLearner(user.id);
  const summary = buildReflectionDashboardSummary(reflections);
  const insights = buildReflectionInsights(reflections);

  return (
    <div className="space-y-6 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
            Lesson Reflections
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-600">
            A quick post-lesson log for confidence and next focus.
          </p>
        </div>
        <Button href="/dashboard/reflections/new" variant="conversion" className="min-h-[48px] shrink-0">
          New reflection
        </Button>
      </header>

      <ReflectionInsightsStrip summary={summary} insights={insights} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-500">Your reflections</h2>
        <ReflectionListSection
          reflections={reflections}
          detailHref={(id) => `/dashboard/reflections/${id}`}
          emptyMessage="No reflections yet. After a lesson, tap New reflection — it takes under two minutes."
        />
      </section>

      {summary.totalReflections > 0 ? (
        <details id="insights" className="group rounded-2xl border border-brand-100 bg-white open:pb-0">
          <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-brand-800 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Progress insights
              <span className="text-xs font-medium text-brand-500 group-open:hidden">Show</span>
              <span className="hidden text-xs font-medium text-brand-500 group-open:inline">Hide</span>
            </span>
          </summary>
          <div className="border-t border-brand-100 px-1 pb-1 pt-0 sm:px-2 sm:pb-2">
            <ReflectionInsightsPanel insights={insights} title="Progress insights" />
          </div>
        </details>
      ) : null}
    </div>
  );
}
