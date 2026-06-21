import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ReflectionForm } from "@/components/reflections/ReflectionForm";
import { requireLinkedLearnerUserId, requireParentSession } from "@/lib/server/supervisor-page-auth";

export const metadata: Metadata = {
  title: "New lesson reflection · Parent supervisor",
};

export default async function SupervisorNewReflectionPage() {
  const user = await requireParentSession();
  const learnerUserId = await requireLinkedLearnerUserId(user.id);
  if (!learnerUserId) redirect("/supervisor/link-learner");

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header>
        <Link
          href="/supervisor/reflections"
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← Back to reflections
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          New reflection
        </h1>
        <p className="mt-2 text-sm text-brand-600">Log what you practised together and how confident your learner felt.</p>
      </header>
      <ReflectionForm
        cancelHref="/supervisor/reflections"
        successHref="/supervisor/reflections"
        learnerUserId={learnerUserId}
        defaultLessonType="parent_supervisor"
      />
    </div>
  );
}
