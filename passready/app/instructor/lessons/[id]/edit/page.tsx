import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InstructorLessonForm } from "@/components/instructor/InstructorLessonForm";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getLessonForInstructor } from "@/lib/server/repositories/instructor-lessons-repository";
import { listPupilsForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Edit lesson · Instructor" };
}

export default async function InstructorEditLessonPage({ params }: Props) {
  const user = await requireInstructorSession();
  if (!isSupabaseConfigured()) notFound();

  const [lesson, pupils] = await Promise.all([
    getLessonForInstructor(params.id, user.id),
    listPupilsForInstructor(user.id),
  ]);
  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header>
        <Link href={`/instructor/lessons/${lesson.id}`} className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
          ← Back to lesson
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Edit lesson</h1>
        <p className="mt-2 text-sm text-brand-600">{lesson.pupil_name}</p>
      </header>

      <InstructorLessonForm
        pupils={pupils}
        lesson={lesson}
        cancelHref={`/instructor/lessons/${lesson.id}`}
      />
    </div>
  );
}
