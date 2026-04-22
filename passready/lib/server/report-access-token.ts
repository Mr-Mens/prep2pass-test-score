import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

type ReportAccessTokenPayload = {
  email: string;
  exp: number;
};

const DEFAULT_TTL_SECONDS = 20 * 60;

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSigningSecret(): string {
  const secret = process.env.REPORT_ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("REPORT_ACCESS_TOKEN_SECRET is not configured");
  return secret;
}

function sign(unsignedToken: string): string {
  return createHmac("sha256", getSigningSecret()).update(unsignedToken).digest("base64url");
}

export function createReportAccessToken(email: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: ReportAccessTokenPayload = {
    email: email.toLowerCase().trim(),
    exp: now + ttlSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyReportAccessToken(token: string): { valid: true; email: string } | { valid: false } {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return { valid: false };

  const expected = sign(encodedPayload);
  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false };
  }

  let payload: ReportAccessTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as ReportAccessTokenPayload;
  } catch {
    return { valid: false };
  }

  if (!payload.email || !payload.exp) return { valid: false };
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) return { valid: false };

  return { valid: true, email: payload.email.toLowerCase().trim() };
}

