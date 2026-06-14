/**
 * Paths that render the learner mobile-app shell (no marketing navbar/footer).
 */

const LEARNER_ROOTS = [
  "/dashboard",
  "/account",
  "/progress",
  "/assessment",
  "/results",
  "/my-reports",
  "/reports",
  "/mock-tests",
  "/upgrade",
  "/subscribe",
  "/graduate",
  "/lifetime",
] as const;

export function isLearnerAppRoute(pathname: string): boolean {
  if (!pathname || pathname.startsWith("/instructor") || pathname.startsWith("/supervisor")) return false;

  const path = pathname.split("?")[0] ?? pathname;

  if (path === "/checkout/success") return true;

  if (/^\/reports\/[^/]+$/.test(path)) return true;
  if (/^\/mock-tests(\/|$)/.test(path)) return true;

  for (const r of LEARNER_ROOTS) {
    if (path === r || path.startsWith(`${r}/`)) return true;
  }
  return false;
}
