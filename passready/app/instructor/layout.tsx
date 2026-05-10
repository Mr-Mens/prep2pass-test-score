import { InstructorShell } from "@/components/instructor/InstructorShell";
import { getInstructorProfileDisplay, requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireInstructorSession();
  const profile = await getInstructorProfileDisplay(user.id);
  const sb = createSupabaseServerClient();
  const {
    data: { user: raw },
  } = await sb.auth.getUser();
  const md = raw?.user_metadata as Record<string, unknown> | undefined;
  const first =
    (typeof md?.first_name === "string" && md.first_name.trim()) ||
    (typeof md?.firstName === "string" && md.firstName.trim()) ||
    "";
  const displayName = profile?.display_name?.trim() || first || "Instructor";

  return (
    <InstructorShell
      instructorEmail={user.email}
      displayName={displayName}
      adiPlaceholder={profile?.adi_number_placeholder ?? null}
    >
      {children}
    </InstructorShell>
  );
}
