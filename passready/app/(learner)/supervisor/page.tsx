import type { Metadata } from "next";

import { SupervisorMigrationBanner } from "@/components/supervisor/SupervisorMigrationBanner";
import { SafetyGuidanceSection } from "@/components/supervisor/SafetyGuidanceSection";
import { ShareInstructorPlaceholder } from "@/components/supervisor/ShareInstructorPlaceholder";
import { SupervisorDashboardSections } from "@/components/supervisor/SupervisorDashboardSections";
import { SupervisorDisclaimers } from "@/components/supervisor/SupervisorDisclaimers";
import { buildSupervisorDashboardView } from "@/lib/supervisor/build-dashboard-view";
import { listPracticeLogsForParent } from "@/lib/server/repositories/practice-log-repository";
import { isSupervisorModuleReady } from "@/lib/server/supervisor-schema";
import { requireParentSession } from "@/lib/server/supervisor-page-auth";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Parent & Supervisor Dashboard · Pass Pilot",
  description: `${SITE.name}: support your learner during private practice with scores, guidance, and practice logs.`,
};

export default async function SupervisorDashboardPage() {
  const user = await requireParentSession();
  const [view, recentLogs, moduleReady] = await Promise.all([
    buildSupervisorDashboardView(user.id),
    listPracticeLogsForParent(user.id, 3),
    isSupervisorModuleReady(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Parent &amp; supervisor workspace</p>
        <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">
          Parent &amp; Supervisor Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-700 sm:text-base">
          Support your learner&apos;s journey with confidence.
        </p>
      </header>

      {!moduleReady ? <SupervisorMigrationBanner /> : null}

      <SupervisorDashboardSections view={view} />

      {recentLogs.length > 0 ? (
        <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold text-brand-950">Recent practice</h2>
            <a href="/supervisor/practice-log" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
              View all
            </a>
          </div>
          <ul className="mt-4 divide-y divide-brand-100">
            {recentLogs.map((log) => (
              <li key={log.id} className="py-3 first:pt-0">
                <p className="text-sm font-semibold text-brand-950">
                  {new Date(log.practiced_on).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <span className="font-normal text-brand-600">
                    {" "}
                    · {log.duration_minutes} min · {log.road_type}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <SafetyGuidanceSection />
      <ShareInstructorPlaceholder />
      <SupervisorDisclaimers />
    </div>
  );
}
