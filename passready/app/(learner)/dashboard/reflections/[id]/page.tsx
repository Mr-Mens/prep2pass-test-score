import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReflectionDetailView } from "@/components/reflections/ReflectionDetailView";
import { getLessonReflectionById } from "@/lib/server/repositories/lesson-reflections-repository";
import { getCachedServerAuthUser } from "@/lib/server/cached-user-data";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Lesson reflection" };
}

export default async function LearnerReflectionDetailPage({ params }: Props) {
  const user = (await getCachedServerAuthUser())!;
  const reflection = await getLessonReflectionById(params.id);
  if (!reflection || reflection.user_id !== user.id) notFound();

  return (
    <div className="space-y-6 pb-4">
      <Link
        href="/dashboard/reflections"
        className="inline-block text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
      >
        ← All reflections
      </Link>
      <ReflectionDetailView reflection={reflection} />
      <p className="text-center text-sm text-brand-600">
        <Link href="/dashboard/reflections#insights" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
          See progress insights
        </Link>
      </p>
    </div>
  );
}
