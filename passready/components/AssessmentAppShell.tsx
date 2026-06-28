"use client";

import { Footer } from "@/components/Footer";
import { LearnerChrome } from "@/components/learner/LearnerChrome";
import { useAppSession } from "@/components/learner/LearnerSessionContext";
import { Navbar } from "@/components/Navbar";

function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-viewport-shell app-viewport-shell-app flex-col">
      <Navbar />
      <main className="app-main-scroll relative min-h-0 flex-1">
        {children}
        <Footer />
      </main>
    </div>
  );
}

/** Guests see marketing chrome; confirmed learners keep the in-app shell. */
export function AssessmentAppShell({ children }: { children: React.ReactNode }) {
  const { user, status } = useAppSession();

  if (status === "loading") {
    return <MarketingShell>{children}</MarketingShell>;
  }

  const useLearnerChrome = Boolean(user && (user.role === "learner" || !user.role));

  if (useLearnerChrome) {
    return <LearnerChrome>{children}</LearnerChrome>;
  }

  return <MarketingShell>{children}</MarketingShell>;
}
