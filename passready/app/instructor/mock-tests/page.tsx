import Link from "next/link";

import { InstructorMockTestsList } from "@/components/instructor/InstructorMockTestsList";
import { mockTestRowToListItem } from "@/lib/instructor/mock-test-list-utils";
import { requireInstructorSession } from "@/lib/server/instructor-page-auth";
import { listMockTestsForInstructor } from "@/lib/server/repositories/instructor-mock-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export default async function InstructorMockTestsListPage() {
  const user = await requireInstructorSession();
  const tests = isSupabaseConfigured() ? await listMockTestsForInstructor(user.id) : [];
  const listItems = tests.map(mockTestRowToListItem);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950 sm:text-3xl">Mock test reports</h1>
          <p className="mt-2 text-sm text-brand-600">
            Grouped by pupil with search and filters — find the right mock quickly, even with a large history.
          </p>
        </div>
        <Link
          href="/instructor/mock-test/new"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          New mock test
        </Link>
      </div>

      <InstructorMockTestsList tests={listItems} />
    </div>
  );
}
