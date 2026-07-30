import type { Metadata } from "next";
import Link from "next/link";

import { InstructorLessonForm } from "@/components/instructor/InstructorLessonForm";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listPupilsForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "New lesson · Instructor",
};

type Props = {
  searchParams: {
    pupilId?: string;
    lessonDate?: string;
    startTime?: string;
    durationMinutes?: string;
  };
};

export default async function InstructorNewLessonPage({ searchParams }: Props) {
  const user = await requireInstructorSession();
  const pupils = isSupabaseConfigured() ? await listPupilsForInstructor(user.id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header>
        <Link href="/instructor/lessons" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
          ← Back to lessons
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">New lesson</h1>
        <p className="mt-2 text-sm text-brand-600">Schedule a lesson and note the planned focus.</p>
      </header>

      {pupils.length === 0 ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          Add a pupil from{" "}
          <Link href="/instructor/pupils" className="font-semibold underline-offset-4 hover:underline">
            My Pupils
          </Link>{" "}
          before creating lessons.
        </p>
      ) : (
        <InstructorLessonForm
          pupils={pupils}
          defaultPupilId={searchParams.pupilId}
          defaultLessonDate={searchParams.lessonDate}
          defaultStartTime={searchParams.startTime}
          defaultDurationMinutes={searchParams.durationMinutes}
          cancelHref="/instructor/lessons"
        />
      )}
    </div>
  );
}
