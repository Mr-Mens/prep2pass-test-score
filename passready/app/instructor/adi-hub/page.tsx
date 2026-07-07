import type { Metadata } from "next";
import Link from "next/link";

import { comingSoonModulesForAudience } from "@/lib/platform-navigation";

export const metadata: Metadata = {
  title: "ADI Hub · Instructor",
  description: "Part 3 and Standards Check preparation hubs, coming soon on Pass Pilot.",
};

export default function InstructorAdiHubPage() {
  const hubs = comingSoonModulesForAudience("instructor");

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-4">
      <header className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/80 to-teal-50/40 p-8 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800">ADI Hub</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          Professional development
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-brand-700">
          Structured preparation for your Part 3 and Standards Check, launching soon, built alongside your everyday
          teaching tools on Pass Pilot.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {hubs.map((hub) => (
          <Link
            key={hub.id}
            href={hub.href ?? "/instructor/adi-hub"}
            className="group flex h-full flex-col rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold text-brand-950">{hub.label}</h2>
              <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-600">
                Coming soon
              </span>
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-brand-600">{hub.description}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 group-hover:text-teal-900">
              Open hub
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-teal-200/70 bg-teal-50/40 p-5 sm:p-6">
        <p className="font-heading text-lg font-semibold text-brand-950">Already teaching day to day?</p>
        <p className="mt-2 text-sm text-brand-700">
          Read pupil lesson reflections while these hubs are being built.
        </p>
        <Link
          href="/instructor/reflections"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Open Lesson Reviews →
        </Link>
      </section>
    </div>
  );
}
