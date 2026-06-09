import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MockTestSummarySections } from "@/components/instructor/MockTestSummarySections";
import { SendMockTestButton } from "@/components/instructor/SendMockTestButton";
import type { MockTestSummary } from "@/lib/instructor/types";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { getMockTestForInstructor } from "@/lib/server/repositories/instructor-mock-repository";
import { getMockTestDeliveryStatus } from "@/lib/server/repositories/learner-mock-test-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export default async function InstructorMockTestSummaryPage({ params }: { params: { id: string } }) {
  const user = await requireInstructorSession();
  if (!isSupabaseConfigured()) notFound();
  const row = await getMockTestForInstructor(params.id, user.id);
  if (!row) notFound();
  if (row.status === "draft") {
    redirect(`/instructor/mock-test/new?id=${params.id}`);
  }

  const meta = row.summary_json as { summary?: MockTestSummary; failReason?: string | null } | null;
  const summary = meta?.summary;
  const delivery = await getMockTestDeliveryStatus(params.id, user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/instructor/mock-tests"
          className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          ← All mock tests
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Mock test summary</h1>
        <p className="mt-2 text-sm text-brand-600">
          DVSA-style mock test outcome — independent tool, not affiliated with DVSA.
        </p>
      </div>

      <SendMockTestButton mockTestId={row.id} alreadySent={delivery} />

      <MockTestSummarySections row={row} summary={summary} failReason={meta?.failReason} />

      <div className="flex flex-wrap gap-3 pb-8">
        <Link
          href={`/instructor/mock-test/new?id=${row.id}`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 shadow-sm hover:bg-brand-50"
        >
          Edit mock test
        </Link>
        <Link
          href="/instructor/mock-test/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
        >
          New mock test
        </Link>
      </div>
    </div>
  );
}
