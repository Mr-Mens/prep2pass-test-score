"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { PRICING, SITE } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NavMatch = "site" | "dashboard" | "score" | "progress" | "reports-child" | "account";

const MARKETING_LINKS = [
  { href: "/sample-report", label: "Sample report" },
  { href: "/home#faq", label: "FAQs" },
  { href: "/home#pricing", label: "Pricing" },
] as const;

const railNavItems: readonly { href: string; label: string; match: NavMatch }[] = [
  { href: "/home", label: "Home", match: "site" },
  { href: "/dashboard", label: "Overview", match: "dashboard" },
  { href: "/assessment", label: "Score", match: "score" },
  { href: "/progress", label: "Progress", match: "progress" },
  { href: "/my-reports", label: "Reports", match: "reports-child" },
  { href: "/account", label: "Account", match: "account" },
];

/** Mobile dock: Overview on sidebar — Progress only for lifetime members */
const dockNavItems: readonly { href: string; label: string; match: NavMatch }[] = [
  { href: "/home", label: "Home", match: "site" },
  { href: "/assessment", label: "Score", match: "score" },
  { href: "/progress", label: "Progress", match: "progress" },
  { href: "/my-reports", label: "Reports", match: "reports-child" },
  { href: "/account", label: "Account", match: "account" },
];

function activeFor(pathname: string, match: NavMatch): boolean {
  if (match === "site") return pathname === "/home";
  if (match === "dashboard") return pathname === "/dashboard";
  if (match === "score") return pathname === "/assessment" || pathname.startsWith("/assessment/");
  if (match === "progress") return pathname === "/progress" || pathname.startsWith("/progress/");
  if (match === "account") return pathname === "/account" || pathname.startsWith("/account/");
  return (
    pathname.startsWith("/my-reports") ||
    /^\/reports\/[^/]+$/.test(pathname) ||
    pathname.startsWith("/mock-tests")
  );
}

