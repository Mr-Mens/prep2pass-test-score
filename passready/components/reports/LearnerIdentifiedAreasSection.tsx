import type { WeakAreaDetailEntry } from "@/lib/validation";
import { learnerIdentifiedLabels } from "@/lib/weak-area-follow-up";

type Props = {
  details: WeakAreaDetailEntry[] | undefined;
};

export function LearnerIdentifiedAreasSection({ details }: Props) {
  const labels = learnerIdentifiedLabels(details);
  if (labels.length === 0) return null;

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Areas you identified yourself</p>
      <h2 className="mt-2 text-lg font-semibold text-brand-950">You told us you find these difficult</h2>
      <ul className="mt-5 space-y-2">
        {labels.map((label) => (
          <li key={label} className="flex gap-3 text-sm leading-relaxed text-brand-800">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
