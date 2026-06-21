"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  filterMockTests,
  groupMockTestsByPupil,
  summarizeMockTestFilters,
  type MockTestListItem,
  type MockTestOutcomeFilter,
  type MockTestStatusFilter,
} from "@/lib/instructor/mock-test-list-utils";

type Props = {
  tests: MockTestListItem[];
};

function StatusBadge({ status }: { status: MockTestListItem["status"] }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        status === "completed"
          ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
          : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
      }`}
    >
      {status}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: MockTestListItem["outcome"] }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        outcome === "pass"
          ? "bg-teal-50 text-teal-900 ring-1 ring-teal-200"
          : outcome === "fail"
            ? "bg-red-50 text-red-900 ring-1 ring-red-200"
            : "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
      }`}
    >
      {outcome}
    </span>
  );
}

function MockTestRowLink({ test }: { test: MockTestListItem }) {
  const href = test.status === "completed" ? `/instructor/mock-tests/${test.id}` : `/instructor/mock-test/new?id=${test.id}`;

  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-xl border border-brand-100 bg-white p-4 transition hover:border-teal-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-950">
          Updated {new Date(test.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <p className="mt-1 text-xs text-brand-500">
          {test.minorFaultCount} minors · {test.seriousFaultCount}S · {test.dangerousFaultCount}D
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={test.status} />
        <OutcomeBadge outcome={test.outcome} />
      </div>
    </Link>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <label className="block min-w-[8.5rem] flex-1 text-xs sm:flex-none">
      <span className="font-semibold uppercase tracking-wide text-brand-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InstructorMockTestsList({ tests }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MockTestStatusFilter>("all");
  const [outcome, setOutcome] = useState<MockTestOutcomeFilter>("all");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const filteredTests = useMemo(
    () => filterMockTests(tests, { query, status, outcome }),
    [tests, query, status, outcome],
  );
  const groups = useMemo(() => groupMockTestsByPupil(filteredTests), [filteredTests]);
  const summary = summarizeMockTestFilters(tests.length, filteredTests.length, groups.length, {
    query,
    status,
    outcome,
  });
  const hasActiveFilters = Boolean(query.trim()) || status !== "all" || outcome !== "all";

  function isGroupExpanded(key: string): boolean {
    if (expandedGroups[key] !== undefined) return expandedGroups[key]!;
    return hasActiveFilters && groups.length <= 8;
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => ({ ...prev, [key]: !isGroupExpanded(key) }));
  }

  function expandAll() {
    setExpandedGroups(Object.fromEntries(groups.map((group) => [group.key, true])));
  }

  function collapseAll() {
    setExpandedGroups(Object.fromEntries(groups.map((group) => [group.key, false])));
  }

  if (tests.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center text-sm text-brand-600 shadow-sm">
        No mock tests yet.{" "}
        <Link href="/instructor/mock-test/new" className="font-semibold text-teal-800 underline-offset-4 hover:underline">
          Start your first
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-5">
        <label className="block text-sm">
          <span className="font-semibold text-brand-900">Search pupils</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email"
            className="mt-2 w-full rounded-xl border border-brand-200 px-3 py-3 text-sm"
          />
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All statuses" },
              { value: "completed", label: "Completed" },
              { value: "draft", label: "Draft" },
            ]}
          />
          <FilterSelect
            label="Outcome"
            value={outcome}
            onChange={setOutcome}
            options={[
              { value: "all", label: "All outcomes" },
              { value: "pass", label: "Pass" },
              { value: "fail", label: "Fail" },
              { value: "undecided", label: "Undecided" },
            ]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-100 pt-4">
          <p className="text-xs text-brand-600">{summary}</p>
          {groups.length > 0 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                Collapse all
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 px-5 py-10 text-center text-sm text-brand-600">
          No mock tests match your search or filters.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const open = isGroupExpanded(group.key);
            return (
              <section key={group.key} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-brand-50/60 sm:px-5"
                  aria-expanded={open}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-950">{group.pupilName}</p>
                    {group.pupilEmail ? (
                      <p className="truncate text-sm text-brand-500">{group.pupilEmail}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-brand-400">
                      Latest update{" "}
                      {new Date(group.latestUpdatedAt).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-100">
                      {group.tests.length} test{group.tests.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-sm text-brand-400" aria-hidden>
                      {open ? "▾" : "▸"}
                    </span>
                  </div>
                </button>

                {open ? (
                  <ul className="space-y-2 border-t border-brand-100 bg-brand-50/20 px-3 py-3 sm:px-4">
                    {group.tests.map((test) => (
                      <li key={test.id}>
                        <MockTestRowLink test={test} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
