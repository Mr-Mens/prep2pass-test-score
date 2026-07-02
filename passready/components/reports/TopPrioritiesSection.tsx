import type { ReportPriority } from "@/lib/report-insights";

type Props = {
  priorities: ReportPriority[];
};

function groupLabel(kind: ReportPriority["kind"]): string | null {
  if (kind === "struggle") return "What you're finding difficult";
  if (kind === "syllabus") return "Syllabus breadth for test readiness";
  return null;
}

export function TopPrioritiesSection({ priorities }: Props) {
  if (priorities.length === 0) return null;

  const struggleCount = priorities.filter((p) => p.kind === "struggle").length;
  const hasSyllabusSummary = priorities.some((p) => p.kind === "syllabus");

  return (
    <section id="priorities" className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Action plan</p>
      <h2 className="mt-2 text-lg font-semibold text-brand-950">Focused action plan</h2>
      <p className="mt-2 text-sm leading-relaxed text-brand-700">
        {struggleCount > 0 && hasSyllabusSummary
          ? "Focus on what you find hardest first, then keep building the syllabus topics you have not practised yet."
          : struggleCount > 0
            ? "The areas you told us you find hardest right now."
            : hasSyllabusSummary
              ? "Syllabus topics still to build into normal lessons before test readiness."
              : "What to prioritise in your next lessons."}
      </p>
      <ol className="mt-6 space-y-3">
        {priorities.map((item, index) => {
          const showHeading = index === 0 || priorities[index - 1]!.kind !== item.kind;
          const heading = showHeading ? groupLabel(item.kind) : null;

          return (
            <li key={`${item.rank}-${item.title}`}>
              {heading ? (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-500">{heading}</p>
              ) : null}
              <div
                className={
                  item.kind === "syllabus"
                    ? "rounded-xl border border-amber-100/90 bg-amber-50/35 px-4 py-3 sm:px-5"
                    : "rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5"
                }
              >
                <div className="flex gap-3 sm:gap-4">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm"
                    aria-hidden
                  >
                    {item.rank}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-brand-950 sm:text-base">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-brand-700">{item.detail}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
