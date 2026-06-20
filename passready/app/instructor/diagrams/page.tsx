import type { Metadata } from "next";
import Link from "next/link";

import { DiagramLibraryBrowser } from "@/components/instructor/diagrams/DiagramLibraryBrowser";
import { getAllTeachingDiagrams } from "@/lib/instructor/diagrams/get-diagram";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Teaching diagrams",
  description: `UK Highway Code teaching diagrams for ${SITE.name} instructors.`,
};

export default function InstructorDiagramsPage() {
  const diagrams = getAllTeachingDiagrams();

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-4">
      <section className="relative overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-br from-white via-brand-50/80 to-teal-50/50 shadow-card ring-1 ring-brand-100/70">
        <div
          className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative px-8 py-10 sm:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-800/90">Instructor toolkit</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Teaching diagrams
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-brand-700 sm:text-base">
            UK Highway Code whiteboard diagrams with teaching points, common mistakes, and lesson-ready layouts. Search
            by topic, filter by category, and open any diagram fullscreen during a lesson.
          </p>
          <p className="mt-4 max-w-3xl border-l-4 border-teal-500/60 pl-4 text-xs leading-relaxed text-brand-600 sm:text-sm">
            Independent teaching aid aligned with the Highway Code. Not affiliated with DVSA.
          </p>
        </div>
      </section>

      <DiagramLibraryBrowser diagrams={diagrams} />

      <p className="text-center text-xs text-brand-500">
        Need a diagram on the move?{" "}
        <Link href="/instructor/diagrams/left-emerge" className="font-semibold text-teal-700 hover:underline">
          Open a sample
        </Link>
      </p>
    </div>
  );
}
