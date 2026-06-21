import type { MockTestRow } from "@/lib/server/repositories/instructor-mock-repository";

export type MockTestListItem = {
  id: string;
  pupilId: string | null;
  pupilName: string;
  pupilEmail: string;
  status: MockTestRow["status"];
  outcome: MockTestRow["outcome"];
  minorFaultCount: number;
  seriousFaultCount: number;
  dangerousFaultCount: number;
  updatedAt: string;
};

export type MockTestStatusFilter = "all" | MockTestRow["status"];
export type MockTestOutcomeFilter = "all" | MockTestRow["outcome"];

export type MockTestListFilters = {
  query: string;
  status: MockTestStatusFilter;
  outcome: MockTestOutcomeFilter;
};

export type PupilMockTestGroup = {
  key: string;
  pupilName: string;
  pupilEmail: string;
  tests: MockTestListItem[];
  latestUpdatedAt: string;
};

export function mockTestRowToListItem(row: MockTestRow): MockTestListItem {
  return {
    id: row.id,
    pupilId: row.pupil_id,
    pupilName: row.pupil_name_snapshot?.trim() || "Unnamed pupil",
    pupilEmail: row.pupil_email_snapshot?.trim() || "",
    status: row.status,
    outcome: row.outcome,
    minorFaultCount: row.minor_fault_count,
    seriousFaultCount: row.serious_fault_count,
    dangerousFaultCount: row.dangerous_fault_count,
    updatedAt: row.updated_at,
  };
}

export function pupilGroupKey(test: MockTestListItem): string {
  if (test.pupilId) return `id:${test.pupilId}`;
  const email = test.pupilEmail.trim().toLowerCase();
  if (email) return `email:${email}`;
  const name = test.pupilName.trim().toLowerCase();
  if (name && name !== "unnamed pupil") return `name:${name}`;
  return `unknown:${test.id}`;
}

function matchesQuery(test: MockTestListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return test.pupilName.toLowerCase().includes(q) || test.pupilEmail.toLowerCase().includes(q);
}

export function filterMockTests(tests: MockTestListItem[], filters: MockTestListFilters): MockTestListItem[] {
  return tests.filter((test) => {
    if (filters.status !== "all" && test.status !== filters.status) return false;
    if (filters.outcome !== "all" && test.outcome !== filters.outcome) return false;
    return matchesQuery(test, filters.query);
  });
}

export function groupMockTestsByPupil(tests: MockTestListItem[]): PupilMockTestGroup[] {
  const groups = new Map<string, PupilMockTestGroup>();

  for (const test of tests) {
    const key = pupilGroupKey(test);
    const existing = groups.get(key);
    if (existing) {
      existing.tests.push(test);
      if (new Date(test.updatedAt).getTime() > new Date(existing.latestUpdatedAt).getTime()) {
        existing.latestUpdatedAt = test.updatedAt;
      }
      continue;
    }
    groups.set(key, {
      key,
      pupilName: test.pupilName,
      pupilEmail: test.pupilEmail,
      tests: [test],
      latestUpdatedAt: test.updatedAt,
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      tests: [...group.tests].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    }))
    .sort((a, b) => new Date(b.latestUpdatedAt).getTime() - new Date(a.latestUpdatedAt).getTime());
}

export function summarizeMockTestFilters(
  total: number,
  visible: number,
  groupCount: number,
  filters: MockTestListFilters,
): string {
  const parts: string[] = [];
  if (filters.query.trim()) parts.push(`matching “${filters.query.trim()}”`);
  if (filters.status !== "all") parts.push(filters.status);
  if (filters.outcome !== "all") parts.push(filters.outcome);
  const filterLabel = parts.length > 0 ? parts.join(" · ") : "all mock tests";
  return `${visible} of ${total} ${filterLabel} · ${groupCount} pupil${groupCount === 1 ? "" : "s"}`;
}
