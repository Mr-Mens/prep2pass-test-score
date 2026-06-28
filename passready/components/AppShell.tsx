"use client";

import { usePathname } from "next/navigation";

import { AssessmentAppShell } from "@/components/AssessmentAppShell";
import { Footer } from "@/components/Footer";
import { LearnerChrome } from "@/components/learner/LearnerChrome";
import { LearnerSessionProvider } from "@/components/learner/LearnerSessionContext";
import { Navbar } from "@/components/Navbar";

import { isAdminRoute, isStandaloneAuthRoute } from "@/lib/auth-shell-routes";
import { isAssessmentRoute, isLearnerAppRoute } from "@/lib/learner-app-routes";
import { isMarketingRoute } from "@/lib/marketing-routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  const shell = (() => {
  if (pathname === "/welcome") {
    return <div className="app-viewport-shell app-viewport-shell-scroll">{children}</div>;
  }

  if (isMarketingRoute(pathname)) {
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

  if (isStandaloneAuthRoute(pathname)) {
    return (
      <div className="app-viewport-shell app-viewport-shell-scroll bg-gradient-to-b from-brand-50 via-white to-teal-50/35">
        {children}
      </div>
    );
  }

  if (isAdminRoute(pathname)) {
    return (
      <div className="app-viewport-shell app-viewport-shell-scroll bg-brand-50">
        {children}
      </div>
    );
  }

  if (pathname.startsWith("/instructor")) {
    return <div className="app-viewport-shell app-viewport-shell-app flex-col">{children}</div>;
  }

  if (pathname.startsWith("/supervisor")) {
    return <div className="app-viewport-shell app-viewport-shell-app flex-col">{children}</div>;
  }

  if (isAssessmentRoute(pathname)) {
    return <AssessmentAppShell>{children}</AssessmentAppShell>;
  }

  if (isLearnerAppRoute(pathname)) {
    return <LearnerChrome>{children}</LearnerChrome>;
  }

  return (
    <div className="app-viewport-shell app-viewport-shell-app flex-col">
      <Navbar />
      <main className="app-main-scroll relative min-h-0 flex-1">
        {children}
        <Footer />
      </main>
    </div>
  );
  })();

  return <LearnerSessionProvider>{shell}</LearnerSessionProvider>;
}
