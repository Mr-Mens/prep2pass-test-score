"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { SITE } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Button } from "./Button";

const links = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/about", label: "About" },
] as const;

const memberPrimaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-reports", label: "My reports" },
] as const;

function primaryNavLinks(navAuth: NavAuth): ReadonlyArray<(typeof links)[number] | (typeof memberPrimaryLinks)[number]> {
  return navAuth.phase === "member" ? memberPrimaryLinks : links;
}

const mobileNavItemBase =
  "block w-full rounded-xl px-4 py-3.5 text-left text-sm transition-colors";

function mobileNavLinkClass(active: boolean) {
  return `${mobileNavItemBase} font-medium ${
    active ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50"
  }`;
}

function mobileNavCtaClass(active: boolean) {
  return `${mobileNavItemBase} font-semibold ${
    active ? "bg-teal-50/90 text-teal-950" : "text-teal-800 hover:bg-teal-50/60"
  }`;
}

type MePayload = {
  user: {
    email: string;
    emailConfirmedAt: string | null;
    lifetimeAccess?: boolean;
    role?: string;
  } | null;
};

type NavAuth =
  /** Session / entitlement lookup still in flight */
  | { phase: "loading" }
  /** Signed out or email unconfirmed: public CTAs only */
  | { phase: "guest" }
  /** Verified email: signed-in shortcuts */
  | { phase: "member"; lifetime: boolean; role?: string };

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [navAuth, setNavAuth] = useState<NavAuth>({ phase: "loading" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const raw = (await res.json()) as MePayload;
      const u = raw.user;
      if (!u?.emailConfirmedAt) {
        setNavAuth({ phase: "guest" });
        return;
      }
      setNavAuth({ phase: "member", lifetime: Boolean(u.lifetimeAccess), role: u.role });
    } catch {
      setNavAuth({ phase: "guest" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setNavAuth({ phase: "guest" });
    setOpen(false);
    window.location.assign("/");
  }

  function AuthDesktop() {
    if (navAuth.phase === "loading") {
      return <div className="ml-2 h-[3.75rem] w-32 animate-pulse rounded-xl bg-brand-50 sm:h-[4.75rem]" aria-hidden />;
    }
    if (navAuth.phase === "guest") {
      return (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              pathname.startsWith("/login") ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50"
            }`}
          >
            Sign In
          </Link>
          <Button href="/assessment" className="!min-h-[44px] !px-4 !py-2.5 !text-sm">
            Get My Test Ready Score
          </Button>
        </div>
      );
    }
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
      <Link
        href="/dashboard"
        className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
          pathname === "/dashboard" ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50"
        }`}
      >
        Overview
      </Link>
      {navAuth.role === "instructor" ? (
        <Link
          href="/instructor"
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              pathname.startsWith("/instructor") ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50"
            }`}
          >
            Instructor
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (pathname.startsWith("/instructor")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-200/60 bg-white/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80 md:border-brand-100/80 md:shadow-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-4 sm:px-6 md:py-5 lg:px-8">
        <Link
          href="/"
          className="flex min-h-[52px] min-w-0 max-w-[calc(100vw-5rem)] shrink-0 items-center rounded-xl py-1 pr-2 md:min-h-[56px] md:max-w-[calc(100%-12rem)]"
          onClick={() => setOpen(false)}
          aria-label={`Test Ready Score by ${SITE.name}, home`}
        >
          <BrandLogo variant="navbar" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {primaryNavLinks(navAuth).map((l) => {
            const active =
              pathname === l.href ||
              (l.href === "/my-reports" && (pathname.startsWith("/my-reports") || pathname.startsWith("/reports")));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-950" : "text-brand-700 hover:bg-brand-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="ml-2">
            <AuthDesktop />
          </div>
        </nav>

        <div className="flex items-center md:hidden">
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-200/90 bg-white text-brand-900 shadow-sm transition active:bg-brand-50"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden className="text-xl leading-none">
              {open ? "×" : "≡"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-brand-100 bg-white/98 shadow-inner md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-3 py-3 sm:px-6" aria-label="Mobile primary">
            {navAuth.phase === "loading" ? (
              <div className={`${mobileNavItemBase} h-12 animate-pulse rounded-xl bg-brand-50`} aria-hidden />
            ) : navAuth.phase === "member" ? (
              <>
                <Link
                  href="/dashboard"
                  className={mobileNavLinkClass(pathname === "/dashboard")}
                  onClick={() => setOpen(false)}
                >
                  Overview
                </Link>
                {navAuth.role === "instructor" ? (
                  <Link
                    href="/instructor"
                    className={mobileNavLinkClass(pathname.startsWith("/instructor"))}
                    onClick={() => setOpen(false)}
                  >
                    Instructor workspace
                  </Link>
                ) : null}
                <Link
                  href="/assessment"
                  className={
                    navAuth.lifetime ? mobileNavLinkClass(pathname === "/assessment") : mobileNavCtaClass(pathname === "/assessment")
                  }
                  onClick={() => setOpen(false)}
                >
                  {navAuth.lifetime ? "New assessment" : "Get My Test Ready Score"}
                </Link>
                {primaryNavLinks(navAuth).map((l) => {
                  const active =
                    pathname === l.href ||
                    (l.href === "/my-reports" && pathname.startsWith("/reports"));
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={mobileNavLinkClass(active)}
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  className={`${mobileNavItemBase} font-semibold text-brand-900 hover:bg-brand-50`}
                  onClick={() => void signOut()}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={mobileNavLinkClass(pathname.startsWith("/login"))}
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className={mobileNavLinkClass(pathname.startsWith("/signup"))}
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
                <Link
                  href="/assessment"
                  className={mobileNavCtaClass(pathname === "/assessment")}
                  onClick={() => setOpen(false)}
                >
                  Get My Test Ready Score
                </Link>
                {primaryNavLinks(navAuth).map((l) => {
                  const active =
                    pathname === l.href ||
                    (l.href === "/my-reports" && pathname.startsWith("/reports"));
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={mobileNavLinkClass(active)}
                      onClick={() => setOpen(false)}
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
