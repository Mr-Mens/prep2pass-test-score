import type { Metadata } from "next";

import { InstructorLessonReviewsByPupil } from "@/components/instructor/InstructorLessonReviewsByPupil";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listPupilsForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { listLessonReflectionsForInstructor } from "@/lib/server/repositories/lesson-reflections-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "Lesson Reviews · Instructor",
  description: "Read lesson reflections submitted by your linked pupils.",
};

export default async function InstructorReflectionsPage() {
  const user = await requireInstructorSession();
  const configured = isSupabaseConfigured();
  const [pupils, reflections] = configured
    ? await Promise.all([listPupilsForInstructor(user.id), listLessonReflectionsForInstructor(user.id, 500)])
    : [[], []];

  const reviewPupils = pupils
    .filter((pupil) => pupil.link_status === "accepted")
    .map((pupil) => ({
      pupilId: pupil.id,
      learnerUserId: pupil.linked_learner_user_id,
      name: pupil.pupil_name.trim() || pupil.pupil_email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Lesson Reviews</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          Open a pupil to see their lesson reflections. When you mark a lesson complete, premium pupils are prompted to
          log how it went.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-500">Pupils</h2>
        <InstructorLessonReviewsByPupil pupils={reviewPupils} reflections={reflections} />
      </section>
    </div>
  );
}
