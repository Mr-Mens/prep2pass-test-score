/** Public marketing pages — logged-in users are redirected to their workspace. */
export const MARKETING_ROUTES = ["/", "/pricing", "/faq", "/about", "/sample-report", "/explore"] as const;

export function isMarketingRoute(pathname: string): boolean {
  const path = (pathname.split("?")[0] ?? pathname).replace(/\/$/, "") || "/";
  if (path === "/") return true;
  return MARKETING_ROUTES.some((r) => r !== "/" && (path === r || path.startsWith(`${r}/`)));
}
