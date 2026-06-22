import type { Metadata } from "next";
import Link from "next/link";

import { InstructorLessonsList } from "@/components/instructor/InstructorLessonsList";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listLessonsForInstructor } from "@/lib/server/repositories/instructor-lessons-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const metadata: Metadata = {
  title: "Lessons · Instructor",
  description: "Plan and track lessons with your pupils.",
};

export default async function InstructorLessonsPage() {
  const user = await requireInstructorSession();
  const lessons = isSupabaseConfigured() ? await listLessonsForInstructor(user.id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Lessons</h1>
          <p className="mt-2 text-sm leading-relaxed text-brand-600">
            Lightweight lesson records linked to pupils — a simple foundation before full diary management.
          </p>
        </div>
        <Link
          href="/instructor/lessons/new"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          New lesson
        </Link>
      </header>

      <InstructorLessonsList lessons={lessons} />
    </div>
  );
}
