import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Part 3 Hub · Instructor",
  description: "ADI Part 3 preparation resources — coming soon on Pass Pilot.",
};

export default function InstructorPart3HubPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <header className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/80 to-teal-50/40 p-8 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800">Part 3 Hub</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          ADI Part 3 preparation
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-brand-700">
          Structured teaching scenarios, competency checklists, and reflection prompts for your Part 3 journey — launching
          soon on Pass Pilot.
        </p>
      </header>

      <section className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-brand-950">Coming soon</p>
        <p className="mt-2 text-sm text-brand-600">
          We&apos;re building this hub alongside Lesson Reviews so your teaching practice stays connected.
        </p>
        <Link
          href="/instructor/reflections"
          className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Try Lesson Reviews in the meantime →
        </Link>
      </section>
    </div>
  );
}
