import type { LessonStatus } from "@/lib/instructor-lessons/types";

export const PLANNER_WORK_START_MINUTES = 6 * 60;
export const PLANNER_WORK_END_MINUTES = 22 * 60;
export const PLANNER_MIN_GAP_MINUTES = 45;

export const LESSON_STATUS_META: Record<
  LessonStatus,
  { label: string; className: string }
> = {
  planned: {
    label: "Planned",
    className: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  },
  completed: {
    label: "Completed",
    className: "bg-blue-50 text-blue-900 ring-blue-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-900 ring-red-200",
  },
  reflection_pending: {
    label: "Reflection pending",
    className: "bg-amber-50 text-amber-900 ring-amber-200",
  },
};
