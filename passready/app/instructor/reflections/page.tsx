import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/Button";
import { ReflectionInsightsPanel } from "@/components/reflections/ReflectionInsightsPanel";
import { ReflectionListSection } from "@/components/reflections/ReflectionListSection";
import { buildReflectionInsights } from "@/lib/lesson-reflections/insights";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import {
  listLessonReflectionsForInstructor,
  listLessonReflectionsForLearner,
} from "@/lib/server/repositories/lesson-reflections-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "Lesson Reviews · Instructor",
  description: "Review pupil lesson reflections and spot recurring difficulties.",
};

export default async function InstructorReflectionsPage() {
  const user = await requireInstructorSession();
  const reflections = isSupabaseConfigured() ? await listLessonReflectionsForInstructor(user.id) : [];

  const insightLearnerId = reflections[0]?.user_id;
  const insightRows = insightLearnerId ? await listLessonReflectionsForLearner(insightLearnerId) : [];
  const insights = buildReflectionInsights(insightRows);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Lesson Reviews</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            Structured reflections from you and your linked pupils — spot patterns between lessons.
          </p>
        </div>
        <Button href="/instructor/reflections/new" variant="conversion" className="min-h-[48px] shrink-0">
          Log reflection
        </Button>
      </header>

      {insightRows.length > 0 ? <ReflectionInsightsPanel insights={insights} title="Pupil insights" /> : null}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Recent reflections</h2>
          <Link
            href="/instructor/reflections/new"
            className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
          >
            Add new
          </Link>
        </div>
        <ReflectionListSection
          reflections={reflections}
          detailHref={(id) => `/instructor/reflections/${id}`}
          emptyMessage="No lesson reflections yet. Log one after your next pupil session."
        />
      </section>
    </div>
  );
}
