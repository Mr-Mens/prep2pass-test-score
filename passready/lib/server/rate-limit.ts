import "server-only";

type RateWindow = {
  count: number;
  resetAt: number;
};

const windows = new Map<string, RateWindow>();

function now() {
  return Date.now();
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const current = windows.get(key);
  const time = now();

  if (!current || current.resetAt <= time) {
    windows.set(key, { count: 1, resetAt: time + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  windows.set(key, current);
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

