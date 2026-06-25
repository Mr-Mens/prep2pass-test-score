import type { Metadata } from "next";

import { LearnerLessonsList } from "@/components/learner/LearnerLessonsList";
import { requirePremiumLearnerAccess } from "@/lib/server/require-premium-learner-access";
import { listLessonsForLearner } from "@/lib/server/repositories/instructor-lessons-repository";

export const metadata: Metadata = {
  title: "Lessons · Pass Pilot",
  description: "Upcoming and past driving lessons arranged by your instructor on Pass Pilot.",
};

export default async function LearnerLessonsPage() {
  const { user } = await requirePremiumLearnerAccess("/dashboard/lessons");
  const lessons = await listLessonsForLearner(user.id);

  return (
    <div className="space-y-6 pb-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-800">Instructor lessons</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold text-brand-950 sm:text-3xl">Your lessons</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">
          See what your instructor has planned: date, time, focus topics and meeting point, all in one place between
          lessons.
        </p>
      </header>

      <LearnerLessonsList lessons={lessons} />
    </div>
  );
}
