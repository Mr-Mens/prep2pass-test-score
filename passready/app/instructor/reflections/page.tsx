import type { Metadata } from "next";

import { ReflectionListSection } from "@/components/reflections/ReflectionListSection";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listLessonReflectionsForInstructor } from "@/lib/server/repositories/lesson-reflections-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "Lesson Reviews · Instructor",
  description: "Read lesson reflections submitted by your linked pupils.",
};

export default async function InstructorReflectionsPage() {
  const user = await requireInstructorSession();
  const reflections = isSupabaseConfigured() ? await listLessonReflectionsForInstructor(user.id, 500) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Lesson Reviews</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Read reflections your pupils submit after lessons. When you mark a lesson complete, premium pupils are
          prompted to log how it went.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-500">Pupil reflections</h2>
        <ReflectionListSection
          reflections={reflections.slice(0, 50)}
          detailHref={(id) => `/instructor/reflections/${id}`}
          emptyMessage="No pupil reflections yet. Mark lessons complete and linked premium pupils will be notified to log theirs."
        />
        {reflections.length > 50 ? (
          <p className="mt-3 text-xs text-brand-500">Showing the 50 most recent reflections.</p>
        ) : null}
      </section>
    </div>
  );
}
