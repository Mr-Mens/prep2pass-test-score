import { InstructorShell } from "@/components/instructor/InstructorShell";
import { getInstructorProfileDisplay, requireInstructorSession } from "@/lib/server/instructor-page-auth";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireInstructorSession();
  const profile = await getInstructorProfileDisplay(user.id);
  const displayName = profile?.display_name?.trim() || user.firstName || "Instructor";

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
