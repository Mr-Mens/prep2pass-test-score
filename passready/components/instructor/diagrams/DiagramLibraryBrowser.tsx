"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DiagramMedia } from "@/components/instructor/diagrams/DiagramMedia";
import { DIAGRAM_CATEGORIES } from "@/lib/instructor/diagrams/categories";
import { difficultyBadgeClass, difficultyLabel, formatTeachingTime } from "@/lib/instructor/diagrams/format";
import { filterDiagramsByCategory, filterDiagramsByQuery } from "@/lib/instructor/diagrams/search";
import type { DiagramCategorySlug, TeachingDiagram } from "@/lib/instructor/diagrams/types";

type Props = {
  diagrams: TeachingDiagram[];
};

function DiagramCard({ diagram }: { diagram: TeachingDiagram }) {
  return (
    <Link
      href={`/instructor/diagrams/${diagram.slug}`}
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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DiagramCategorySlug | "all">("all");

  const filtered = useMemo(() => {
    const byCategory = filterDiagramsByCategory(diagrams, category);
    return filterDiagramsByQuery(byCategory, query);
  }, [category, diagrams, query]);

  return (
    <div className="space-y-6">
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
              onClick={() => setCategory("all")}
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
                onClick={() => setCategory(item.slug)}
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
            <DiagramCard key={diagram.slug} diagram={diagram} />
          ))}
        </div>
      )}
    </div>
  );
}
