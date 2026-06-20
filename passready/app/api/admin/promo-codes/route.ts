import { NextResponse } from "next/server";
import { z } from "zod";

import { createStripePromoForDiscount, deactivateStripePromotionCode } from "@/lib/server/admin-promo-stripe";
import { handleAdminPromoRouteError, jsonAdminError } from "@/lib/server/admin-promo-route-errors";
import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { isPromoModuleReady, PROMO_MIGRATION_HINT } from "@/lib/server/commercial-schema";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import {
  deactivateAdminPromoCode,
  generateAutoPromoCode,
  insertAdminPromoCode,
  listAdminPromoCodes,
} from "@/lib/server/repositories/admin-promo-repository";

export const runtime = "nodejs";

const createPromoSchema = z.object({
  discountPercent: z.union([
    z.literal(10),
    z.literal(20),
    z.literal(30),
    z.literal(40),
    z.literal(50),
    z.literal(60),
    z.literal(70),
    z.literal(80),
    z.literal(90),
    z.literal(100),
  ]),
  code: z
    .string()
    .trim()
    .min(4)
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only")
    .optional(),
  label: z.string().trim().max(120).optional(),
  maxRedemptions: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);
  if (!isSupabaseConfigured()) {
    return jsonAdminError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  try {
    const migrationRequired = !(await isPromoModuleReady());
    const promos = await listAdminPromoCodes();
    return NextResponse.json({
      success: true as const,
      migrationRequired,
      hint: migrationRequired ? PROMO_MIGRATION_HINT : undefined,
      promos: promos.map((p) => ({
        id: p.id,
        code: p.code,
        label: p.label,
        discountPercent: p.discount_percent,
        active: p.active,
        maxRedemptions: p.max_redemptions,
        timesRedeemed: p.times_redeemed,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
      })),
    });
  } catch (e) {
    return handleAdminPromoRouteError(e, "Could not load promo codes.");
  }
}

export async function POST(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);
  if (!isSupabaseConfigured()) {
    return jsonAdminError(
      503,
      "SUPABASE_NOT_CONFIGURED",
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonAdminError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = createPromoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonAdminError(400, "VALIDATION_ERROR", parsed.error.errors[0]?.message ?? "Invalid payload");
  }

  const code = (parsed.data.code ?? generateAutoPromoCode(parsed.data.discountPercent)).toUpperCase();
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

  try {
    const stripePromo = await createStripePromoForDiscount({
      code,
      discountPercent: parsed.data.discountPercent,
      maxRedemptions: parsed.data.maxRedemptions ?? null,
      expiresAt,
    });

    const row = await insertAdminPromoCode({
      code: stripePromo.code,
      label: parsed.data.label ?? null,
      discountPercent: parsed.data.discountPercent,
      stripeCouponId: stripePromo.stripeCouponId,
      stripePromotionCodeId: stripePromo.stripePromotionCodeId,
      maxRedemptions: parsed.data.maxRedemptions ?? null,
      expiresAt,
    });

    return NextResponse.json({
      success: true as const,
      promo: {
        id: row.id,
        code: row.code,
        label: row.label,
        discountPercent: row.discount_percent,
        active: row.active,
        maxRedemptions: row.max_redemptions,
        timesRedeemed: row.times_redeemed,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Promo code already exists") {
      return jsonAdminError(409, "DUPLICATE_CODE", e.message);
    }
    return handleAdminPromoRouteError(e, "Could not create promo code.");
  }
}

const patchPromoSchema = z.object({
  id: z.string().uuid(),
  active: z.literal(false),
});

export async function PATCH(request: Request) {
  const gate = assertAdminAccess(getAdminKeyFromRequest(request));
  if (!gate.ok) return jsonAdminError(401, "UNAUTHORIZED", gate.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonAdminError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = patchPromoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonAdminError(400, "VALIDATION_ERROR", "Invalid payload");
  }

  try {
    const row = await deactivateAdminPromoCode(parsed.data.id);
    if (!row) return jsonAdminError(404, "NOT_FOUND", "Promo code not found.");

    await deactivateStripePromotionCode(row.stripe_promotion_code_id);

    return NextResponse.json({
      success: true as const,
      promo: {
        id: row.id,
        code: row.code,
        active: row.active,
      },
    });
  } catch (e) {
    return handleAdminPromoRouteError(e, "Could not deactivate promo code.");
  }
}
