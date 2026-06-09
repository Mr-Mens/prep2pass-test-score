import Link from "next/link";

import { AddPupilForm } from "@/components/instructor/AddPupilForm";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listPupilsForInstructor } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

function statusBadge(status: string) {
  if (status === "accepted") {
    return (
      <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-200">
        Linked
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
        Awaiting pupil
      </span>
    );
  }
  if (status === "declined") {
    return (
      <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 ring-1 ring-brand-200">
        Declined
      </span>
    );
  }
  return null;
}

export default async function InstructorPupilsPage() {
  const user = await requireInstructorSession();
  const pupils = isSupabaseConfigured() ? await listPupilsForInstructor(user.id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">My pupils</h1>
        <p className="mt-2 text-sm text-brand-600">
          Add a pupil by email. If they use Test Ready Score, they receive an in-app invitation to accept before you can
          view their progress and parent activity.
        </p>
      </div>

      <AddPupilForm />

      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-500">Saved pupils</h2>
        {pupils.length === 0 ? (
          <p className="mt-4 text-sm text-brand-500">No pupils yet — add one above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-100">
            {pupils.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-950">{p.pupil_name}</p>
                  <p className="text-sm text-brand-600">{p.pupil_email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(p.link_status ?? (p.linked_learner_user_id ? "accepted" : "pending"))}
                  {p.link_status === "accepted" ? (
                    <Link
                      href={`/instructor/pupils/${p.id}`}
                      className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
                    >
                      View progress
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
