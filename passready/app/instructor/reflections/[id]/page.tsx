import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReflectionDetailView } from "@/components/reflections/ReflectionDetailView";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getLessonReflectionById } from "@/lib/server/repositories/lesson-reflections-repository";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Lesson review" };
}

async function getInstructorPupilForReflection(
  instructorUserId: string,
  learnerUserId: string,
): Promise<{ allowed: boolean; pupilName: string | null }> {
  if (!isSupabaseConfigured()) return { allowed: false, pupilName: null };
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("instructor_pupils")
    .select("linked_learner_user_id, pupil_name")
    .eq("instructor_user_id", instructorUserId)
    .eq("link_status", "accepted")
    .eq("linked_learner_user_id", learnerUserId)
    .maybeSingle();
  if (!data?.linked_learner_user_id) return { allowed: false, pupilName: null };
  const pupilName = typeof data.pupil_name === "string" ? data.pupil_name.trim() : "";
  return { allowed: true, pupilName: pupilName || null };
}

export default async function InstructorReflectionDetailPage({ params }: Props) {
  const user = await requireInstructorSession();
  const reflection = await getLessonReflectionById(params.id);
  if (!reflection) notFound();

  const { allowed, pupilName } = await getInstructorPupilForReflection(user.id, reflection.user_id);
  if (!allowed) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <Link
        href="/instructor/reflections"
        className="inline-block text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
      >
        ← Back to pupils
      </Link>
      <ReflectionDetailView reflection={reflection} learnerName={pupilName} />
    </div>
  );
}
