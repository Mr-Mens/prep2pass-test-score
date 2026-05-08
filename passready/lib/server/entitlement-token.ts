import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { normalizeEmail } from "@/lib/normalize-email";

export type LifetimeFinalisePayload = {
  typ: "lifetime_finalise";
  email: string;
  userId: string;
  exp: number;
};

const TTL_MS = 20 * 60 * 1000;

function requireSecret(): string {
  const s = process.env.ENTITLEMENT_TOKEN_SECRET;
  if (!s || s.length < 16) {
    throw new Error("ENTITLEMENT_TOKEN_SECRET is not configured or too short");
  }
  return s;
}

function signBody(body: string): string {
  return createHmac("sha256", requireSecret()).update(body).digest("base64url");
}

/** Short-lived token so lifetime users can finalise without a new Stripe session. */
export function signLifetimeFinaliseToken(email: string, userId: string): string {
  const payload: LifetimeFinalisePayload = {
    typ: "lifetime_finalise",
    email: normalizeEmail(email),
    userId,
    exp: Date.now() + TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = signBody(body);
  return `${body}.${sig}`;
}

export function verifyLifetimeFinaliseToken(token: string): LifetimeFinalisePayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    if (!body || !sig) return null;
    const expected = signBody(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as LifetimeFinalisePayload;
    if (
      raw.typ !== "lifetime_finalise" ||
      typeof raw.email !== "string" ||
      typeof raw.userId !== "string" ||
      typeof raw.exp !== "number"
    ) {
      return null;
    }
    if (raw.exp < Date.now()) return null;
    return { ...raw, email: normalizeEmail(raw.email) };
  } catch {
    return null;
  }
}
