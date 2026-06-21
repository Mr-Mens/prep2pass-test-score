import { NextResponse } from "next/server";
import { z } from "zod";

import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { sendGraduateConfirmationEmail } from "@/lib/email/templates/graduate-confirmation";
import { lookupUserContact } from "@/lib/server/lookup-user-contact";
import { getLearnerAccessStatus } from "@/lib/server/learner-access";
import { markReferralPassed } from "@/lib/server/repositories/referrals-repository";
import { recordGraduation } from "@/lib/server/repositories/graduations-repository";
import { cancelSubscriptionImmediately, getSubscriptionByUserId } from "@/lib/server/repositories/subscriptions-repository";
import { cancelStripeSubscription } from "@/lib/server/stripe";

export const runtime = "nodejs";

const bodySchema = z.object({
  passDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  certificateStoragePath: z.string().max(500).optional(),
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
    return jsonError(400, "VALIDATION_ERROR", "Pass date must be YYYY-MM-DD.");
  }

  const access = await getLearnerAccessStatus(auth.userId);
  if (access.isGraduated) {
    return jsonError(409, "ALREADY_GRADUATED", "You have already recorded your pass.");
  }

  try {
    const subscription = await getSubscriptionByUserId(auth.userId);
    if (subscription?.stripe_subscription_id) {
      try {
        await cancelStripeSubscription(subscription.stripe_subscription_id);
      } catch (e) {
        console.error("[graduate] stripe_cancel_failed", e);
      }
    }
    await cancelSubscriptionImmediately(auth.userId);

    const graduation = await recordGraduation({
      userId: auth.userId,
      passDate: parsed.data.passDate,
      certificateStoragePath: parsed.data.certificateStoragePath ?? null,
    });

    await markReferralPassed(auth.userId);

    try {
      const contact = await lookupUserContact(auth.userId);
      await sendGraduateConfirmationEmail({
        toEmail: auth.email,
        firstName: contact.firstName,
        passDate: parsed.data.passDate,
      });
    } catch (e) {
      console.error("[graduate] confirmation_email_failed", e);
    }

    return NextResponse.json({
      success: true as const,
      graduation: {
        passDate: graduation.pass_date,
        recordedAt: graduation.recorded_at,
      },
    });
  } catch (e) {
    console.error("[graduate] failed", e);
    return jsonError(500, "GRADUATE_FAILED", "Could not record your pass. Please try again.");
  }
}
