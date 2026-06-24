import "server-only";

import {
  calculateReferralCommissionAmount,
  INSTRUCTOR_COMMISSION_RATE,
  INSTRUCTOR_MIN_PAYOUT_PENCE,
} from "@/lib/commercial/commission";
import { isMissingCommercialTableError } from "@/lib/server/commercial-schema";
import {
  activateReferralOnFirstPayment,
  getReferralForPupilUser,
} from "@/lib/server/repositories/referrals-repository";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type CommissionStatus = "pending" | "eligible" | "paid" | "void";

export type InstructorCommissionRow = {
  id: string;
  instructor_id: string;
  learner_id: string;
  referral_id: string;
  stripe_invoice_id: string;
  stripe_subscription_id: string | null;
  gross_amount: number;
  currency: string;
  commission_rate: number;
  commission_amount: number;
  status: CommissionStatus;
  payout_request_id: string | null;
  earned_at: string;
  paid_at: string | null;
  created_at: string;
};

export type PayoutRequestStatus = "requested" | "approved" | "paid" | "rejected";

export type InstructorPayoutRequestRow = {
  id: string;
  instructor_id: string;
  amount: number;
  status: PayoutRequestStatus;
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
};

export type InstructorReferralEarningsSummary = {
  activeReferredPupils: number;
  monthlyEstimatedPence: number;
  lifetimeEarnedPence: number;
  availableForPayoutPence: number;
  pendingPayoutRequestPence: number;
  minPayoutPence: number;
};

export type RecentCommissionView = {
  id: string;
  pupilName: string | null;
  pupilEmail: string;
  paymentDate: string;
  grossAmount: number;
  commissionAmount: number;
  status: CommissionStatus;
  currency: string;
};

const EMPTY_SUMMARY: InstructorReferralEarningsSummary = {
  activeReferredPupils: 0,
  monthlyEstimatedPence: 0,
  lifetimeEarnedPence: 0,
  availableForPayoutPence: 0,
  pendingPayoutRequestPence: 0,
  minPayoutPence: INSTRUCTOR_MIN_PAYOUT_PENCE,
};

function isMissingCommissionTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (isMissingCommercialTableError(error)) return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("instructor_commissions") || msg.includes("instructor_payout_requests");
}

