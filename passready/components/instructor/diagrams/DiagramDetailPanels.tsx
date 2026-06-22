import Link from "next/link";

import { getDiagramCategoryName } from "@/lib/instructor/diagrams/categories";
import { difficultyBadgeClass, difficultyLabel, formatTeachingTime } from "@/lib/instructor/diagrams/format";
import { diagramDetailHref } from "@/lib/instructor/diagrams/navigation";
import type { DiagramCategorySlug, TeachingDiagram } from "@/lib/instructor/diagrams/types";

type ListPanelProps = {
  title: string;
  items: string[];
  tone: "teaching" | "mistakes";
};

function ListPanel({ title, items, tone }: ListPanelProps) {
  const bulletClass = tone === "teaching" ? "bg-teal-600" : "bg-rose-500";

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-brand-950">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-brand-700">
            <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${bulletClass}`} aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type RelatedProps = {
  diagrams: TeachingDiagram[];
  browseCategory?: DiagramCategorySlug | "all";
};

export function RelatedDiagramsPanel({ diagrams, browseCategory = "all" }: RelatedProps) {
  if (diagrams.length === 0) return null;

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-brand-950">Related diagrams</h2>
      <ul className="mt-4 space-y-3">
        {diagrams.map((diagram) => (
          <li key={diagram.slug}>
            <Link
              href={diagramDetailHref(diagram.slug, browseCategory)}
              className="flex items-center justify-between gap-4 rounded-xl border border-brand-100 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/40"
            >
              <span>
                <span className="block text-sm font-semibold text-brand-950">{diagram.title}</span>
                <span className="mt-0.5 block text-xs text-brand-500">
                  {getDiagramCategoryName(diagram.category)} · {formatTeachingTime(diagram.teachingTimeMinutes)}
                </span>
              </span>
              <span className="text-brand-400" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type DetailPanelsProps = {
  diagram: TeachingDiagram;
  related: TeachingDiagram[];
  browseCategory?: DiagramCategorySlug | "all";
};

export function DiagramDetailPanels({ diagram, related, browseCategory = "all" }: DetailPanelsProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
            {getDiagramCategoryName(diagram.category)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${difficultyBadgeClass(diagram.difficulty)}`}
          >
            {difficultyLabel(diagram.difficulty)}
          </span>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            Teaching time · {formatTeachingTime(diagram.teachingTimeMinutes)}
          </span>
        </div>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-brand-950">{diagram.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-brand-700 sm:text-base">{diagram.description}</p>
        <p className="mt-4 border-l-4 border-teal-500/60 pl-4 text-xs leading-relaxed text-brand-600 sm:text-sm">
          UK left-hand traffic, Highway Code markings, and ADI teaching language. Independent teaching aid, not
          affiliated with DVSA.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ListPanel title="Teaching points" items={diagram.teachingPoints} tone="teaching" />
        <ListPanel title="Common mistakes" items={diagram.commonMistakes} tone="mistakes" />
      </div>

      <RelatedDiagramsPanel diagrams={related} browseCategory={browseCategory} />
    </div>
  );
}
