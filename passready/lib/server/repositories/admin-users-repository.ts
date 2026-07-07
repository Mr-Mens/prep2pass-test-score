import "server-only";

import { normalizeAccountStatus, type AccountStatus } from "@/lib/account/account-status";
import type { UserAppRole } from "@/lib/instructor/types";
import { adminSetAccountStatus, adminSetUserAppRole } from "@/lib/server/user-app-role";
import type { SubscriptionStatus } from "@/lib/server/repositories/subscriptions-repository";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type AdminUserListItem = {
  id: string;
  email: string;
  role: UserAppRole;
  accountStatus: AccountStatus;
  createdAt: string;
  emailConfirmedAt: string | null;
  fullName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  lifetimeAccess: boolean;
};

type AuthUser = {
  id: string;
  email?: string | null;
  created_at?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

const DEFAULT_PER_PAGE = 25;
const MAX_SCAN_PAGES = 25;

function normalizeEmail(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function fullNameFromMetadata(metadata: Record<string, unknown> | undefined): string | null {
  const full =
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata?.fullName === "string" && metadata.fullName.trim()) ||
    "";
  return full || null;
}

async function enrichUsers(authUsers: AuthUser[]): Promise<AdminUserListItem[]> {
  if (authUsers.length === 0) return [];

  const ids = authUsers.map((user) => user.id);
  const supabase = getSupabaseServerClient();

  const [profilesRes, subscriptionsRes, entitlementsRes, userProfilesRes] = await Promise.all([
    supabase.from("user_app_profiles").select("user_id, role, account_status").in("user_id", ids),
    supabase.from("user_subscriptions").select("user_id, status").in("user_id", ids),
    supabase.from("user_entitlements").select("user_id, lifetime_access").in("user_id", ids),
    supabase.from("user_profiles").select("user_id, full_name").in("user_id", ids),
  ]);

  const profileByUser = new Map(
    (profilesRes.data ?? []).map((row) => {
      const typed = row as { user_id: string; role: string; account_status?: string };
      return [
        typed.user_id,
        {
          role: typed.role as UserAppRole,
          accountStatus: normalizeAccountStatus(typed.account_status),
        },
      ] as const;
    }),
  );

  const subscriptionByUser = new Map(
    (subscriptionsRes.data ?? []).map((row) => {
      const typed = row as { user_id: string; status: SubscriptionStatus };
      return [typed.user_id, typed.status] as const;
    }),
  );

  const lifetimeByUser = new Map(
    (entitlementsRes.data ?? []).map((row) => {
      const typed = row as { user_id: string; lifetime_access: boolean };
      return [typed.user_id, typed.lifetime_access] as const;
    }),
  );

  const fullNameByUser = new Map(
    (userProfilesRes.data ?? []).map((row) => {
      const typed = row as { user_id: string; full_name: string | null };
      return [typed.user_id, typed.full_name] as const;
    }),
  );

  return authUsers
    .filter((user) => user.email?.trim())
    .map((user) => {
      const profile = profileByUser.get(user.id);
      const metadataName = fullNameFromMetadata(user.user_metadata);
      return {
        id: user.id,
        email: normalizeEmail(user.email),
        role: profile?.role ?? "learner",
        accountStatus: profile?.accountStatus ?? "active",
        createdAt: user.created_at ?? new Date(0).toISOString(),
        emailConfirmedAt: user.email_confirmed_at ?? null,
        fullName: fullNameByUser.get(user.id) ?? metadataName,
        subscriptionStatus: subscriptionByUser.get(user.id) ?? null,
        lifetimeAccess: lifetimeByUser.get(user.id) ?? false,
      };
    });
}

function applyFilters(
  users: AdminUserListItem[],
  filters: { role?: UserAppRole | "all"; accountStatus?: AccountStatus | "all" },
): AdminUserListItem[] {
  return users.filter((user) => {
    if (filters.role && filters.role !== "all" && user.role !== filters.role) return false;
    if (filters.accountStatus && filters.accountStatus !== "all" && user.accountStatus !== filters.accountStatus) {
      return false;
    }
    return true;
  });
}

async function listAuthUsersPage(page: number, perPage: number): Promise<AuthUser[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) throw error;
  return data.users as AuthUser[];
}

async function findAuthUsersByEmailQuery(query: string, perPage: number): Promise<AuthUser[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const matches: AuthUser[] = [];
  for (let page = 1; page <= MAX_SCAN_PAGES; page += 1) {
    const users = await listAuthUsersPage(page, 200);
    for (const user of users) {
      const email = normalizeEmail(user.email);
      if (email.includes(needle)) matches.push(user);
      if (matches.length >= perPage) return matches;
    }
    if (users.length < 200) break;
  }
  return matches;
}

export async function listAdminUsers(input: {
  page?: number;
  perPage?: number;
  query?: string;
  role?: UserAppRole | "all";
  accountStatus?: AccountStatus | "all";
}): Promise<{
  users: AdminUserListItem[];
  page: number;
  perPage: number;
  hasMore: boolean;
}> {
  const page = Math.max(1, input.page ?? 1);
  const perPage = Math.min(100, Math.max(1, input.perPage ?? DEFAULT_PER_PAGE));
  const query = input.query?.trim() ?? "";

  let authUsers: AuthUser[];
  let hasMore = false;

  if (query) {
    authUsers = await findAuthUsersByEmailQuery(query, perPage);
  } else {
    authUsers = await listAuthUsersPage(page, perPage);
    hasMore = authUsers.length === perPage;
  }

  const enriched = applyFilters(await enrichUsers(authUsers), {
    role: input.role,
    accountStatus: input.accountStatus,
  });

  return { users: enriched, page, perPage, hasMore };
}

export async function createAdminUser(input: {
  email: string;
  password: string;
  role: UserAppRole;
  fullName?: string;
}): Promise<AdminUserListItem> {
  const supabase = getSupabaseServerClient();
  const email = input.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      app_role: input.role,
      ...(input.fullName?.trim() ? { full_name: input.fullName.trim() } : {}),
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new Error("An account with this email already exists.");
    }
    throw error;
  }

  const user = data.user;
  if (!user?.id || !user.email) {
    throw new Error("Could not create account.");
  }

  await adminSetUserAppRole(user.id, input.role);

  if (input.fullName?.trim()) {
    await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        full_name: input.fullName.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  const [enriched] = await enrichUsers([user as AuthUser]);
  if (!enriched) throw new Error("Could not load created account.");
  return enriched;
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function updateAdminUser(input: {
  userId: string;
  role?: UserAppRole;
  accountStatus?: AccountStatus;
}): Promise<AdminUserListItem> {
  if (input.role) {
    await adminSetUserAppRole(input.userId, input.role);
  }
  if (input.accountStatus) {
    await adminSetAccountStatus(input.userId, input.accountStatus);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.admin.getUserById(input.userId);
  if (error || !data.user) {
    throw new Error("Account not found.");
  }

  const [enriched] = await enrichUsers([data.user as AuthUser]);
  if (!enriched) throw new Error("Account not found.");
  return enriched;
}

export async function getAdminUserById(userId: string): Promise<AdminUserListItem | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) return null;
  const [enriched] = await enrichUsers([data.user as AuthUser]);
  return enriched ?? null;
}
