import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getUserProfile } from "@/lib/server/repositories/user-profiles-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InstructorSettingsPage() {
  const user = await requireInstructorSession();
  const profile = await getUserProfile(user.id);

  const sb = createSupabaseServerClient();
  const {
    data: { user: raw },
  } = await sb.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-brand-600">
          Update your instructor profile, location preferences, and ADI/PDI details.
        </p>
      </div>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <ProfileEditForm
          role="instructor"
          initialProfile={profile}
          email={raw?.email ?? user.email}
        />
      </section>
    </div>
  );
}
