"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { UserAppRole } from "@/lib/instructor/types";

export type LearnerSession = {
  email: string;
  firstName: string;
  hasPremiumAccess: boolean;
};

export type AppSessionUser = {
  email: string;
  firstName: string;
  emailConfirmedAt: string;
  role: UserAppRole;
  hasPremiumAccess: boolean;
};

type AppSessionStatus = "loading" | "signed_out" | "ready";

type AppSessionContextValue = {
  /** Confirmed learner session for in-app chrome; null when guest or non-learner. */
  session: LearnerSession | null;
  /** Full signed-in user when email is confirmed; null when guest. */
  user: AppSessionUser | null;
  status: AppSessionStatus;
  refresh: () => Promise<void>;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

let inflightSessionFetch: Promise<AppSessionUser | null> | null = null;

async function fetchAppSession(): Promise<AppSessionUser | null> {
  if (!inflightSessionFetch) {
    inflightSessionFetch = (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      const raw = (await res.json()) as {
        user?: {
          email?: string;
          emailConfirmedAt?: string | null;
          firstName?: string;
          lifetimeAccess?: boolean;
          role?: UserAppRole;
        } | null;
      };

      const user = raw.user;
      if (!user?.emailConfirmedAt || !user.email) return null;

      return {
        email: user.email,
        firstName: user.firstName?.trim() ?? "",
        emailConfirmedAt: user.emailConfirmedAt,
        role: user.role ?? "learner",
        hasPremiumAccess: Boolean(user.lifetimeAccess),
      };
    })().finally(() => {
      inflightSessionFetch = null;
    });
  }

  return inflightSessionFetch;
}

function toLearnerSession(user: AppSessionUser | null): LearnerSession | null {
  if (!user || user.role !== "learner") return null;
  return {
    email: user.email,
    firstName: user.firstName,
    hasPremiumAccess: user.hasPremiumAccess,
  };
}

export function LearnerSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [status, setStatus] = useState<AppSessionStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const next = await fetchAppSession();
      setUser(next);
      setStatus(next ? "ready" : "signed_out");
    } catch {
      setUser(null);
      setStatus("signed_out");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const session = useMemo(() => toLearnerSession(user), [user]);

  const value = useMemo(
    () => ({
      session,
      user,
      status,
      refresh,
    }),
    [session, user, status, refresh],
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

function useAppSessionContext(): AppSessionContextValue {
  const ctx = useContext(AppSessionContext);
  if (!ctx) {
    throw new Error("useAppSession must be used within LearnerSessionProvider");
  }
  return ctx;
}

export function useLearnerSession(): {
  session: LearnerSession | null;
  status: AppSessionStatus;
  refresh: () => Promise<void>;
} {
  const { session, status, refresh } = useAppSessionContext();
  return { session, status, refresh };
}

export function useAppSession(): AppSessionContextValue {
  return useAppSessionContext();
}

/** Safe hook for chrome that may render outside the provider during marketing routes. */
export function useOptionalAppSession(): AppSessionContextValue | null {
  return useContext(AppSessionContext);
}
