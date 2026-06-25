"use client";

import { useEffect, useState } from "react";

import { Footer } from "@/components/Footer";
import { LearnerChrome } from "@/components/learner/LearnerChrome";
import { Navbar } from "@/components/Navbar";

function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-viewport-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="app-main-scroll relative flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/** Guests see marketing chrome; confirmed learners keep the in-app shell. */
export function AssessmentAppShell({ children }: { children: React.ReactNode }) {
  const [useLearnerChrome, setUseLearnerChrome] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const raw = (await res.json()) as {
          user?: { emailConfirmedAt?: string | null; role?: string } | null;
        };
        if (cancelled) return;
        const user = raw.user;
        const confirmed = Boolean(user?.emailConfirmedAt);
        const learnerWorkspace = !user?.role || user.role === "learner";
        setUseLearnerChrome(confirmed && learnerWorkspace);
      } catch {
        if (!cancelled) setUseLearnerChrome(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (useLearnerChrome === true) {
    return <LearnerChrome>{children}</LearnerChrome>;
  }

  return <MarketingShell>{children}</MarketingShell>;
}
