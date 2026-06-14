import "server-only";

import { COMMERCIAL } from "@/lib/commercial/constants";
import { normalizeEmail } from "@/lib/normalize-email";
import { isMissingCommercialTableError } from "@/lib/server/commercial-schema";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type ReferralStatus = "pending" | "linked" | "active" | "passed" | "expired";

export type InstructorReferralRow = {
  id: string;
  instructor_id: string;
  pupil_id: string | null;
  pupil_link_id: string | null;
  pupil_email: string;
  referral_date: string;
  referral_status: ReferralStatus;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReferralPayoutRow = {
  id: string;
  referral_id: string;
  instructor_id: string;
  payout_type: "signup_bonus" | "monthly_commission";
  amount_pence: number;
  month_number: number | null;
  period_start: string | null;
  period_end: string | null;
  status: "pending" | "coming_soon" | "paid" | "void";
  stripe_invoice_id: string | null;
  created_at: string;
};

export async function upsertReferralForPupilInvite(input: {
  instructorId: string;
  pupilLinkId: string;
  pupilEmail: string;
}): Promise<InstructorReferralRow | null> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(input.pupilEmail);
  const now = new Date().toISOString();

  const { data: existing, error: existingErr } = await supabase
    .from("instructor_referrals")
    .select("*")
    .eq("instructor_id", input.instructorId)
    .ilike("pupil_email", email)
    .maybeSingle();
  if (existingErr && isMissingCommercialTableError(existingErr)) return null;

  if (existing) {
    const { data, error } = await supabase
      .from("instructor_referrals")
      .update({
        pupil_link_id: input.pupilLinkId,
        referral_status: "pending",
        updated_at: now,
      })
      .eq("id", (existing as InstructorReferralRow).id)
      .select("*")
      .single();
    if (error && isMissingCommercialTableError(error)) return null;
    if (error || !data) throw new Error(error?.message ?? "Could not update referral.");
    return data as InstructorReferralRow;
  }

  const { data, error } = await supabase
    .from("instructor_referrals")
    .insert({
      instructor_id: input.instructorId,
      pupil_link_id: input.pupilLinkId,
      pupil_email: email,
      referral_status: "pending",
      updated_at: now,
    })
    .select("*")
    .single();
  if (error && isMissingCommercialTableError(error)) return null;
  if (error || !data) throw new Error(error?.message ?? "Could not create referral.");
  return data as InstructorReferralRow;
}

