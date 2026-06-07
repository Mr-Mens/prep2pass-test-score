import type { Metadata } from "next";

import { PracticeLogForm } from "@/components/supervisor/PracticeLogForm";
import { SupervisorDisclaimers } from "@/components/supervisor/SupervisorDisclaimers";
import { listPracticeLogsForParent } from "@/lib/server/repositories/practice-log-repository";
import { requireParentSession } from "@/lib/server/supervisor-page-auth";

export const metadata: Metadata = {
  title: "Practice log · Parent supervisor",
  description: "Log private practice sessions with your learner.",
};

export default async function SupervisorPracticeLogPage() {
  const user = await requireParentSession();
  const logs = await listPracticeLogsForParent(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">Practice log</h1>
        <p className="mt-2 text-sm text-brand-600">
          Record private practice sessions to track confidence, skills, and what to revisit next.
        </p>
      </header>
      <PracticeLogForm recentLogs={logs} />
      <SupervisorDisclaimers compact />
    </div>
  );
}
