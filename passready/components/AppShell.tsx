"use client";

import { usePathname } from "next/navigation";

import { Footer } from "@/components/Footer";
import { LearnerChrome } from "@/components/learner/LearnerChrome";
import { Navbar } from "@/components/Navbar";

import { isLearnerAppRoute } from "@/lib/learner-app-routes";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (pathname.startsWith("/instructor")) {
    return <div className="flex min-h-dvh flex-col">{children}</div>;
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
}
