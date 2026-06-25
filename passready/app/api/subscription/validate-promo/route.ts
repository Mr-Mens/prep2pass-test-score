import { NextResponse } from "next/server";
import { z } from "zod";

import { formatPromotionSummary } from "@/lib/admin/promotions";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { resolveCheckoutPromo } from "@/lib/server/resolve-checkout-promo";

export const runtime = "nodejs";

const bodySchema = z.object({
  promoCode: z.string().trim().min(4).max(32),
});

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH_REQUIRED", auth.message);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Enter a valid promotion code.");
  }

  const resolved = await resolveCheckoutPromo({
    email: auth.email,
    promoCode: parsed.data.promoCode,
  });

  if (!resolved.ok) {
    return jsonError(400, "INVALID_PROMO", resolved.message);
  }

  const promo = resolved.promo;
  return NextResponse.json({
    success: true as const,
    promotion: {
      code: promo.code,
      type: promo.type,
      summary: formatPromotionSummary({
        promotionType: promo.type,
        discountPercent: promo.type === "discount" ? promo.discountPercent : null,
        trialDays: promo.type === "trial_extension" ? promo.trialDays : null,
      }),
      discountPercent: promo.type === "discount" ? promo.discountPercent : null,
      trialDays: promo.type === "trial_extension" ? promo.trialDays : null,
    },
  });
}
