"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/BrandLogo";
import { LearnerPushBadgeEffects } from "@/components/learner/LearnerPushBadgeEffects";
import { useLearnerSession } from "@/components/learner/LearnerSessionContext";
import { PRICING, PRODUCT } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NavMatch =
  | "home"
  | "assessment"
  | "journey"
  | "lessons"
  | "reflections"
  | "mocks"
  | "resources"
  | "subscribe"
  | "account";

const premiumRailNavItems: readonly { href: string; label: string; match: NavMatch }[] = [
  { href: "/dashboard", label: "Dashboard", match: "home" },
  { href: "/assessment", label: PRODUCT.score, match: "assessment" },
  { href: "/progress", label: "Learning Journey", match: "journey" },
  { href: "/dashboard/lessons", label: "Lessons", match: "lessons" },
  { href: "/dashboard/reflections", label: "Lesson Reflections", match: "reflections" },
  { href: "/mock-tests", label: "Mock tests", match: "mocks" },
  { href: "/dashboard/resources", label: "Resources", match: "resources" },
  { href: "/account", label: "Account", match: "account" },
];

const premiumDockNavItems: readonly { href: string; label: string; match: NavMatch }[] = [
  { href: "/dashboard", label: "Home", match: "home" },
  { href: "/assessment", label: "Score", match: "assessment" },
  { href: "/dashboard/lessons", label: "Lessons", match: "lessons" },
  { href: "/mock-tests", label: "Mocks", match: "mocks" },
  { href: "/dashboard/reflections", label: "Reflect", match: "reflections" },
  { href: "/account", label: "Account", match: "account" },
];

const freeRailNavItems: readonly { href: string; label: string; match: NavMatch }[] = [
  { href: "/dashboard", label: "Dashboard", match: "home" },
  { href: "/assessment", label: PRODUCT.score, match: "assessment" },
  { href: "/subscribe", label: "Premium trial", match: "subscribe" },
  { href: "/account", label: "Account", match: "account" },
];

const freeDockNavItems: readonly { href: string; label: string; match: NavMatch }[] = [
  { href: "/dashboard", label: "Home", match: "home" },
  { href: "/assessment", label: "Score", match: "assessment" },
  { href: "/subscribe", label: "Trial", match: "subscribe" },
  { href: "/account", label: "Account", match: "account" },
];

