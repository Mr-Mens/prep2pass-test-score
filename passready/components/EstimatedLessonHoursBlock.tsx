import type { EstimatedLessonHours } from "@/lib/validation";
import {
  ESTIMATED_HOURS_DISCLAIMER,
  ESTIMATED_HOURS_SUPPORTING,
  ESTIMATED_HOURS_TITLE,
  formatEstimatedLessonHoursMainLine,
} from "@/lib/estimated-lesson-hours";

type Props = { hours: EstimatedLessonHours };

export function EstimatedLessonHoursBlock({ hours }: Props) {
  return (
    <div className="rounded-xl border border-brand-200/90 bg-brand-50/60 px-5 py-5 ring-1 ring-brand-200/40 print:border-brand-200 print:bg-white print:ring-0">
      <h3 className="text-sm font-semibold tracking-tight text-brand-950">{ESTIMATED_HOURS_TITLE}</h3>
      <p className="mt-3 text-sm font-medium leading-relaxed text-brand-900">{formatEstimatedLessonHoursMainLine(hours)}</p>
      <p className="mt-3 text-sm leading-relaxed text-brand-700">{ESTIMATED_HOURS_SUPPORTING}</p>
      <p className="mt-3 text-xs font-medium leading-relaxed text-brand-600">{ESTIMATED_HOURS_DISCLAIMER}</p>
    </div>
  );
}
