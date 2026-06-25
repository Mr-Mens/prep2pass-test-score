"use client";

import { usePathname } from "next/navigation";

import { AssessmentAppShell } from "@/components/AssessmentAppShell";
import { Footer } from "@/components/Footer";
import { LearnerChrome } from "@/components/learner/LearnerChrome";
import { LearnerSessionProvider } from "@/components/learner/LearnerSessionContext";
import { Navbar } from "@/components/Navbar";

import { isStandaloneAuthRoute } from "@/lib/auth-shell-routes";
import { isAssessmentRoute, isLearnerAppRoute } from "@/lib/learner-app-routes";
import { isMarketingRoute } from "@/lib/marketing-routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  const shell = (() => {
  if (pathname === "/welcome") {
    return <div className="min-h-dvh">{children}</div>;
  }

  if (isMarketingRoute(pathname)) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="relative flex-1 max-md:overflow-x-hidden">{children}</main>
        <Footer />
      </div>
    );
  }

  if (isStandaloneAuthRoute(pathname)) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-brand-50 via-white to-teal-50/35">{children}</div>
    );
  }

  if (pathname.startsWith("/instructor")) {
    return <div className="flex min-h-dvh flex-col">{children}</div>;
  }

  if (pathname.startsWith("/supervisor")) {
    return <div className="flex min-h-dvh flex-col">{children}</div>;
  }

  if (isAssessmentRoute(pathname)) {
    return <AssessmentAppShell>{children}</AssessmentAppShell>;
  }

  if (isLearnerAppRoute(pathname)) {
    return <LearnerChrome>{children}</LearnerChrome>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="relative flex-1 max-md:overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
  })();

  return <LearnerSessionProvider>{shell}</LearnerSessionProvider>;
}