export async function recordInstructorCommissionOnInvoicePaid(input: {
  learnerId: string;
  stripeInvoiceId: string;
  stripeSubscriptionId: string | null;
  amountPaidMinor: number;
  currency: string;
  earnedAt: Date;
}): Promise<InstructorCommissionRow | null> {
  if (input.amountPaidMinor <= 0) return null;

  const supabase = getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("instructor_commissions")
    .select("id")
    .eq("stripe_invoice_id", input.stripeInvoiceId)
    .maybeSingle();
  if (existing) return null;

  let referral = await getReferralForPupilUser(input.learnerId);
  if (!referral) return null;

  if (referral.referral_status === "accepted") {
    referral = await activateReferralOnFirstPayment(input.learnerId);
  }
  if (!referral || referral.referral_status !== "active") return null;

  const commissionAmount = calculateReferralCommissionAmount(input.amountPaidMinor);
  if (commissionAmount <= 0) return null;

  const { data, error } = await supabase
    .from("instructor_commissions")
    .insert({
      instructor_id: referral.instructor_id,
      learner_id: input.learnerId,
      referral_id: referral.id,
      stripe_invoice_id: input.stripeInvoiceId,
      stripe_subscription_id: input.stripeSubscriptionId,
      gross_amount: input.amountPaidMinor,
      currency: input.currency.toLowerCase(),
      commission_rate: INSTRUCTOR_COMMISSION_RATE,
      commission_amount: commissionAmount,
      status: "eligible",
      earned_at: input.earnedAt.toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return null;
    if (isMissingCommissionTableError(error)) return null;
    throw new Error(error.message);
  }

  return data as InstructorCommissionRow;
}

export async function getInstructorReferralEarningsSummary(
  instructorId: string,
): Promise<InstructorReferralEarningsSummary> {
  const supabase = getSupabaseServerClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [referralsRes, commissionsRes, payoutRequestsRes] = await Promise.all([
    supabase
      .from("instructor_referrals")
      .select("id, referral_status")
      .eq("instructor_id", instructorId),
    supabase
      .from("instructor_commissions")
      .select("commission_amount, status, earned_at, payout_request_id")
      .eq("instructor_id", instructorId),
    supabase
      .from("instructor_payout_requests")
      .select("amount, status")
      .eq("instructor_id", instructorId)
      .in("status", ["requested", "approved"]),
  ]);

  if (commissionsRes.error && isMissingCommissionTableError(commissionsRes.error)) {
    return EMPTY_SUMMARY;
  }
  if (referralsRes.error && !isMissingCommercialTableError(referralsRes.error)) {
    throw new Error(referralsRes.error.message);
  }
  if (commissionsRes.error) throw new Error(commissionsRes.error.message);
  if (payoutRequestsRes.error && !isMissingCommissionTableError(payoutRequestsRes.error)) {
    throw new Error(payoutRequestsRes.error.message);
  }

  const referrals = (referralsRes.data ?? []) as Array<{ referral_status: string }>;
  const commissions = (commissionsRes.data ?? []) as Array<{
    commission_amount: number;
    status: CommissionStatus;
    earned_at: string;
    payout_request_id: string | null;
  }>;
  const payoutRequests = (payoutRequestsRes.data ?? []) as Array<{ amount: number; status: PayoutRequestStatus }>;

  const activeReferredPupils = referrals.filter((r) => r.referral_status === "active").length;
  const nonVoid = commissions.filter((c) => c.status !== "void");

  const monthlyEstimatedPence = nonVoid
    .filter((c) => c.earned_at >= monthStart)
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const lifetimeEarnedPence = nonVoid.reduce((sum, c) => sum + c.commission_amount, 0);

  const availableForPayoutPence = nonVoid
    .filter((c) => c.status === "eligible" && !c.payout_request_id)
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const pendingPayoutRequestPence = payoutRequests.reduce((sum, r) => sum + r.amount, 0);

  return {
    activeReferredPupils,
    monthlyEstimatedPence,
    lifetimeEarnedPence,
    availableForPayoutPence,
    pendingPayoutRequestPence,
    minPayoutPence: INSTRUCTOR_MIN_PAYOUT_PENCE,
  };
}

export async function listRecentInstructorCommissions(
  instructorId: string,
  limit = 20,
): Promise<RecentCommissionView[]> {
  const supabase = getSupabaseServerClient();
  const { data: commissions, error } = await supabase
    .from("instructor_commissions")
    .select("id, learner_id, gross_amount, commission_amount, status, currency, earned_at")
    .eq("instructor_id", instructorId)
    .order("earned_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingCommissionTableError(error)) return [];
    throw new Error(error.message);
  }

  const rows = (commissions ?? []) as Array<{
    id: string;
    learner_id: string;
    gross_amount: number;
    commission_amount: number;
    status: CommissionStatus;
    currency: string;
    earned_at: string;
  }>;
  if (rows.length === 0) return [];

  const learnerIds = Array.from(new Set(rows.map((r) => r.learner_id)));
  const { data: pupils } = await supabase
    .from("instructor_pupils")
    .select("linked_learner_user_id, pupil_name, pupil_email")
    .eq("instructor_user_id", instructorId)
    .in("linked_learner_user_id", learnerIds);

  const pupilByLearner = new Map<string, { name: string | null; email: string }>();
  for (const pupil of (pupils ?? []) as Array<{
    linked_learner_user_id: string | null;
    pupil_name: string;
    pupil_email: string;
  }>) {
    if (pupil.linked_learner_user_id) {
      pupilByLearner.set(pupil.linked_learner_user_id, {
        name: pupil.pupil_name,
        email: pupil.pupil_email,
      });
    }
  }

  return rows.map((row) => {
    const pupil = pupilByLearner.get(row.learner_id);
    return {
      id: row.id,
      pupilName: pupil?.name ?? null,
      pupilEmail: pupil?.email ?? "Learner",
      paymentDate: row.earned_at,
      grossAmount: row.gross_amount,
      commissionAmount: row.commission_amount,
      status: row.status,
      currency: row.currency,
    };
  });
}

export async function listOpenPayoutRequestsForInstructor(
  instructorId: string,
): Promise<InstructorPayoutRequestRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_payout_requests")
    .select("*")
    .eq("instructor_id", instructorId)
    .in("status", ["requested", "approved"])
    .order("requested_at", { ascending: false });
  if (error) {
    if (isMissingCommissionTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as InstructorPayoutRequestRow[];
}

export async function createInstructorPayoutRequest(instructorId: string): Promise<InstructorPayoutRequestRow> {
  const supabase = getSupabaseServerClient();

  const openRequests = await listOpenPayoutRequestsForInstructor(instructorId);
  if (openRequests.length > 0) {
    throw new Error("PAYOUT_REQUEST_ALREADY_OPEN");
  }

  const { data: eligibleRows, error: eligibleErr } = await supabase
    .from("instructor_commissions")
    .select("id, commission_amount")
    .eq("instructor_id", instructorId)
    .eq("status", "eligible")
    .is("payout_request_id", null)
    .order("earned_at", { ascending: true });

  if (eligibleErr) throw new Error(eligibleErr.message);

  const eligible = (eligibleRows ?? []) as Array<{ id: string; commission_amount: number }>;
  const amount = eligible.reduce((sum, row) => sum + row.commission_amount, 0);
  if (amount < INSTRUCTOR_MIN_PAYOUT_PENCE) {
    throw new Error("PAYOUT_BELOW_MINIMUM");
  }

  const { data: request, error: requestErr } = await supabase
    .from("instructor_payout_requests")
    .insert({
      instructor_id: instructorId,
      amount,
      status: "requested",
    })
    .select("*")
    .single();
  if (requestErr || !request) throw new Error(requestErr?.message ?? "Could not create payout request.");

  const requestRow = request as InstructorPayoutRequestRow;
  const commissionIds = eligible.map((row) => row.id);
  if (commissionIds.length > 0) {
    const { error: linkErr } = await supabase
      .from("instructor_commissions")
      .update({ payout_request_id: requestRow.id })
      .in("id", commissionIds);
    if (linkErr) throw new Error(linkErr.message);
  }

  return requestRow;
}

export async function listAllPayoutRequestsForAdmin(): Promise<
  Array<
    InstructorPayoutRequestRow & {
      instructor_email: string | null;
    }
  >
> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_payout_requests")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as InstructorPayoutRequestRow[];
  if (rows.length === 0) return [];

  const instructorIds = Array.from(new Set(rows.map((r) => r.instructor_id)));
  const emails = new Map<string, string | null>();
  for (const instructorId of instructorIds) {
    const { data: authData } = await supabase.auth.admin.getUserById(instructorId);
    emails.set(instructorId, authData.user?.email ?? null);
  }

  return rows.map((row) => ({
    ...row,
    instructor_email: emails.get(row.instructor_id) ?? null,
  }));
}

export async function updatePayoutRequestStatus(input: {
  requestId: string;
  status: PayoutRequestStatus;
  notes?: string | null;
}): Promise<InstructorPayoutRequestRow> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data: existing, error: existingErr } = await supabase
    .from("instructor_payout_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();
  if (existingErr || !existing) throw new Error(existingErr?.message ?? "Payout request not found.");

  const { data, error } = await supabase
    .from("instructor_payout_requests")
    .update({
      status: input.status,
      processed_at: input.status === "requested" ? null : now,
      notes: input.notes ?? (existing as InstructorPayoutRequestRow).notes,
    })
    .eq("id", input.requestId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not update payout request.");

  if (input.status === "paid") {
    await supabase
      .from("instructor_commissions")
      .update({ status: "paid", paid_at: now })
      .eq("payout_request_id", input.requestId)
      .eq("status", "eligible");
  }

  if (input.status === "rejected") {
    await supabase
      .from("instructor_commissions")
      .update({ payout_request_id: null })
      .eq("payout_request_id", input.requestId)
      .eq("status", "eligible");
  }

  return data as InstructorPayoutRequestRow;
}

export async function voidCommissionsForLearner(learnerId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase
    .from("instructor_commissions")
    .update({ status: "void" })
    .eq("learner_id", learnerId)
    .eq("status", "eligible")
    .is("payout_request_id", null);
}
