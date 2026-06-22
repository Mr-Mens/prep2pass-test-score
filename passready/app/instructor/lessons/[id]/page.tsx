import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InstructorLessonDetail } from "@/components/instructor/InstructorLessonDetail";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getLessonForInstructor } from "@/lib/server/repositories/instructor-lessons-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Lesson · Instructor" };
}

export default async function InstructorLessonPage({ params }: Props) {
  const user = await requireInstructorSession();
  if (!isSupabaseConfigured()) notFound();

  const lesson = await getLessonForInstructor(params.id, user.id);
  if (!lesson) notFound();

  return (
    <div className="mx-auto max-w-3xl pb-4">
      <InstructorLessonDetail lesson={lesson} />
    </div>
  );
}
