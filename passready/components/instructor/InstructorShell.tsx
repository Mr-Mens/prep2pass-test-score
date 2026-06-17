"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/instructor", label: "Dashboard", icon: "◉" },
  { href: "/instructor/pupils", label: "My Pupils", icon: "◎" },
  { href: "/instructor/mock-test/new", label: "Mock Test Tool", icon: "▦" },
  { href: "/instructor/diagrams", label: "Diagrams", icon: "▨" },
  { href: "/instructor/mock-tests", label: "Reports", icon: "☰" },
  { href: "/instructor/settings", label: "Settings", icon: "⚙" },
  { href: "/instructor/help", label: "Help & Support", icon: "?" },
] as const;

type Props = {
  children: React.ReactNode;
  instructorEmail: string;
  displayName: string;
  adiPlaceholder: string | null;
};

export function InstructorShell({ children, instructorEmail, displayName, adiPlaceholder }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "IN";

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-0.5" aria-label="Instructor">
        {navItems.map((item) => {
          const active =
            item.href === "/instructor"
              ? pathname === "/instructor"
              : item.href === "/instructor/mock-test/new"
                ? pathname.startsWith("/instructor/mock-test") && !pathname.startsWith("/instructor/mock-tests")
                : item.href === "/instructor/mock-tests"
                  ? pathname.startsWith("/instructor/mock-tests")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
              }`}
            >
              <span className={active ? "text-white/90" : "text-teal-400/90"} aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-0px)] flex-col bg-[#f0f2f5] md:flex-row">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,90vw)] transform border-r border-slate-800 bg-[#0f172a] shadow-xl transition-transform md:static md:z-0 md:w-[17.5rem] md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-6">
          <div className="border-b border-slate-700/90 pb-5">
            <p className="font-heading text-xs font-semibold uppercase tracking-wide text-white">Pass Pilot</p>
            <p className="mt-3 text-xs font-normal leading-relaxed text-slate-400">
              DVSA-style mock test tool · Not affiliated with DVSA
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-5">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-slate-700 pt-5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-600/80 bg-slate-800/50 px-3 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-semibold text-teal-300">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{displayName || "Instructor"}</p>
                <p className="truncate text-xs text-slate-400">{instructorEmail}</p>
                {adiPlaceholder ? (
                  <p className="mt-0.5 text-xs text-slate-500">ADI {adiPlaceholder}</p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-500">ADI # · add in Settings</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 w-full rounded-xl border border-slate-500/80 bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-brand-950/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-brand-200/80 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-900 shadow-sm"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span className="sr-only">Open menu</span>
            <span aria-hidden>☰</span>
          </button>
          <p className="font-heading text-sm font-semibold text-brand-900">Instructor workspace</p>
        </header>
        <div className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