function activeFor(pathname: string, match: NavMatch): boolean {
  if (match === "home") return pathname === "/dashboard";
  if (match === "assessment") return pathname === "/assessment" || pathname.startsWith("/assessment/");
  if (match === "journey") return pathname === "/progress" || pathname.startsWith("/progress/");
  if (match === "lessons") {
    return pathname === "/dashboard/lessons" || pathname.startsWith("/dashboard/lessons/");
  }
  if (match === "reflections") {
    return pathname === "/dashboard/reflections" || pathname.startsWith("/dashboard/reflections/");
  }
  if (match === "mocks") {
    return pathname === "/mock-tests" || pathname.startsWith("/mock-tests/");
  }
  if (match === "resources") {
    return pathname === "/dashboard/resources" || pathname.startsWith("/dashboard/resources/");
  }
  if (match === "subscribe") {
    return pathname === "/subscribe" || pathname.startsWith("/subscribe/");
  }
  if (match === "account") {
    return pathname === "/account" || pathname.startsWith("/account/");
  }
  return false;
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

function IconBook({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v15a1 1 0 01-1.447.894L12 18.118l-5.553 3.276A1 1 0 015 20.5v-15z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReflect({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 6h8M8 10h8M8 14h5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6 4h12a2 2 0 012 2v12l-3-2-3 2-3-2-3 2-3-2V6a2 2 0 012-2z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLessons({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke={stroke} strokeWidth="2" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAccount({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth="2" />
      <path d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMocks({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4h8a2 2 0 012 2v14l-3-1.5L12 20l-3-1.5L6 20V6a2 2 0 012-2z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 13h6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconTrial({ stroke }: { stroke: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5L12 14.8 7.5 16.7l.9-5L4.8 8.2l5-.7L12 3z" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function iconForMatch(match: NavMatch, stroke: string) {
  switch (match) {
    case "home":
      return <IconHome stroke={stroke} />;
    case "journey":
      return <IconChart stroke={stroke} />;
    case "assessment":
      return <IconTarget stroke={stroke} />;
    case "lessons":
      return <IconLessons stroke={stroke} />;
    case "reflections":
      return <IconReflect stroke={stroke} />;
    case "mocks":
      return <IconMocks stroke={stroke} />;
    case "resources":
      return <IconBook stroke={stroke} />;
    case "account":
      return <IconAccount stroke={stroke} />;
    case "subscribe":
      return <IconTrial stroke={stroke} />;
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

function initialsFromSession(session: { email: string; firstName: string }): string {
  const parts = session.firstName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const fromEmail = session.email.split("@")[0]?.replace(/[^a-zA-Z]/g, "") ?? "";
  if (fromEmail.length >= 2) return fromEmail.slice(0, 2).toUpperCase();
  if (fromEmail.length === 1) return `${fromEmail}X`.toUpperCase();
  return "ME";
}

function NavDockSkeleton() {
  return (
    <nav
      className="z-50 shrink-0 border-t border-brand-200/80 bg-white/95 pb-safe-fixed backdrop-blur md:hidden"
      aria-hidden
    >
      <ul className="mx-auto flex w-full min-w-0 gap-0 px-0.5 pt-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="flex min-h-[56px] min-w-0 flex-1 justify-center px-0.5 py-1.5">
            <div className="h-10 w-full max-w-[4.5rem] animate-pulse rounded-xl bg-brand-100" />
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LearnerChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { session, status } = useLearnerSession();
  const accessReady = status !== "loading";
  const isPremium = session?.hasPremiumAccess ?? false;
  const railLinks = isPremium ? premiumRailNavItems : freeRailNavItems;
  const dockLinks = isPremium ? premiumDockNavItems : freeDockNavItems;
  const homeHref = "/dashboard";

  function NavRail() {
    if (!accessReady) {
      return (
        <nav className="flex flex-col gap-2 px-3 pb-4" aria-hidden>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-11 animate-pulse rounded-xl bg-slate-800/60" />
          ))}
        </nav>
      );
    }

    return (
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
    );
  }

  function NavDock() {
    if (!accessReady) {
      return <NavDockSkeleton />;
    }

    return (
      <nav
        className="z-50 shrink-0 border-t border-brand-200/80 bg-white/95 pb-safe-fixed backdrop-blur supports-[backdrop-filter]:bg-white/90 md:hidden"
        aria-label="Primary app navigation"
      >
        <ul className="mx-auto flex w-full min-w-0 max-w-full gap-0 px-0.5 pt-1">
          {dockLinks.map((item) => {
            const active = activeFor(pathname, item.match);
            const stroke = strokeDock(active);
            return (
              <li key={item.href} className="flex min-h-0 min-w-0 flex-1 justify-center">
                <Link
                  href={item.href}
                  prefetch
                  className={`flex min-h-[56px] w-full min-w-0 max-w-full flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[9px] font-semibold leading-tight tracking-tight transition-colors sm:text-[10px] ${
                    active ? "bg-teal-600 text-white shadow-sm" : "text-brand-700 hover:bg-brand-50 hover:text-brand-950"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="shrink-0">{iconForMatch(item.match, stroke)}</span>
                  <span className="w-full truncate text-center">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  const initials = session ? initialsFromSession(session) : "…";

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <div className="app-viewport-shell app-viewport-shell-app min-w-0 bg-[#f0f2f5] md:flex-row">
      <LearnerPushBadgeEffects />
      <aside className="hidden w-[17.5rem] shrink-0 flex-col border-r border-slate-800 bg-[#0f172a] md:flex">
        <div className="border-b border-slate-700/90 px-5 py-6">
          <Link href={homeHref} className="block" aria-label={`${PRODUCT.name} home`}>
            <BrandLogo variant="learnerRail" />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavRail />
        </div>

        {accessReady && session && !session.hasPremiumAccess ? (
          <div className="border-t border-slate-700/80 px-4 pb-5 pt-4">
            <Link
              href="/subscribe"
              className="block rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 py-3 text-xs leading-relaxed text-teal-100 transition hover:border-teal-400/60 hover:bg-teal-500/20"
            >
              <p className="font-semibold text-white">{PRICING.subscription.trialCta}</p>
              <p className="mt-1 text-slate-300">{PRICING.subscription.trialMessage}</p>
              <p className="mt-2 text-[11px] font-semibold text-teal-200">Start trial →</p>
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
              <p className="truncate text-sm font-semibold text-white">{session?.firstName?.trim() || "Learner"}</p>
              <p className="truncate text-xs text-slate-400">{session?.email ?? "Signed in"}</p>
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="app-chrome-top z-40 shrink-0 border-b border-brand-200/80 bg-white/95 backdrop-blur md:hidden md:pt-0">
          <div className="mx-auto flex min-h-[52px] w-full min-w-0 max-w-full items-center gap-2 px-3 pb-3 sm:min-h-[3.25rem] sm:gap-3 sm:px-4">
            <Link
              href={homeHref}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white px-2.5 py-2 shadow-sm sm:px-3"
              aria-label={`${PRODUCT.name} home`}
            >
              <BrandLogo variant="learnerMobile" />
            </Link>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate font-heading text-sm font-semibold tracking-tight text-brand-950">Learner workspace</p>
              <p className="truncate text-[11px] font-medium leading-tight text-teal-800">
                {!accessReady
                  ? "Loading…"
                  : isPremium
                    ? `${PRODUCT.name} dashboard`
                    : PRODUCT.score}
              </p>
            </div>
            {accessReady && session ? (
              <Link
                href="/account"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                  activeFor(pathname, "account")
                    ? "bg-teal-600 text-white ring-2 ring-teal-200"
                    : "bg-teal-50 text-teal-900 ring-1 ring-teal-200 hover:bg-teal-100"
                }`}
                aria-label="Account and profile settings"
                aria-current={activeFor(pathname, "account") ? "page" : undefined}
              >
                {initials}
              </Link>
            ) : (
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-brand-100" aria-hidden />
            )}
          </div>
        </header>

        <main
          id="main"
          className="app-main-scroll relative mx-auto w-full min-h-0 flex-1 max-w-4xl px-4 pb-4 pt-6 [-webkit-overflow-scrolling:touch] sm:px-6 sm:pt-8 md:max-w-none md:px-8 md:pb-10 md:pt-10 lg:px-10"
        >
          <div className="mx-auto w-full min-w-0 max-w-4xl">{children}</div>
        </main>

        <NavDock />
      </div>
    </div>
  );
}
