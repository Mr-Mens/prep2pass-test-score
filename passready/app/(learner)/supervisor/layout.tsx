import { SupervisorShell } from "@/components/supervisor/SupervisorShell";
import { requireParentSession } from "@/lib/server/supervisor-page-auth";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireParentSession();
  const displayName = user.firstName || "Supervisor";

  return (
    <SupervisorShell supervisorEmail={user.email} displayName={displayName}>
      {children}
    </SupervisorShell>
  );
}
