import type { Metadata } from "next";
import Link from "next/link";

import { ReflectionForm } from "@/components/reflections/ReflectionForm";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "New lesson reflection",
  description: `Log a lesson reflection on ${SITE.name}.`,
};

export default function NewLearnerReflectionPage() {
  return (
    <div className="space-y-6 pb-4">
      <header>
        <Link
          href="/dashboard/reflections"
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← Back to reflections
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          New reflection
        </h1>
        <p className="mt-2 text-sm text-brand-600">Takes under two minutes. Be honest — it helps your progress insights.</p>
      </header>
      <ReflectionForm cancelHref="/dashboard/reflections" successHref="/dashboard/reflections" />
    </div>
  );
}
