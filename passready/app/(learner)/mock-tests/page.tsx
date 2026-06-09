import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { formatIsoDateUk } from "@/lib/formatting";
import { listMockTestDeliveriesForLearner } from "@/lib/server/repositories/learner-mock-test-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getServerAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mock tests",
  description: "Mock test reports shared by your driving instructor.",
};

function outcomeBadge(outcome: string) {
  if (outcome === "pass") {
    return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  }
  if (outcome === "fail") {
    return "bg-red-50 text-red-900 ring-red-200";
  }
  return "bg-amber-50 text-amber-900 ring-amber-200";
}

export default async function LearnerMockTestsPage() {
  const user = await getServerAuthUser();
  if (!user) redirect("/login?next=%2Fmock-tests");
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent("/auth/resume?continue=/mock-tests")}`);
  }

  const items = isSupabaseConfigured() ? await listMockTestDeliveriesForLearner(user.id) : [];

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">Mock tests</h1>
        <p className="mt-2 text-sm leading-relaxed text-brand-600">
          DVSA-style mock test reports your instructor shares with you — separate from your Test Ready Score assessments.
        </p>
      </div>

      {items.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-8 text-center text-sm leading-relaxed text-brand-700">
          No mock test reports yet. When your instructor completes a mock test and sends it to your email, it appears
          here.
        </section>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.deliveryId}>
              <Link
                href={`/mock-tests/${item.mockTestId}`}
                className="group block rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                      From {item.instructorName}
                    </p>
                    <p className="mt-2 text-base font-semibold text-brand-950">Mock test · {formatIsoDateUk(item.sentAt)}</p>
                    <p className="mt-1 text-sm text-brand-600">
                      {item.minorFaultCount} minor{item.seriousFaultCount ? ` · ${item.seriousFaultCount} serious` : ""}
                      {item.dangerousFaultCount ? ` · ${item.dangerousFaultCount} dangerous` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${outcomeBadge(item.outcome)}`}
                  >
                    {item.outcome}
                  </span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 transition group-hover:gap-2">
                  Open report
                  <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-brand-600">
        <Link href="/my-reports" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
          Back to Premium reports
        </Link>
      </p>
    </div>
  );
}
