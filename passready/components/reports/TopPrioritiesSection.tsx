import type { ReportPriority } from "@/lib/report-insights";

type Props = {
  priorities: ReportPriority[];
};

export function TopPrioritiesSection({ priorities }: Props) {
  if (priorities.length === 0) return null;

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">Your next 3 priorities</p>
      <h2 className="mt-2 text-lg font-semibold text-brand-950">Focused action plan</h2>
      <ol className="mt-6 space-y-4">
        {priorities.map((item) => (
          <li
            key={item.rank}
            className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:p-5"
          >
            <div className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white"
                aria-hidden
              >
                {item.rank}
              </span>
              <div>
                <h3 className="text-base font-semibold text-brand-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">{item.detail}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
