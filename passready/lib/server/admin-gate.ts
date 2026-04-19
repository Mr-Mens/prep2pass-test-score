import "server-only";

export const ADMIN_KEY_HEADER = "x-admin-access-key";
export const ADMIN_KEY_QUERY = "admin_key";

export function assertAdminAccess(providedKey: string | null): { ok: true } | { ok: false; message: string } {
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected) {
    return { ok: false, message: "ADMIN_ACCESS_KEY is not configured" };
  }
  if (!providedKey || providedKey !== expected) {
    return { ok: false, message: "Invalid admin access key" };
  }
  return { ok: true };
}

export function getAdminKeyFromRequest(request: Request): string | null {
  const header = request.headers.get(ADMIN_KEY_HEADER);
  if (header) return header;
  const url = new URL(request.url);
  return url.searchParams.get(ADMIN_KEY_QUERY);
}
