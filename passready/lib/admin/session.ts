export const ADMIN_SESSION_KEY = "passready_admin_key";

export async function validateAdminAccessKey(
  key: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch("/api/admin/analytics/overview", {
    headers: { "x-admin-access-key": key },
  });
  if (res.ok) return { ok: true };

  const raw = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  return { ok: false, message: raw?.error?.message ?? "Invalid admin access key" };
}
