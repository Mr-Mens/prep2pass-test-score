import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReflectionDetailView } from "@/components/reflections/ReflectionDetailView";
import { ReflectionInsightsPanel } from "@/components/reflections/ReflectionInsightsPanel";
import { buildReflectionInsights } from "@/lib/lesson-reflections/insights";
import {
  getLessonReflectionById,
  listLessonReflectionsForSupervisor,
} from "@/lib/server/repositories/lesson-reflections-repository";
import { requireLinkedLearnerUserId, requireParentSession } from "@/lib/server/supervisor-page-auth";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Lesson reflection · Parent supervisor" };
}

export default async function SupervisorReflectionDetailPage({ params }: Props) {
  const user = await requireParentSession();
  const learnerUserId = await requireLinkedLearnerUserId(user.id);
  if (!learnerUserId) notFound();

  const reflection = await getLessonReflectionById(params.id);
  if (!reflection || reflection.user_id !== learnerUserId) notFound();

  const allRows = await listLessonReflectionsForSupervisor(user.id);
  const insights = buildReflectionInsights(allRows);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <Link
        href="/supervisor/reflections"
        className="inline-block text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
      >
        ← All reflections
      </Link>
      <ReflectionDetailView reflection={reflection} />
      <ReflectionInsightsPanel insights={insights} title="Learner progress insights" />
    </div>
  );
}
