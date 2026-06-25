"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const sidebarNav = [
  { href: "/supervisor", label: "Dashboard", match: "exact" as const },
  { href: "/supervisor/link-learner", label: "My Learner", match: "prefix" as const },
  { href: "/supervisor/reflections", label: "Lesson Reflections", match: "prefix" as const },
  { href: "/supervisor/practice-log", label: "Practice Planner", match: "prefix" as const },
  { href: "/supervisor/resources", label: "Resources", match: "prefix" as const },
] as const;

const dockNav = [
  { href: "/supervisor", label: "Home", icon: "⌂" },
  { href: "/supervisor/link-learner", label: "Learner", icon: "◎" },
  { href: "/supervisor/reflections", label: "Reflect", icon: "✎" },
  { href: "/supervisor/practice-log", label: "Planner", icon: "▦" },
  { href: "/supervisor/resources", label: "Resources", icon: "☰" },
] as const;

type Props = {
  children: React.ReactNode;
  supervisorEmail: string;
  displayName: string;
};

function isActive(pathname: string, href: string, match: "exact" | "prefix"): boolean {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SupervisorShell({ children, supervisorEmail, displayName }: Props) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "PA";

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <div className="app-viewport-shell flex min-h-dvh min-w-0 flex-col bg-gradient-to-b from-brand-50/40 via-white to-teal-50/20 md:flex-row">
      <aside className="hidden w-[17rem] shrink-0 flex-col border-r border-brand-100 bg-white md:flex">
        <div className="flex h-full flex-col px-4 py-6">
          <BrandLogo variant="compact" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-teal-700">Parent &amp; supervisor</p>
          <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Supervisor">
            {sidebarNav.map((item) => {
              const active = isActive(pathname, item.href, item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-teal-700 text-white shadow-sm"
                      : "text-brand-700 hover:bg-brand-50 hover:text-brand-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-brand-100 pt-5">
            <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-brand-950">{displayName}</p>
                <p className="truncate text-xs text-brand-500">{supervisorEmail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between border-b border-brand-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <p className="font-heading text-sm font-semibold text-brand-950">Parent workspace</p>
            <p className="text-xs text-brand-500">Pass Pilot</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700"
          >
            Sign out
          </button>
        </header>

        <main className="app-main-scroll flex-1 px-4 py-6 pb-28 sm:px-6 md:px-10 md:py-8 md:pb-8 lg:px-12">
          <div className="mx-auto w-full min-w-0 max-w-4xl">{children}</div>
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
          aria-label="Supervisor mobile"
        >
          <ul className="mx-auto flex w-full min-w-0 max-w-full gap-0">
            {dockNav.map((item) => {
              const active =
                item.href === "/supervisor"
                  ? pathname === "/supervisor"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href} className="min-w-0 flex-1">
                  <Link
                    href={item.href}
                    prefetch
                    className={`flex min-h-[56px] w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-[9px] font-semibold leading-tight transition sm:text-[10px] ${
                      active ? "bg-teal-50 text-teal-800" : "text-brand-600 hover:bg-brand-50"
                    }`}
                  >
                    <span aria-hidden className="shrink-0 text-base leading-none">
                      {item.icon}
                    </span>
                    <span className="w-full truncate text-center">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
