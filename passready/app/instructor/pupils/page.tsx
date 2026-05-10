import { AddPupilForm } from "@/components/instructor/AddPupilForm";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listPupilsForInstructor } from "@/lib/server/repositories/instructor-mock-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export default async function InstructorPupilsPage() {
  const user = await requireInstructorSession();
  const pupils = isSupabaseConfigured() ? await listPupilsForInstructor(user.id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">My pupils</h1>
        <p className="mt-2 text-sm text-brand-600">
          Pupils saved here can be picked quickly when starting a mock test. If a pupil already uses Test Ready Score with
          the same email, we try to link their account automatically.
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
              <li key={p.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-brand-950">{p.pupil_name}</p>
                  <p className="text-sm text-brand-600">{p.pupil_email}</p>
                </div>
                {p.linked_learner_user_id ? (
                  <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-200">
                    Linked to app account
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-brand-400">Not linked yet</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
