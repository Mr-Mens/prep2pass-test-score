"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { BRAND_CTA, PRODUCT } from "@/lib/constants";
import {
  PUBLIC_ROADMAP,
  ROADMAP_AUDIENCE_LABELS,
  ROADMAP_FEEDBACK_EMAIL,
  ROADMAP_INTRO,
  ROADMAP_LAST_UPDATED,
  ROADMAP_STATUS_META,
  ROADMAP_STATUS_ORDER,
  type RoadmapAudience,
  type RoadmapItem,
  type RoadmapStatus,
  roadmapItemsByStatus,
  roadmapItemsForAudience,
} from "@/lib/content/public-roadmap";

type AudienceFilter = RoadmapAudience | "all";

const AUDIENCE_FILTERS: { id: AudienceFilter; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "learner", label: ROADMAP_AUDIENCE_LABELS.learner },
  { id: "instructor", label: ROADMAP_AUDIENCE_LABELS.instructor },
  { id: "supervisor", label: ROADMAP_AUDIENCE_LABELS.supervisor },
  { id: "platform", label: ROADMAP_AUDIENCE_LABELS.platform },
];

const STATUS_STYLES: Record<
  RoadmapStatus,
  { badge: string; dot: string; section: string }
> = {
  shipped: {
    badge: "bg-teal-50 text-teal-900 ring-teal-100",
    dot: "bg-teal-500",
    section: "border-teal-200/70 bg-teal-50/30",
  },
  in_progress: {
    badge: "bg-sky-50 text-sky-900 ring-sky-100",
    dot: "bg-sky-500",
    section: "border-sky-200/70 bg-sky-50/25",
  },
  planned: {
    badge: "bg-brand-50 text-brand-900 ring-brand-100",
    dot: "bg-brand-500",
    section: "border-brand-200/70 bg-white",
  },
  exploring: {
    badge: "bg-violet-50 text-violet-900 ring-violet-100",
    dot: "bg-violet-500",
    section: "border-dashed border-brand-200/80 bg-brand-50/20",
  },
};

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const styles = STATUS_STYLES[item.status];

  return (
    <article className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm ring-1 ring-black/[0.02] transition hover:border-teal-200/60 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-heading text-base font-semibold text-brand-950 sm:text-lg">{item.title}</h3>
        {item.timeframe ? (
          <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
            {item.timeframe}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-600">{item.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.audiences.map((audience) => (
          <span
            key={audience}
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${styles.badge}`}
          >
            {ROADMAP_AUDIENCE_LABELS[audience]}
          </span>
        ))}
      </div>
    </article>
  );
}

function StatusSection({
  status,
  items,
}: {
  status: RoadmapStatus;
  items: RoadmapItem[];
}) {
  if (items.length === 0) return null;

  const meta = ROADMAP_STATUS_META[status];
  const styles = STATUS_STYLES[status];

  return (
    <section
      className={`rounded-3xl border p-5 sm:p-6 lg:p-8 ${styles.section}`}
      aria-labelledby={`roadmap-${status}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden />
            <h2 id={`roadmap-${status}`} className="font-heading text-xl font-semibold text-brand-950 sm:text-2xl">
              {meta.label}
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-600">{meta.summary}</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <RoadmapCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function PublicRoadmap() {
  const [audience, setAudience] = useState<AudienceFilter>("all");

  const filtered = useMemo(() => roadmapItemsForAudience(audience), [audience]);
  const grouped = useMemo(() => roadmapItemsByStatus(filtered), [filtered]);

  const shippedCount = PUBLIC_ROADMAP.filter((item) => item.status === "shipped").length;
  const inBuildCount = PUBLIC_ROADMAP.filter((item) => item.status === "in_progress").length;

  return (
    <div className="space-y-10 sm:space-y-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">Product roadmap</p>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
          Where {PRODUCT.name} is heading
        </h1>
        <p className="mt-4 text-base leading-relaxed text-brand-700 sm:text-lg">{ROADMAP_INTRO}</p>
        <p className="mt-3 text-sm text-brand-500">Last updated {ROADMAP_LAST_UPDATED}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Live features", value: String(shippedCount), hint: "Shipping today" },
          { label: "In build", value: String(inBuildCount), hint: "Active development" },
          { label: "Built with", value: "UK ADIs", hint: "Instructor-led product decisions" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-brand-100 bg-white px-5 py-4 text-center shadow-sm ring-1 ring-black/[0.02]"
          >
            <p className="text-2xl font-semibold text-brand-950">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-brand-900">{stat.label}</p>
            <p className="mt-1 text-xs text-brand-500">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {AUDIENCE_FILTERS.map((filter) => {
          const active = audience === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setAudience(filter.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-900 text-white shadow-sm"
                  : "border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
              }`}
              aria-pressed={active}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {ROADMAP_STATUS_ORDER.map((status) => (
          <StatusSection key={status} status={status} items={grouped[status]} />
        ))}
      </div>

      <section className="rounded-3xl border border-brand-200/80 bg-gradient-to-br from-white via-brand-50/60 to-teal-50/40 p-6 text-center shadow-card ring-1 ring-black/[0.02] sm:p-10">
        <h2 className="font-heading text-2xl font-semibold text-brand-950 sm:text-3xl">Shape what we build next</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-brand-700 sm:text-base">
          We prioritise features that help learners pass safely, instructors teach efficiently, and supervisors
          support practice with confidence. Tell us what would make the biggest difference for you.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href={`mailto:${ROADMAP_FEEDBACK_EMAIL}?subject=Pass%20Pilot%20roadmap%20feedback`}>
            Send feedback
          </Button>
          <Button href="/assessment" variant="secondary">
            {BRAND_CTA.getMyScore}
          </Button>
        </div>
        <p className="mt-4 text-xs text-brand-500">
          Roadmap items are directional, not contractual commitments. Timelines may change as we ship and learn.
        </p>
      </section>

      <p className="text-center text-sm text-brand-600">
        New to {PRODUCT.name}?{" "}
        <Link href="/pricing" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
          View pricing
        </Link>{" "}
        or{" "}
        <Link href="/faq" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
          read the FAQ
        </Link>
        .
      </p>
    </div>
  );
}
