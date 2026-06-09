import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { MockTestSummarySections } from "@/components/instructor/MockTestSummarySections";
import type { MockTestSummary } from "@/lib/instructor/types";
import { formatIsoDateUk } from "@/lib/formatting";
import { getMockTestDeliveryForLearner } from "@/lib/server/repositories/learner-mock-test-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import { getServerAuthUser } from "@/lib/supabase/server";

type Props = { params: { id: string } };

const paramsSchema = z.object({ id: z.string().uuid() });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Mock test report" };
}

export default async function LearnerMockTestDetailPage({ params }: Props) {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) notFound();

  const user = await getServerAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/mock-tests/${parsed.data.id}`)}`);
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent(`/mock-tests/${parsed.data.id}`)}`);
  }
  if (!isSupabaseConfigured()) notFound();

  const bundle = await getMockTestDeliveryForLearner(parsed.data.id, user.id);
  if (!bundle) notFound();

  const meta = bundle.mockTest.summary_json as { summary?: MockTestSummary; failReason?: string | null } | null;
  const summary = meta?.summary;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header>
        <Link href="/mock-tests" className="text-sm font-semibold text-teal-800 underline-offset-4 hover:underline">
          ← Mock tests
        </Link>
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand-950">Mock test report</h1>
        <p className="mt-2 text-sm text-brand-600">
          Shared by {bundle.instructorName} · {formatIsoDateUk(bundle.sent_at)}
        </p>
      </header>

      <MockTestSummarySections row={bundle.mockTest} summary={summary} failReason={meta?.failReason} showCandidate={false} />
    </div>
  );
}
