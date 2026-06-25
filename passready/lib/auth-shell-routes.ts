/**
 * Paths that use a standalone surface (no marketing navbar/footer) in AppShell.
 */

export function isStandaloneAuthRoute(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;

  return (
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/verify-email") ||
    path.startsWith("/auth/confirmed")
  );
}

export function isAdminRoute(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  return path === "/admin" || path.startsWith("/admin/");
}
