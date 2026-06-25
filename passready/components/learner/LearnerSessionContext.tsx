"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type LearnerSession = {
  email: string;
  firstName: string;
  hasPremiumAccess: boolean;
};

type LearnerSessionStatus = "loading" | "signed_out" | "ready";

type LearnerSessionContextValue = {
  session: LearnerSession | null;
  status: LearnerSessionStatus;
  refresh: () => Promise<void>;
};

const LearnerSessionContext = createContext<LearnerSessionContextValue | null>(null);

async function fetchLearnerSession(): Promise<LearnerSession | null> {
  const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
  const raw = (await res.json()) as {
    user?: {
      email?: string;
      emailConfirmedAt?: string | null;
      firstName?: string;
      lifetimeAccess?: boolean;
      role?: string;
    } | null;
  };

  const user = raw.user;
  if (!user?.emailConfirmedAt || !user.email) return null;
  if (user.role && user.role !== "learner") return null;

  return {
    email: user.email,
    firstName: user.firstName?.trim() ?? "",
    hasPremiumAccess: Boolean(user.lifetimeAccess),
  };
}

export function LearnerSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LearnerSession | null>(null);
  const [status, setStatus] = useState<LearnerSessionStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const next = await fetchLearnerSession();
      setSession(next);
      setStatus(next ? "ready" : "signed_out");
    } catch {
      setSession(null);
      setStatus("signed_out");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      session,
      status,
      refresh,
    }),
    [session, status, refresh],
  );

  return <LearnerSessionContext.Provider value={value}>{children}</LearnerSessionContext.Provider>;
}

export function useLearnerSession(): LearnerSessionContextValue {
  const ctx = useContext(LearnerSessionContext);
  if (!ctx) {
    throw new Error("useLearnerSession must be used within LearnerSessionProvider");
  }
  return ctx;
}

/** Safe hook for chrome that may render outside the provider during marketing routes. */
export function useOptionalLearnerSession(): LearnerSessionContextValue | null {
  return useContext(LearnerSessionContext);
}
