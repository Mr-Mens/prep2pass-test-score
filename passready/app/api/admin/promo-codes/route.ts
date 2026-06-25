import { NextResponse } from "next/server";
import { z } from "zod";

import {
  formatPromotionSummary,
  formatPromotionTypeLabel,
} from "@/lib/admin/promotions";
import { createStripePromoForDiscount, deactivateStripePromotionCode } from "@/lib/server/admin-promo-stripe";
import { handleAdminPromoRouteError, jsonAdminError } from "@/lib/server/admin-promo-route-errors";
import { assertAdminAccess, getAdminKeyFromRequest } from "@/lib/server/admin-gate";
import { isPromoModuleReady, PROMO_MIGRATION_HINT } from "@/lib/server/commercial-schema";
import { isSupabaseConfigured } from "@/lib/server/supabase";
import {
  deactivateAdminPromoCode,
  generateAutoPromoCode,
  generateAutoTrialPromoCode,
  getPromotionAnalytics,
  insertAdminDiscountPromotion,
  insertAdminTrialPromotion,
  listAdminPromoCodes,
} from "@/lib/server/repositories/admin-promo-repository";

export const runtime = "nodejs";

const sharedPromoFields = {
  code: z
    .string()
    .trim()
    .min(4)
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens only")
    .optional(),
  campaignName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  label: z.string().trim().max(120).optional(),
  maxRedemptions: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
};

const createDiscountPromoSchema = z.object({
  promotionType: z.literal("discount").optional(),
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
  ...sharedPromoFields,
});

const createTrialPromoSchema = z.object({
  promotionType: z.literal("trial_extension"),
  trialDays: z.number().int().min(1).max(365),
  ...sharedPromoFields,
});

const createPromoSchema = z.union([createTrialPromoSchema, createDiscountPromoSchema]);

function serializePromo(row: Awaited<ReturnType<typeof listAdminPromoCodes>>[number], analytics?: Awaited<ReturnType<typeof getPromotionAnalytics>>) {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    promotionType: row.promotion_type,
    discountPercent: row.discount_percent,
    trialDays: row.trial_days,
    campaignName: row.campaign_name,
    notes: row.notes,
    active: row.active,
    maxRedemptions: row.max_redemptions,
    timesRedeemed: row.times_redeemed,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    summary: formatPromotionSummary({
      promotionType: row.promotion_type,
      discountPercent: row.discount_percent,
      trialDays: row.trial_days,
    }),
    typeLabel: formatPromotionTypeLabel(row.promotion_type),
    analytics: analytics ?? undefined,
  };
}

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

  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type");
  const promotionType =
    typeFilter === "discount" || typeFilter === "trial_extension" ? typeFilter : undefined;

  try {
    const migrationRequired = !(await isPromoModuleReady());
    const promos = await listAdminPromoCodes(promotionType);
    const withAnalytics = await Promise.all(
      promos.map(async (p) => {
        let analytics;
        try {
          analytics = await getPromotionAnalytics(p.id);
        } catch {
          analytics = {
            timesRedeemed: p.times_redeemed,
            activeUsers: 0,
            trialConversions: 0,
            discountConversions: 0,
          };
        }
        return serializePromo(p, analytics);
      }),
    );

    return NextResponse.json({
      success: true as const,
      migrationRequired,
      hint: migrationRequired ? PROMO_MIGRATION_HINT : undefined,
      promos: withAnalytics,
    });
  } catch (e) {
    return handleAdminPromoRouteError(e, "Could not load promotions.");
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

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  const campaignName = parsed.data.campaignName ?? parsed.data.label ?? null;

  try {
    if ("promotionType" in parsed.data && parsed.data.promotionType === "trial_extension") {
      const code = (parsed.data.code ?? generateAutoTrialPromoCode(parsed.data.trialDays)).toUpperCase();
      const row = await insertAdminTrialPromotion({
        code,
        trialDays: parsed.data.trialDays,
        campaignName,
        notes: parsed.data.notes ?? null,
        maxRedemptions: parsed.data.maxRedemptions ?? null,
        expiresAt,
      });

      return NextResponse.json({
        success: true as const,
        promo: serializePromo(row, {
          timesRedeemed: 0,
          activeUsers: 0,
          trialConversions: 0,
          discountConversions: 0,
        }),
      });
    }

    const discountData = parsed.data as z.infer<typeof createDiscountPromoSchema>;
    const code = (discountData.code ?? generateAutoPromoCode(discountData.discountPercent)).toUpperCase();
    const stripePromo = await createStripePromoForDiscount({
      code,
      discountPercent: discountData.discountPercent,
      maxRedemptions: discountData.maxRedemptions ?? null,
      expiresAt,
    });

    const row = await insertAdminDiscountPromotion({
      code: stripePromo.code,
      campaignName,
      notes: discountData.notes ?? null,
      discountPercent: discountData.discountPercent,
      stripeCouponId: stripePromo.stripeCouponId,
      stripePromotionCodeId: stripePromo.stripePromotionCodeId,
      maxRedemptions: discountData.maxRedemptions ?? null,
      expiresAt,
    });

    return NextResponse.json({
      success: true as const,
      promo: serializePromo(row, {
        timesRedeemed: 0,
        activeUsers: 0,
        trialConversions: 0,
        discountConversions: 0,
      }),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Promo code already exists") {
      return jsonAdminError(409, "DUPLICATE_CODE", e.message);
    }
    return handleAdminPromoRouteError(e, "Could not create promotion.");
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
    if (!row) return jsonAdminError(404, "NOT_FOUND", "Promotion not found.");

    if (row.stripe_promotion_code_id) {
      await deactivateStripePromotionCode(row.stripe_promotion_code_id);
    }

    return NextResponse.json({
      success: true as const,
      promo: {
        id: row.id,
        code: row.code,
        active: row.active,
      },
    });
  } catch (e) {
    return handleAdminPromoRouteError(e, "Could not deactivate promotion.");
  }
}
