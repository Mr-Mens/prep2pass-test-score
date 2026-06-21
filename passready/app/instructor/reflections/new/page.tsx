import type { Metadata } from "next";
import Link from "next/link";

import { ReflectionForm } from "@/components/reflections/ReflectionForm";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listPupilsForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "Log lesson review · Instructor",
};

export default async function InstructorNewReflectionPage() {
  const user = await requireInstructorSession();
  const pupils = isSupabaseConfigured() ? await listPupilsForInstructor(user.id) : [];
  const learnerOptions = pupils
    .filter((p) => p.link_status === "accepted" && p.linked_learner_user_id)
    .map((p) => ({
      id: p.linked_learner_user_id as string,
      label: p.pupil_name,
    }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header>
        <Link
          href="/instructor/reflections"
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← Back to lesson reviews
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          Log lesson review
        </h1>
        <p className="mt-2 text-sm text-brand-600">
          Capture what was practised and how the pupil felt — useful for your next lesson plan.
        </p>
      </header>

      {learnerOptions.length === 0 ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          Link a pupil first from{" "}
          <Link href="/instructor/pupils" className="font-semibold underline-offset-4 hover:underline">
            My Pupils
          </Link>{" "}
          before logging a reflection.
        </p>
      ) : (
        <ReflectionForm
          cancelHref="/instructor/reflections"
          successHref="/instructor/reflections"
          learnerOptions={learnerOptions}
          defaultLessonType="instructor"
        />
      )}
    </div>
  );
}
