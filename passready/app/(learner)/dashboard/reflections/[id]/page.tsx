import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReflectionDetailView } from "@/components/reflections/ReflectionDetailView";
import { ReflectionInsightsPanel } from "@/components/reflections/ReflectionInsightsPanel";
import { buildReflectionInsights } from "@/lib/lesson-reflections/insights";
import {
  getLessonReflectionById,
  listLessonReflectionsForLearner,
} from "@/lib/server/repositories/lesson-reflections-repository";
import { getCachedServerAuthUser } from "@/lib/server/cached-user-data";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Lesson reflection" };
}

export default async function LearnerReflectionDetailPage({ params }: Props) {
  const user = (await getCachedServerAuthUser())!;
  const reflection = await getLessonReflectionById(params.id);
  if (!reflection || reflection.user_id !== user.id) notFound();

  const allRows = await listLessonReflectionsForLearner(user.id);
  const insights = buildReflectionInsights(allRows);

  return (
    <div className="space-y-6 pb-4">
      <Link
        href="/dashboard/reflections"
        className="inline-block text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
      >
        ← All reflections
      </Link>
      <ReflectionDetailView reflection={reflection} />
      <ReflectionInsightsPanel insights={insights} title="Your progress insights" />
    </div>
  );
}
