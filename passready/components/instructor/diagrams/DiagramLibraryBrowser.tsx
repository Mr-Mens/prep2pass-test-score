"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { DiagramMedia } from "@/components/instructor/diagrams/DiagramMedia";
import { DIAGRAM_CATEGORIES } from "@/lib/instructor/diagrams/categories";
import { difficultyBadgeClass, difficultyLabel, formatTeachingTime } from "@/lib/instructor/diagrams/format";
import {
  diagramDetailHref,
  parseDiagramCategoryFilter,
} from "@/lib/instructor/diagrams/navigation";
import { filterDiagramsByCategory, filterDiagramsByQuery } from "@/lib/instructor/diagrams/search";
import type { DiagramCategorySlug, TeachingDiagram } from "@/lib/instructor/diagrams/types";

type Props = {
  diagrams: TeachingDiagram[];
};

function CategoryOverviewCards({
  diagrams,
  activeCategory,
  onSelect,
}: {
  diagrams: TeachingDiagram[];
  activeCategory: DiagramCategorySlug | "all";
  onSelect: (category: DiagramCategorySlug) => void;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DIAGRAM_CATEGORIES.map((category) => {
        const count = diagrams.filter((diagram) => diagram.category === category.slug).length;
        const isActive = activeCategory === category.slug;

        return (
          <button
            key={category.slug}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(category.slug)}
            className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 ${
              isActive
                ? "border-teal-300 bg-teal-50/60 ring-2 ring-teal-200"
                : "border-brand-100 bg-white"
            }`}
          >
            <p className="font-heading text-sm font-semibold text-brand-950">{category.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-600">{category.description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal-700">
              {count} diagram{count === 1 ? "" : "s"}
            </p>
          </button>
        );
      })}
    </section>
  );
}

function DiagramCard({
  diagram,
  browseCategory,
}: {
  diagram: TeachingDiagram;
  browseCategory: DiagramCategorySlug | "all";
}) {
  return (
    <Link
      href={diagramDetailHref(diagram.slug, browseCategory)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"
    >
      <div className="border-b border-brand-100 bg-gradient-to-br from-slate-100 via-white to-teal-50/40 p-3">
        <DiagramMedia
          image={diagram.image}
          alt={diagram.title}
          Component={diagram.Component}
          variant="thumbnail"
          className="h-44 w-full rounded-xl bg-white shadow-inner ring-1 ring-brand-100/80 sm:h-48"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-800">
            {DIAGRAM_CATEGORIES.find((c) => c.slug === diagram.category)?.name}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${difficultyBadgeClass(diagram.difficulty)}`}
          >
            {difficultyLabel(diagram.difficulty)}
          </span>
        </div>
        <h2 className="mt-3 font-heading text-lg font-semibold tracking-tight text-brand-950 group-hover:text-teal-900">
          {diagram.title}
        </h2>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-600">{diagram.description}</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-500">
          Teaching time · {formatTeachingTime(diagram.teachingTimeMinutes)}
        </p>
      </div>
    </Link>
  );
}

export function DiagramLibraryBrowser({ diagrams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryFromUrl = parseDiagramCategoryFilter(searchParams.get("category"));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DiagramCategorySlug | "all">(categoryFromUrl);
  const libraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const filtered = useMemo(() => {
    const byCategory = filterDiagramsByCategory(diagrams, category);
    return filterDiagramsByQuery(byCategory, query);
  }, [category, diagrams, query]);

  function selectCategory(next: DiagramCategorySlug | "all") {
    setCategory(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("category");
    else params.set("category", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    libraryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-8">
      <CategoryOverviewCards
        diagrams={diagrams}
        activeCategory={category}
        onSelect={(slug) => selectCategory(slug)}
      />

      <div ref={libraryRef} className="space-y-6 scroll-mt-24">
      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">Search diagrams</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by topic, manoeuvre, or keyword…"
            className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3 text-sm text-brand-950 outline-none ring-teal-500/0 transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-200"
          />
        </label>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                category === "all"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
              }`}
            >
              All
            </button>
            {DIAGRAM_CATEGORIES.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => selectCategory(item.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  category === item.slug
                    ? "bg-teal-700 text-white shadow-sm"
                    : "bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-brand-600">
        {filtered.length} diagram{filtered.length === 1 ? "" : "s"} · UK left-hand traffic · Highway Code aligned
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold text-brand-950">No diagrams match your search</p>
          <p className="mt-2 text-sm text-brand-600">Try another keyword or reset the category filter.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((diagram) => (
            <DiagramCard key={diagram.slug} diagram={diagram} browseCategory={category} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
