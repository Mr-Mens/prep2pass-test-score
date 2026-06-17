"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BrandMark } from "@/components/BrandMark";
import { isMarketingRoute } from "@/lib/marketing-routes";
import { BRAND_CTA, PRODUCT, SITE } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Button } from "./Button";

const SIGN_IN_HREF = "/welcome";

function signInLinkActive(pathname: string): boolean {
  return pathname === "/welcome" || pathname.startsWith("/login");
}

const guestLinks = [
  { href: "/sample-report", label: "Sample Report" },
  { href: "/pricing", label: "Plans" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
] as const;

const memberPrimaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-reports", label: "Score history" },
] as const;

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
  | { phase: "loading" }
  | { phase: "guest" }
  | { phase: "member"; lifetime: boolean; role?: string };

export function Navbar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [navAuth, setNavAuth] = useState<NavAuth>({ phase: "loading" });
  const [scrolled, setScrolled] = useState(false);

  const onMarketing = isMarketingRoute(pathname);
  const useTransparentHeader = onMarketing && !scrolled && !open;

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

  useEffect(() => {
    if (!onMarketing) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onMarketing, pathname]);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setNavAuth({ phase: "guest" });
    setOpen(false);
    window.location.assign("/");
  }

  function AuthDesktop() {
    if (navAuth.phase === "loading") {
      return <div className="ml-2 h-11 w-28 animate-pulse rounded-xl bg-brand-50/80" aria-hidden />;
    }
    if (navAuth.phase === "guest") {
      return (
        <div className="flex items-center gap-2">
          <Link
            href={SIGN_IN_HREF}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              signInLinkActive(pathname) ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50/80"
            }`}
          >
            Sign In
          </Link>
          <Button href="/assessment" className="!min-h-[44px] !px-4 !py-2.5 !text-sm">
            {BRAND_CTA.getMyScore}
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
        <Link
          href="/dashboard"
          className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            pathname === "/dashboard" ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50/80"
          }`}
        >
          Overview
        </Link>
        {navAuth.role === "instructor" ? (
          <Link
            href="/instructor"
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              pathname.startsWith("/instructor") ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50/80"
            }`}
          >
            Instructor
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-900 hover:bg-brand-50/80"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (pathname.startsWith("/instructor")) {
    return null;
  }

  const headerClass = useTransparentHeader
    ? "border-b border-transparent bg-transparent backdrop-blur-[2px]"
    : "border-b border-brand-200/60 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/90";

  const navLinks = navAuth.phase === "member" ? memberPrimaryLinks : guestLinks;

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${headerClass}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-[48px] min-w-0 shrink-0 items-center rounded-xl py-1 pr-2"
          onClick={() => setOpen(false)}
          aria-label={`${PRODUCT.name}, home`}
        >
          <BrandMark variant="compact" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex" aria-label="Primary">
          {navAuth.phase !== "member"
            ? guestLinks.map((l) => {
                const active = pathname === l.href || (l.href === "/pricing" && pathname.startsWith("/pricing"));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-brand-50/90 text-brand-950" : "text-brand-700 hover:bg-brand-50/80"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })
            : null}
        </nav>

        <div className="hidden items-center md:flex">
          <AuthDesktop />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:hidden">
          {navAuth.phase !== "member" ? (
            <Link
              href={SIGN_IN_HREF}
              className={`shrink-0 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
                signInLinkActive(pathname) ? "bg-brand-50 text-brand-950" : "text-brand-800 hover:bg-brand-50/80"
              }`}
            >
              Sign In
            </Link>
          ) : null}
          {navAuth.phase === "guest" ? (
            <Button href="/assessment" className="!min-h-[40px] !px-2.5 !py-2 !text-xs sm:!px-3 sm:!text-sm">
              Get Score
            </Button>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-200/90 bg-white/90 text-brand-900 shadow-sm transition active:bg-brand-50"
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
                  className={mobileNavCtaClass(pathname === "/assessment")}
                  onClick={() => setOpen(false)}
                >
                  {navAuth.lifetime ? BRAND_CTA.updateMyScore : BRAND_CTA.getMyScore}
                </Link>
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={mobileNavLinkClass(
                      pathname === l.href ||
                        (l.href === "/my-reports" && pathname.startsWith("/reports")),
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
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
                {guestLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={mobileNavLinkClass(pathname === l.href)}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  href={SIGN_IN_HREF}
                  className={mobileNavLinkClass(signInLinkActive(pathname))}
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/assessment"
                  className={mobileNavCtaClass(pathname === "/assessment")}
                  onClick={() => setOpen(false)}
                >
                  {BRAND_CTA.getMyScore}
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