export async function linkReferralToPupil(input: {
  pupilLinkId: string;
  pupilId: string;
  pupilEmail: string;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(input.pupilEmail);
  const { error } = await supabase
    .from("instructor_referrals")
    .update({
      pupil_id: input.pupilId,
      referral_status: "linked",
      updated_at: new Date().toISOString(),
    })
    .eq("pupil_link_id", input.pupilLinkId)
    .ilike("pupil_email", email);
  if (error && isMissingCommercialTableError(error)) return;
  if (error) throw new Error(error.message);
}

export async function getReferralForPupilUser(pupilId: string): Promise<InstructorReferralRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_referrals")
    .select("*")
    .eq("pupil_id", pupilId)
    .in("referral_status", ["linked", "active"])
    .order("converted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as InstructorReferralRow | null;
}

export async function activateReferralOnSubscription(
  pupilId: string,
  pupilEmail?: string,
): Promise<InstructorReferralRow | null> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  let referral: InstructorReferralRow | null = null;

  const { data: byPupil } = await supabase
    .from("instructor_referrals")
    .select("*")
    .eq("pupil_id", pupilId)
    .in("referral_status", ["linked", "pending", "active"])
    .order("referral_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  referral = (byPupil as InstructorReferralRow | null) ?? null;

  if (!referral && pupilEmail) {
    const email = normalizeEmail(pupilEmail);
    const { data: byEmail } = await supabase
      .from("instructor_referrals")
      .select("*")
      .ilike("pupil_email", email)
      .in("referral_status", ["linked", "pending"])
      .order("referral_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    referral = (byEmail as InstructorReferralRow | null) ?? null;
  }

  if (!referral) return null;
  if (referral.referral_status === "active") return referral;

  const { data: updated, error } = await supabase
    .from("instructor_referrals")
    .update({
      pupil_id: pupilId,
      referral_status: "active",
      converted_at: now,
      updated_at: now,
    })
    .eq("id", referral.id)
    .select("*")
    .single();
  if (error || !updated) throw new Error(error?.message ?? "Could not activate referral.");
  return updated as InstructorReferralRow;
}

export async function markReferralPassed(pupilId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("instructor_referrals")
    .update({
      referral_status: "passed",
      updated_at: new Date().toISOString(),
    })
    .eq("pupil_id", pupilId)
    .in("referral_status", ["linked", "active"]);
  if (error) throw new Error(error.message);
}

async function insertPayoutIfMissing(input: {
  referralId: string;
  instructorId: string;
  payoutType: "signup_bonus" | "monthly_commission";
  amountPence: number;
  monthNumber?: number;
  periodStart?: string;
  periodEnd?: string;
  stripeInvoiceId?: string;
}): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("referral_payouts")
    .select("id")
    .eq("referral_id", input.referralId)
    .eq("payout_type", input.payoutType)
    .maybeSingle();

  if (input.payoutType === "monthly_commission" && input.monthNumber != null) {
    const { data: monthExisting } = await supabase
      .from("referral_payouts")
      .select("id")
      .eq("referral_id", input.referralId)
      .eq("payout_type", "monthly_commission")
      .eq("month_number", input.monthNumber)
      .maybeSingle();
    if (monthExisting) return false;
  } else if (existing) {
    return false;
  }

  const { error } = await supabase.from("referral_payouts").insert({
    referral_id: input.referralId,
    instructor_id: input.instructorId,
    payout_type: input.payoutType,
    amount_pence: input.amountPence,
    month_number: input.monthNumber ?? null,
    period_start: input.periodStart ?? null,
    period_end: input.periodEnd ?? null,
    status: "coming_soon",
    stripe_invoice_id: input.stripeInvoiceId ?? null,
  });
  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }
  return true;
}

export async function recordReferralSignupBonus(referral: InstructorReferralRow): Promise<void> {
  await insertPayoutIfMissing({
    referralId: referral.id,
    instructorId: referral.instructor_id,
    payoutType: "signup_bonus",
    amountPence: COMMERCIAL.referral.signupBonusPence,
  });
}

export async function recordReferralMonthlyCommission(input: {
  referral: InstructorReferralRow;
  monthNumber: number;
  periodStart?: string;
  periodEnd?: string;
  stripeInvoiceId?: string;
}): Promise<void> {
  if (input.monthNumber < 1 || input.monthNumber > COMMERCIAL.referral.maxCommissionMonths) return;
  await insertPayoutIfMissing({
    referralId: input.referral.id,
    instructorId: input.referral.instructor_id,
    payoutType: "monthly_commission",
    amountPence: COMMERCIAL.referral.monthlyCommissionPence,
    monthNumber: input.monthNumber,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    stripeInvoiceId: input.stripeInvoiceId,
  });
}

