"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { formatAccountStatusLabel, type AccountStatus } from "@/lib/account/account-status";
import { Button } from "@/components/Button";
import type { UserAppRole } from "@/lib/instructor/types";

type AdminUser = {
  id: string;
  email: string;
  role: UserAppRole;
  accountStatus: AccountStatus;
  createdAt: string;
  emailConfirmedAt: string | null;
  fullName: string | null;
  subscriptionStatus: string | null;
  lifetimeAccess: boolean;
};

type RoleFilter = "all" | UserAppRole;
type StatusFilter = "all" | AccountStatus;

type Props = {
  adminKey: string;
};

const ROLE_LABELS: Record<UserAppRole, string> = {
  learner: "Learner",
  instructor: "Instructor",
  parent: "Parent / supervisor",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function accessSummary(user: AdminUser): string {
  if (user.lifetimeAccess) return "Lifetime";
  if (user.subscriptionStatus && user.subscriptionStatus !== "inactive") {
    return user.subscriptionStatus.replace("_", " ");
  }
  return "Free / none";
}

export function AdminAccountsPanel({ adminKey }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [migrationHint, setMigrationHint] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<UserAppRole>("learner");
  const [createFullName, setCreateFullName] = useState("");

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-access-key": adminKey,
    }),
    [adminKey],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: "25",
        role: roleFilter,
        accountStatus: statusFilter,
      });
      if (query.trim()) params.set("query", query.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { "x-admin-access-key": adminKey },
      });
      const json = (await res.json()) as {
        success?: boolean;
        users?: AdminUser[];
        hasMore?: boolean;
        hint?: string;
        migrationRequired?: boolean;
        error?: { message?: string };
      };

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "Could not load accounts.");
      }

      setUsers(json.users ?? []);
      setHasMore(Boolean(json.hasMore));
      if (json.migrationRequired && json.hint) setMigrationHint(json.hint);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load accounts.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey, page, query, roleFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchUser(userId: string, patch: { role?: UserAppRole; accountStatus?: AccountStatus }) {
    setBusyId(userId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "Could not update account.");
      }
      setMessage("Account updated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update account.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Delete ${user.email}? This permanently removes the auth account and linked data.`,
    );
    if (!confirmed) return;

    setBusyId(user.id);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { "x-admin-access-key": adminKey },
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "Could not delete account.");
      }
      setMessage(`${user.email} deleted.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete account.");
    } finally {
      setBusyId(null);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
          ...(createFullName.trim() ? { fullName: createFullName.trim() } : {}),
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message ?? "Could not create account.");
      }
      setMessage(`Account created for ${createEmail.trim().toLowerCase()}.`);
      setCreateEmail("");
      setCreatePassword("");
      setCreateFullName("");
      setPage(1);
      setQuery("");
      setQueryInput("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account.");
    } finally {
      setCreating(false);
    }
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]">
        <h2 className="font-heading text-xl font-semibold text-brand-950">Create account</h2>
        <p className="mt-2 text-sm text-brand-600">
          Manually provision a learner, instructor, or parent account with email already confirmed.
        </p>

        <form onSubmit={(e) => void onCreate(e)} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="create-email">
              Email
            </label>
            <input
              id="create-email"
              type="email"
              required
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className="mt-2 block min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="create-password">
              Temporary password
            </label>
            <input
              id="create-password"
              type="password"
              required
              minLength={8}
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className="mt-2 block min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="create-name">
              Full name (optional)
            </label>
            <input
              id="create-name"
              type="text"
              value={createFullName}
              onChange={(e) => setCreateFullName(e.target.value)}
              className="mt-2 block min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="create-role">
              Role
            </label>
            <select
              id="create-role"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as UserAppRole)}
              className="mt-2 block min-h-[44px] w-full rounded-xl border border-brand-200 px-3 text-sm"
            >
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
              <option value="parent">Parent / supervisor</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-brand-950">Accounts</h2>
            <p className="mt-2 text-sm text-brand-600">
              Browse accounts, change roles, pause access, or delete when needed.
            </p>
          </div>
          <form onSubmit={onSearch} className="flex w-full max-w-md gap-2">
            <input
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search by email"
              className="min-h-[44px] flex-1 rounded-xl border border-brand-200 px-3 text-sm"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as RoleFilter);
              setPage(1);
            }}
            className="min-h-[40px] rounded-lg border border-brand-200 px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="learner">Learners</option>
            <option value="instructor">Instructors</option>
            <option value="parent">Parents</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="min-h-[40px] rounded-lg border border-brand-200 px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        {migrationHint ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {migrationHint}
          </div>
        ) : null}
        {message ? (
          <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">{error}</div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-xs uppercase tracking-wide text-brand-500">
                <th className="px-3 py-3 font-semibold">Account</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Created</th>
                <th className="px-3 py-3 font-semibold">Access</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-brand-600">
                    Loading accounts…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-brand-600">
                    No accounts match your filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const busy = busyId === user.id;
                  return (
                    <tr key={user.id} className="border-b border-brand-50 align-top">
                      <td className="px-3 py-4">
                        <p className="font-medium text-brand-950">{user.email}</p>
                        {user.fullName ? <p className="mt-1 text-brand-600">{user.fullName}</p> : null}
                        <p className="mt-1 text-xs text-brand-500">
                          {user.emailConfirmedAt ? "Email confirmed" : "Email not confirmed"}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <select
                          value={user.role}
                          disabled={busy}
                          onChange={(e) => void patchUser(user.id, { role: e.target.value as UserAppRole })}
                          className="min-h-[36px] rounded-lg border border-brand-200 px-2 text-sm"
                        >
                          <option value="learner">{ROLE_LABELS.learner}</option>
                          <option value="instructor">{ROLE_LABELS.instructor}</option>
                          <option value="parent">{ROLE_LABELS.parent}</option>
                        </select>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.accountStatus === "paused"
                              ? "bg-red-100 text-red-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {formatAccountStatusLabel(user.accountStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-brand-700">{formatDate(user.createdAt)}</td>
                      <td className="px-3 py-4 capitalize text-brand-700">{accessSummary(user)}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-col gap-2">
                          {user.accountStatus === "active" ? (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => void patchUser(user.id, { accountStatus: "paused" })}
                              className="min-h-[36px] px-3 text-xs"
                            >
                              Pause
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              disabled={busy}
                              onClick={() => void patchUser(user.id, { accountStatus: "active" })}
                              className="min-h-[36px] px-3 text-xs"
                            >
                              Reinstate
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => void deleteUser(user)}
                            className="min-h-[36px] px-3 text-xs text-red-800"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!query.trim() ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <p className="text-sm text-brand-600">Page {page}</p>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !hasMore}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
