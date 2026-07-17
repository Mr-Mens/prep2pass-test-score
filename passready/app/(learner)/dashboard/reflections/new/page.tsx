import type { Metadata } from "next";
import Link from "next/link";

import { ReflectionForm } from "@/components/reflections/ReflectionForm";
import { Button } from "@/components/Button";
import { PRICING, SITE } from "@/lib/constants";
import { getCachedServerAuthUser } from "@/lib/server/cached-user-data";
import { getCachedLearnerAccessStatus } from "@/lib/server/learner-access";
import { SYLLABUS_TOPIC_ID_SET } from "@/lib/syllabus-topics";

export const metadata: Metadata = {
  title: "New lesson reflection",
  description: `Log a lesson reflection on ${SITE.name}.`,
};

type Props = {
  searchParams: {
    lessonId?: string;
    lessonDate?: string;
    hours?: string;
    topics?: string;
  };
};

export default async function NewLearnerReflectionPage({ searchParams }: Props) {
  const user = (await getCachedServerAuthUser())!;
  const access = await getCachedLearnerAccessStatus(user.id);

  const defaultTopicsPractised = (searchParams.topics ?? "")
    .split(",")
    .map((topic) => topic.trim())
    .filter((topic) => SYLLABUS_TOPIC_ID_SET.has(topic));

  if (!access.hasPremiumAccess) {
    return (
      <div className="space-y-6 pb-4">
        <header>
          <Link
            href="/dashboard/reflections"
            className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
          >
            ← Back to reflections
          </Link>
          <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
            Premium required
          </h1>
          <p className="mt-2 text-sm text-brand-600">
            Lesson reflections are part of Pass Pilot premium. Subscribe to log reflections after your lessons and unlock
            progress insights.
          </p>
        </header>
        <section className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 sm:p-6">
          <p className="font-heading text-lg font-semibold text-brand-950">
            {PRICING.subscription.display}/month until you pass or cancel
          </p>
          <p className="mt-2 text-sm text-brand-700">
            Your instructor can mark lessons complete. You&apos;ll be prompted to reflect once you have premium access.
          </p>
          <Button href="/subscribe" variant="conversion" className="mt-4 min-h-[48px]">
            {PRICING.subscription.trialCta}
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <header>
        <Link
          href="/dashboard/reflections"
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← Back to reflections
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          New reflection
        </h1>
        <p className="mt-2 text-sm text-brand-600">Takes under two minutes. Honest answers help your next lesson focus.</p>
      </header>
      <ReflectionForm
        cancelHref="/dashboard/reflections"
        successHref="/dashboard/reflections"
        defaultLessonType="instructor"
        defaultLessonDate={searchParams.lessonDate}
        defaultLessonHours={searchParams.hours}
        defaultTopicsPractised={defaultTopicsPractised}
        defaultInstructorLessonId={searchParams.lessonId}
      />
    </div>
  );
}