export async function countMonthlyCommissionsForReferral(referralId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { count, error } = await supabase
    .from("referral_payouts")
    .select("id", { count: "exact", head: true })
    .eq("referral_id", referralId)
    .eq("payout_type", "monthly_commission");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type InstructorEarningsSummary = {
  activeReferredPupils: number;
  passedPupils: number;
  monthlyEarningsPence: number;
  lifetimeEarningsPence: number;
  averageReadinessScore: number | null;
  payoutsComingSoon: boolean;
};

const EMPTY_EARNINGS: Omit<InstructorEarningsSummary, "averageReadinessScore"> = {
  activeReferredPupils: 0,
  passedPupils: 0,
  monthlyEarningsPence: 0,
  lifetimeEarningsPence: 0,
  payoutsComingSoon: true,
};

async function averageReadinessForInstructorPupils(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  pupilsRes: { data: unknown[] | null },
): Promise<number | null> {
  const pupils = (pupilsRes.data ?? []) as Array<{ linked_learner_user_id: string | null }>;
  const learnerIds = pupils.map((p) => p.linked_learner_user_id).filter(Boolean) as string[];
  if (learnerIds.length === 0) return null;

  const { data: reports } = await supabase
    .from("reports")
    .select("user_id, readiness_score, created_at")
    .in("user_id", learnerIds)
    .order("created_at", { ascending: false });
  const latestByUser = new Map<string, number>();
  for (const row of (reports ?? []) as Array<{ user_id: string; readiness_score: number }>) {
    if (!latestByUser.has(row.user_id)) latestByUser.set(row.user_id, row.readiness_score);
  }
  const scores = Array.from(latestByUser.values());
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

async function emptyEarningsSummaryFromPupils(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  _instructorId: string,
  pupilsRes: { data: unknown[] | null; error?: { code?: string; message?: string } | null },
): Promise<InstructorEarningsSummary> {
  const averageReadinessScore = pupilsRes.error
    ? null
    : await averageReadinessForInstructorPupils(supabase, pupilsRes);
  return { ...EMPTY_EARNINGS, averageReadinessScore };
}

export async function getInstructorEarningsSummary(instructorId: string): Promise<InstructorEarningsSummary> {
  const supabase = getSupabaseServerClient();

  const [referralsRes, payoutsRes, pupilsRes] = await Promise.all([
    supabase.from("instructor_referrals").select("id, referral_status, pupil_id").eq("instructor_id", instructorId),
    supabase.from("referral_payouts").select("amount_pence, created_at, status").eq("instructor_id", instructorId),
    supabase
      .from("instructor_pupils")
      .select("linked_learner_user_id, link_status")
      .eq("instructor_user_id", instructorId)
      .eq("link_status", "accepted"),
  ]);

  if (referralsRes.error && isMissingCommercialTableError(referralsRes.error)) {
    return emptyEarningsSummaryFromPupils(supabase, instructorId, pupilsRes);
  }
  if (referralsRes.error) throw new Error(referralsRes.error.message);
  if (payoutsRes.error && !isMissingCommercialTableError(payoutsRes.error)) {
    throw new Error(payoutsRes.error.message);
  }
  if (pupilsRes.error) throw new Error(pupilsRes.error.message);

  const referrals = (referralsRes.data ?? []) as Array<{ id: string; referral_status: ReferralStatus; pupil_id: string | null }>;
  const payouts = (payoutsRes.data ?? []) as Array<{ amount_pence: number; created_at: string; status: string }>;
  const pupils = (pupilsRes.data ?? []) as Array<{ linked_learner_user_id: string | null }>;

  const activeReferredPupils = referrals.filter((r) => r.referral_status === "active").length;
  const passedPupils = referrals.filter((r) => r.referral_status === "passed").length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyEarningsPence = payouts
    .filter((p) => p.created_at >= monthStart && p.status !== "void")
    .reduce((sum, p) => sum + p.amount_pence, 0);
  const lifetimeEarningsPence = payouts.filter((p) => p.status !== "void").reduce((sum, p) => sum + p.amount_pence, 0);

  const learnerIds = pupils.map((p) => p.linked_learner_user_id).filter(Boolean) as string[];
  let averageReadinessScore: number | null = null;
  if (learnerIds.length > 0) {
    averageReadinessScore = await averageReadinessForInstructorPupils(supabase, pupilsRes);
  }

  return {
    activeReferredPupils,
    passedPupils,
    monthlyEarningsPence,
    lifetimeEarningsPence,
    averageReadinessScore,
    payoutsComingSoon: true,
  };
}

export async function processReferralSubscriptionPayment(input: {
  pupilId: string;
  stripeInvoiceId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  isFirstPaidInvoice?: boolean;
}): Promise<void> {
  let referral = await getReferralForPupilUser(input.pupilId);
  if (!referral) {
    referral = await activateReferralOnSubscription(input.pupilId);
  }
  if (!referral || referral.referral_status !== "active") return;

  if (input.isFirstPaidInvoice) {
    await recordReferralSignupBonus(referral);
  }

  const existingMonths = await countMonthlyCommissionsForReferral(referral.id);
  const nextMonth = existingMonths + 1;
  if (nextMonth > COMMERCIAL.referral.maxCommissionMonths) return;

  await recordReferralMonthlyCommission({
    referral,
    monthNumber: nextMonth,
    periodStart: input.periodStart?.toISOString().slice(0, 10),
    periodEnd: input.periodEnd?.toISOString().slice(0, 10),
    stripeInvoiceId: input.stripeInvoiceId,
  });
}
