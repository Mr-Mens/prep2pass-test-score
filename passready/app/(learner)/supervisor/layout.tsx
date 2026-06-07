import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireParentSession } from "@/lib/server/supervisor-page-auth";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireParentSession();

  const sb = createSupabaseServerClient();
  const {
    data: { user: raw },
  } = await sb.auth.getUser();
  const md = raw?.user_metadata as Record<string, unknown> | undefined;
  const first =
    (typeof md?.first_name === "string" && md.first_name.trim()) ||
    (typeof md?.firstName === "string" && md.firstName.trim()) ||
    "";
  const displayName = first || "Supervisor";

  return (
    <SupervisorShell supervisorEmail={user.email} displayName={displayName}>
      {children}
    </SupervisorShell>
  );
}
