import Link from "next/link";

import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listMockTestsForInstructor } from "@/lib/server/repositories/instructor-mock-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export default async function InstructorMockTestsListPage() {
  const user = await requireInstructorSession();
  const tests = isSupabaseConfigured() ? await listMockTestsForInstructor(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Mock test reports</h1>
          <p className="mt-2 text-sm text-brand-600">Drafts and completed DVSA-style mock tests.</p>
        </div>
        <Link
          href="/instructor/mock-test/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          New mock test
        </Link>
      </div>

      <ul className="space-y-3">
        {tests.length === 0 ? (
          <li className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-brand-600 shadow-sm">
            No mock tests yet.{" "}
            <Link href="/instructor/mock-test/new" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
              Start your first
            </Link>
            .
          </li>
        ) : (
          tests.map((t) => (
            <li key={t.id}>
              <Link
                href={t.status === "completed" ? `/instructor/mock-tests/${t.id}` : `/instructor/mock-test/new?id=${t.id}`}
                className="flex flex-col gap-2 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-brand-950">
                    {t.pupil_name_snapshot?.trim() || "Unnamed pupil"}
                  </p>
                  <p className="truncate text-sm text-brand-500">{t.pupil_email_snapshot || "—"}</p>
                  <p className="mt-1 text-xs text-brand-400">
                    Updated {new Date(t.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      t.status === "completed" ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      t.outcome === "pass"
                        ? "bg-teal-50 text-teal-900 ring-1 ring-teal-200"
                        : t.outcome === "fail"
                          ? "bg-red-50 text-red-900 ring-1 ring-red-200"
                          : "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
                    }`}
                  >
                    {t.outcome}
                  </span>
                  <span className="text-xs text-brand-500">
                    {t.minor_fault_count} minors · {t.serious_fault_count}S · {t.dangerous_fault_count}D
                  </span>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
