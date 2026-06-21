import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/Button";
import { LessonReflectionsSummaryCard } from "@/components/reflections/LessonReflectionsSummaryCard";
import { ReflectionInsightsPanel } from "@/components/reflections/ReflectionInsightsPanel";
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
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            A quick post-lesson log that feeds progress insights and lightly informs your Test Ready Score.
          </p>
        </div>
        <Button href="/dashboard/reflections/new" variant="conversion" className="min-h-[48px] shrink-0">
          New reflection
        </Button>
      </header>

      <LessonReflectionsSummaryCard summary={summary} />

      <ReflectionInsightsPanel insights={insights} />

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">All reflections</h2>
          <Link href="/dashboard/reflections/new" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
            Add new
          </Link>
        </div>
        <ReflectionListSection reflections={reflections} detailHref={(id) => `/dashboard/reflections/${id}`} />
      </section>
    </div>
  );
}
