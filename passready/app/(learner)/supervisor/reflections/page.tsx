import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/Button";
import { ReflectionInsightsPanel } from "@/components/reflections/ReflectionInsightsPanel";
import { ReflectionInsightsStrip } from "@/components/reflections/ReflectionInsightsStrip";
import { ReflectionListSection } from "@/components/reflections/ReflectionListSection";
import { buildReflectionDashboardSummary, buildReflectionInsights } from "@/lib/lesson-reflections/insights";
import { listLessonReflectionsForSupervisor } from "@/lib/server/repositories/lesson-reflections-repository";
import { requireLinkedLearnerUserId, requireParentSession } from "@/lib/server/supervisor-page-auth";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "Lesson Reflections · Parent supervisor",
  description: "Log and review lesson reflections for your linked learner.",
};

export default async function SupervisorReflectionsPage() {
  const user = await requireParentSession();
  const learnerUserId = await requireLinkedLearnerUserId(user.id);
  const reflections = isSupabaseConfigured() ? await listLessonReflectionsForSupervisor(user.id) : [];
  const summary = buildReflectionDashboardSummary(reflections);
  const insights = buildReflectionInsights(reflections);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
            Lesson Reflections
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            {learnerUserId
              ? "Track practice sessions and confidence after each drive."
              : "Link your learner first to start logging reflections together."}
          </p>
        </div>
        {learnerUserId ? (
          <Button href="/supervisor/reflections/new" variant="conversion" className="min-h-[48px] shrink-0">
            New reflection
          </Button>
        ) : null}
      </header>

      {!learnerUserId ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <Link href="/supervisor/link-learner" className="font-semibold underline-offset-4 hover:underline">
            Link your learner
          </Link>{" "}
          to view and add lesson reflections.
        </p>
      ) : (
        <>
          <ReflectionInsightsStrip summary={summary} insights={insights} />
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-500">Reflections</h2>
            <ReflectionListSection
              reflections={reflections}
              detailHref={(id) => `/supervisor/reflections/${id}`}
            />
          </section>
          {summary.totalReflections > 0 ? (
            <details id="insights" className="group rounded-2xl border border-brand-100 bg-white">
              <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-brand-800 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  Full progress insights
                  <span className="text-xs font-medium text-brand-500 group-open:hidden">Show</span>
                  <span className="hidden text-xs font-medium text-brand-500 group-open:inline">Hide</span>
                </span>
              </summary>
              <div className="border-t border-brand-100 px-1 pb-1 sm:px-2 sm:pb-2">
                <ReflectionInsightsPanel insights={insights} title="Progress insights" />
              </div>
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}
