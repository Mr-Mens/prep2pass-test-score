import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import { isMissingCommercialTableError } from "@/lib/server/commercial-schema";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type ReferralStatus = "pending" | "accepted" | "active" | "cancelled" | "graduated" | "expired";

export type InstructorReferralRow = {
  id: string;
  instructor_id: string;
  pupil_id: string | null;
  pupil_link_id: string | null;
  pupil_email: string;
  invite_token: string | null;
  referral_date: string;
  referral_status: ReferralStatus;
  accepted_at: string | null;
  activated_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
};

const COMMISSION_ELIGIBLE_STATUSES: ReferralStatus[] = ["accepted", "active"];

export async function upsertReferralForPupilInvite(input: {
  instructorId: string;
  pupilLinkId: string;
  pupilEmail: string;
  inviteToken?: string | null;
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

  const inviteToken = input.inviteToken?.trim() || null;

  if (existing) {
    const { data, error } = await supabase
      .from("instructor_referrals")
      .update({
        pupil_link_id: input.pupilLinkId,
        invite_token: inviteToken ?? (existing as InstructorReferralRow).invite_token,
        referral_status: "pending",
        accepted_at: null,
        activated_at: null,
        converted_at: null,
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
      invite_token: inviteToken,
      referral_status: "pending",
      updated_at: now,
    })
    .select("*")
    .single();
  if (error && isMissingCommercialTableError(error)) return null;
  if (error || !data) throw new Error(error?.message ?? "Could not create referral.");
  return data as InstructorReferralRow;
}

export async function getReferralByInviteToken(inviteToken: string): Promise<InstructorReferralRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_referrals")
    .select("*")
    .eq("invite_token", inviteToken)
    .maybeSingle();
  if (error && isMissingCommercialTableError(error)) return null;
  if (error) throw new Error(error.message);
  return data as InstructorReferralRow | null;
}

export async function linkReferralToPupil(input: {
  pupilLinkId: string;
  pupilId: string;
  pupilEmail: string;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(input.pupilEmail);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("instructor_referrals")
    .update({
      pupil_id: input.pupilId,
      referral_status: "accepted",
      accepted_at: now,
      updated_at: now,
    })
    .eq("pupil_link_id", input.pupilLinkId)
    .ilike("pupil_email", email);
  if (error && isMissingCommercialTableError(error)) return;
  if (error) throw new Error(error.message);
}

async function findReferralForLearner(
  pupilId: string,
  pupilEmail?: string,
  statuses: ReferralStatus[] = COMMISSION_ELIGIBLE_STATUSES,
): Promise<InstructorReferralRow | null> {
  const supabase = getSupabaseServerClient();

  const { data: byPupil } = await supabase
    .from("instructor_referrals")
    .select("*")
    .eq("pupil_id", pupilId)
    .in("referral_status", statuses)
    .order("referral_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (byPupil) return byPupil as InstructorReferralRow;

  if (!pupilEmail) return null;
  const email = normalizeEmail(pupilEmail);
  const { data: byEmail } = await supabase
    .from("instructor_referrals")
    .select("*")
    .ilike("pupil_email", email)
    .in("referral_status", statuses)
    .order("referral_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (byEmail as InstructorReferralRow | null) ?? null;
}

export async function getReferralForPupilUser(pupilId: string): Promise<InstructorReferralRow | null> {
  return findReferralForLearner(pupilId, undefined, ["accepted", "active"]);
}

/** Links learner on checkout without activating commission eligibility until first paid invoice. */
export async function prepareReferralForSubscription(
  pupilId: string,
  pupilEmail?: string,
): Promise<InstructorReferralRow | null> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  let referral = await findReferralForLearner(pupilId, pupilEmail, ["pending", "accepted", "active"]);
  if (!referral) return null;

  if (referral.referral_status === "active") return referral;

  const updates: Partial<InstructorReferralRow> & { updated_at: string } = {
    pupil_id: pupilId,
    updated_at: now,
  };

  if (referral.referral_status === "pending") {
    updates.referral_status = "accepted";
    updates.accepted_at = now;
  }

  const { data: updated, error } = await supabase
    .from("instructor_referrals")
    .update(updates)
    .eq("id", referral.id)
    .select("*")
    .single();
  if (error || !updated) throw new Error(error?.message ?? "Could not prepare referral.");
  return updated as InstructorReferralRow;
}

export async function activateReferralOnFirstPayment(pupilId: string): Promise<InstructorReferralRow | null> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const referral = await findReferralForLearner(pupilId, undefined, ["accepted", "active"]);
  if (!referral) return null;
  if (referral.referral_status === "active") return referral;

  const { data: updated, error } = await supabase
    .from("instructor_referrals")
    .update({
      pupil_id: pupilId,
      referral_status: "active",
      activated_at: now,
      converted_at: now,
      updated_at: now,
    })
    .eq("id", referral.id)
    .select("*")
    .single();
  if (error || !updated) throw new Error(error?.message ?? "Could not activate referral.");
  return updated as InstructorReferralRow;
}

export async function markReferralGraduated(pupilId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("instructor_referrals")
    .update({
      referral_status: "graduated",
      updated_at: new Date().toISOString(),
    })
    .eq("pupil_id", pupilId)
    .in("referral_status", ["accepted", "active"]);
  if (error) throw new Error(error.message);
}

export async function markReferralCancelled(pupilId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("instructor_referrals")
    .update({
      referral_status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("pupil_id", pupilId)
    .in("referral_status", ["accepted", "active"]);
  if (error && isMissingCommercialTableError(error)) return;
  if (error) throw new Error(error.message);
}

export async function markReferralExpiredByPupilLink(pupilLinkId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("instructor_referrals")
    .update({
      referral_status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("pupil_link_id", pupilLinkId)
    .in("referral_status", ["pending", "accepted"]);
  if (error && isMissingCommercialTableError(error)) return;
  if (error) throw new Error(error.message);
}

/** @deprecated Use prepareReferralForSubscription — kept for imports during transition. */
export const activateReferralOnSubscription = prepareReferralForSubscription;

/** @deprecated Use markReferralGraduated */
export const markReferralPassed = markReferralGraduated;