function IconHome({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLayout({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.75" stroke={stroke} strokeWidth="2" />
      <rect x="13" y="3" width="8" height="8" rx="1.75" stroke={stroke} strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="1.75" stroke={stroke} strokeWidth="2" />
      <rect x="13" y="13" width="8" height="8" rx="1.75" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

function IconChart({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 21V9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 21V5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M18 21v-8" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M4 21h18" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconTarget({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="2" />
      <circle cx="12" cy="12" r="1" fill={stroke} />
    </svg>
  );
}

function IconFolder({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8a2 2 0 012-2h4l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth="2" />
      <path d="M6 21v-2a6 6 0 0112 0v2" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function iconForMatch(match: NavMatch, stroke: string) {
  switch (match) {
    case "site":
      return <IconHome stroke={stroke} />;
    case "dashboard":
      return <IconLayout stroke={stroke} />;
    case "score":
      return <IconTarget stroke={stroke} />;
    case "progress":
      return <IconChart stroke={stroke} />;
    case "reports-child":
      return <IconFolder stroke={stroke} />;
    case "account":
      return <IconUser stroke={stroke} />;
    default:
      return <IconHome stroke={stroke} />;
  }
}

function strokeRail(active: boolean) {
  return active ? "#ffffff" : "#5eead4";
}

function strokeDock(active: boolean) {
  return active ? "#ffffff" : "#435a7d";
}

type MeBrief = {
  email: string;
  firstName: string;
  lifetimeAccess: boolean;
};

function initialsFromMe(me: MeBrief): string {
  const parts = me.firstName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const fromEmail = me.email.split("@")[0]?.replace(/[^a-zA-Z]/g, "") ?? "";
  if (fromEmail.length >= 2) return fromEmail.slice(0, 2).toUpperCase();
  if (fromEmail.length === 1) return `${fromEmail}X`.toUpperCase();
  return "ME";
}

export function LearnerChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [me, setMe] = useState<MeBrief | null>(null);
  /** Progress is lifetime-only; hide until entitlement is confirmed client-side */
  const showProgressNav = me?.lifetimeAccess === true;
  const railLinks = railNavItems.filter((item) => item.match !== "progress" || showProgressNav);
  const dockLinks = dockNavItems.filter((item) => item.match !== "progress" || showProgressNav);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const raw = (await res.json()) as {
          user?: {
            email?: string;
            emailConfirmedAt?: string | null;
            firstName?: string;
            lifetimeAccess?: boolean;
          } | null;
        };
        const u = raw.user;
        if (cancelled || !u?.emailConfirmedAt || !u.email) return;
        setMe({
          email: u.email,
          firstName: u.firstName?.trim() ?? "",
          lifetimeAccess: Boolean(u.lifetimeAccess),
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function NavRail() {
    return (
      <>
        <nav className="flex flex-col gap-0.5 px-3 pb-4" aria-label="Learner app">
          {railLinks.map((item) => {
            const active = activeFor(pathname, item.match);
            const stroke = strokeRail(active);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-teal-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800/90 hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className={active ? "text-white/95" : "text-teal-400/95"} aria-hidden>
                  {iconForMatch(item.match, stroke)}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700/80 px-5 pb-6 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Decide & commit</p>
          <div className="mt-3 flex flex-col gap-1">
            {MARKETING_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800/90 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  }

  function NavDock() {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-white/90 md:hidden"
        aria-label="Primary app navigation"
      >
        <ul
          className={`mx-auto grid max-w-xl gap-0 px-1 pt-1 ${showProgressNav ? "grid-cols-5" : "grid-cols-4"}`}
        >
          {dockLinks.map((item) => {
            const active = activeFor(pathname, item.match);
            const stroke = strokeDock(active);
            return (
              <li key={item.href} className="flex min-h-0 justify-center">
                <Link
                  href={item.href}
                  prefetch
                  className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold tracking-tight transition-colors sm:text-[11px] ${
                    active ? "bg-teal-600 text-white shadow-sm" : "text-brand-700 hover:bg-brand-50 hover:text-brand-950"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {iconForMatch(item.match, stroke)}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  const initials = me ? initialsFromMe(me) : "…";

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <div className="flex min-h-dvh bg-[#f0f2f5] md:flex-row">
      <aside className="hidden w-[17.5rem] shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] md:flex">
        <div className="border-b border-slate-700/90 px-5 py-6">
          <Link href="/home" className="block" aria-label={`${SITE.name}, home — FAQs, sample report, and pricing`}>
            <BrandLogo variant="learnerRail" />
          </Link>
          <p className="mt-3 font-heading text-xs font-semibold uppercase tracking-wide text-white">Test Ready Score</p>
          <p className="mt-1 text-xs text-slate-400">Powered by {SITE.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavRail />
        </div>

        {me && !me.lifetimeAccess ? (
          <div className="border-t border-slate-700/80 px-4 pb-5 pt-4">
            <Link
              href="/upgrade"
              className="block rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-3 text-xs leading-relaxed text-teal-100 transition hover:border-teal-400/60 hover:bg-teal-500/20"
            >
              <p className="font-semibold text-white">Lifetime access</p>
              <p className="mt-1 text-slate-300">Unlimited reports · {PRICING.lifetime.display} one-time</p>
              <p className="mt-2 text-[11px] font-semibold text-teal-200">Upgrade →</p>
            </Link>
          </div>
        ) : null}

        <div className="border-t border-slate-700/90 px-4 py-5">
          <Link
            href="/account"
            className="flex items-center gap-3 rounded-xl border border-slate-600/80 bg-slate-800/50 px-3 py-3 transition hover:bg-slate-800/80"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-sm font-semibold text-teal-200">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{me?.firstName?.trim() || "Learner"}</p>
              <p className="truncate text-xs text-slate-400">{me?.email ?? "Signed in"}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 w-full rounded-xl border border-slate-500/80 bg-transparent px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-brand-200/80 bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto flex min-h-[52px] w-full max-w-xl items-center gap-3 px-4 py-3 sm:min-h-[3.25rem]">
            <Link
              href="/home"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white px-3 py-2 shadow-sm"
              aria-label={`${SITE.name}, home`}
            >
              <BrandLogo variant="learnerMobile" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold tracking-tight text-brand-950">Learner workspace</p>
              <Link href="/dashboard" className="truncate text-[11px] font-medium leading-tight text-teal-800 underline-offset-2 hover:underline">
                App overview · saved reports arc
              </Link>
            </div>
          </div>
        </header>

        <main
          id="main"
          className="relative mx-auto w-full max-w-4xl flex-1 px-4 pb-[calc(5.85rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 md:max-w-none md:px-8 md:pb-10 md:pt-10 lg:px-10"
        >
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>

        <NavDock />
      </div>
    </div>
  );
}
