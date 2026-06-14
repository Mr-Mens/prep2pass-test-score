import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import { resolveLearnerUserIdByEmail } from "@/lib/server/resolve-learner-user-id";
import { linkReferralToPupil, upsertReferralForPupilInvite } from "@/lib/server/repositories/referrals-repository";
import {
  createInstructorPupilInviteNotification,
  listUnresolvedNotificationsForUser,
} from "@/lib/server/repositories/app-notifications-repository";
import { getSupabaseServerClient } from "@/lib/server/supabase";

import type { InstructorPupilInsights, PupilRow } from "@/lib/instructor/pupil-link-types";
import {
  countReportsByUserId,
  getReportById,
  listJourneySnapshotsByUserId,
  listScoreHistoryByUserId,
} from "@/lib/server/repositories/reports-repository";

export type { PupilRow } from "@/lib/instructor/pupil-link-types";

export async function listPupilsForInstructor(instructorUserId: string): Promise<PupilRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_pupils")
    .select("*")
    .eq("instructor_user_id", instructorUserId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PupilRow[];
}

async function getInstructorDisplayName(instructorUserId: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("instructor_profiles")
    .select("display_name")
    .eq("user_id", instructorUserId)
    .maybeSingle();

  const fromProfile = (profile as { display_name?: string | null } | null)?.display_name?.trim();
  if (fromProfile) return fromProfile;
  return "Your instructor";
}

export async function createPupilInvite(input: {
  instructorUserId: string;
  pupilName: string;
  pupilEmail: string;
}): Promise<PupilRow> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(input.pupilEmail);
  const now = new Date().toISOString();
  const proposedLearnerId = await resolveLearnerUserIdByEmail(email);

  const { data: existing } = await supabase
    .from("instructor_pupils")
    .select("*")
    .eq("instructor_user_id", input.instructorUserId)
    .ilike("pupil_email", email)
    .maybeSingle();

  let pupil: PupilRow;

  if (existing) {
    const { data, error } = await supabase
      .from("instructor_pupils")
      .update({
        pupil_name: input.pupilName.trim(),
        linked_learner_user_id: null,
        link_status: "pending",
        link_responded_at: null,
        updated_at: now,
      })
      .eq("id", (existing as PupilRow).id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not update pupil invite.");
    pupil = data as PupilRow;
  } else {
    const { data, error } = await supabase
      .from("instructor_pupils")
      .insert({
        instructor_user_id: input.instructorUserId,
        pupil_name: input.pupilName.trim(),
        pupil_email: email,
        linked_learner_user_id: null,
        link_status: "pending",
        updated_at: now,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Could not create pupil invite.");
    pupil = data as PupilRow;
  }

  if (proposedLearnerId) {
    const instructorName = await getInstructorDisplayName(input.instructorUserId);
    await createInstructorPupilInviteNotification({
      learnerUserId: proposedLearnerId,
      pupilLinkId: pupil.id,
      instructorName,
      pupilName: pupil.pupil_name,
    });
  }

  await upsertReferralForPupilInvite({
    instructorId: input.instructorUserId,
    pupilLinkId: pupil.id,
    pupilEmail: email,
  }).catch(() => {
    /* referral tables optional until migration 010 */
  });

  return pupil;
}

export async function syncPendingPupilInvitesForLearner(learnerUserId: string, learnerEmail: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(learnerEmail);

  const { data: pendingRows, error } = await supabase
    .from("instructor_pupils")
    .select("id, pupil_name, instructor_user_id")
    .eq("link_status", "pending")
    .ilike("pupil_email", email);

  if (error || !pendingRows?.length) return;

  for (const row of pendingRows) {
    const pupil = row as { id: string; pupil_name: string; instructor_user_id: string };
    const instructorName = await getInstructorDisplayName(pupil.instructor_user_id);
    await createInstructorPupilInviteNotification({
      learnerUserId,
      pupilLinkId: pupil.id,
      instructorName,
      pupilName: pupil.pupil_name,
    });
  }
}

export async function listLearnerNotifications(learnerUserId: string, learnerEmail: string) {
  await syncPendingPupilInvitesForLearner(learnerUserId, learnerEmail);
  return listUnresolvedNotificationsForUser(learnerUserId);
}

export async function getPupilLinkForInstructor(
  pupilLinkId: string,
  instructorUserId: string,
): Promise<PupilRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("instructor_pupils")
    .select("*")
    .eq("id", pupilLinkId)
    .eq("instructor_user_id", instructorUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as PupilRow | null;
}

export async function getPupilLinkById(pupilLinkId: string): Promise<PupilRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("instructor_pupils").select("*").eq("id", pupilLinkId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as PupilRow | null;
}

export async function respondToPupilInvite(input: {
  pupilLinkId: string;
  learnerUserId: string;
  learnerEmail: string;
  action: "accept" | "decline";
}): Promise<PupilRow> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(input.learnerEmail);
  const pupil = await getPupilLinkById(input.pupilLinkId);
  if (!pupil) throw new Error("Invitation not found.");
  if (normalizeEmail(pupil.pupil_email) !== email) {
    throw new Error("This invitation is not for your account.");
  }
  if (pupil.link_status !== "pending") throw new Error("This invitation has already been answered.");

  const now = new Date().toISOString();
  const linkStatus = input.action === "accept" ? "accepted" : "declined";

  const { data, error } = await supabase
    .from("instructor_pupils")
    .update({
      link_status: linkStatus,
      linked_learner_user_id: input.action === "accept" ? input.learnerUserId : null,
      link_responded_at: now,
      updated_at: now,
    })
    .eq("id", input.pupilLinkId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not update invitation.");
  const updated = data as PupilRow;
  if (input.action === "accept") {
    await linkReferralToPupil({
      pupilLinkId: input.pupilLinkId,
      pupilId: input.learnerUserId,
      pupilEmail: email,
    });
  }
  return updated;
}

export async function autoAcceptPupilInviteByToken(input: {
  inviteToken: string;
  learnerUserId: string;
  learnerEmail: string;
}): Promise<PupilRow | null> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(input.learnerEmail);

  const { data: pupil, error } = await supabase
    .from("instructor_pupils")
    .select("*")
    .eq("invite_token", input.inviteToken)
    .maybeSingle();
  if (error || !pupil) return null;

  const row = pupil as PupilRow;
  if (normalizeEmail(row.pupil_email) !== email) return null;
  if (row.link_status === "accepted" && row.linked_learner_user_id === input.learnerUserId) return row;
  if (row.link_status !== "pending") return null;

  return respondToPupilInvite({
    pupilLinkId: row.id,
    learnerUserId: input.learnerUserId,
    learnerEmail: email,
    action: "accept",
  });
}

export async function getPupilInviteSignupUrl(pupilLinkId: string, origin: string): Promise<string | null> {
  const pupil = await getPupilLinkById(pupilLinkId);
  if (!pupil) return null;
  const token = (pupil as PupilRow & { invite_token?: string }).invite_token;
  if (!token) return null;
  const q = new URLSearchParams({ invite: token, next: "/dashboard" });
  return `${origin}/signup?${q.toString()}`;
}

export async function getInstructorPupilInsights(
  pupilLinkId: string,
  instructorUserId: string,
): Promise<InstructorPupilInsights | null> {
  const pupil = await getPupilLinkForInstructor(pupilLinkId, instructorUserId);
  if (!pupil || pupil.link_status !== "accepted" || !pupil.linked_learner_user_id) return null;

  const learnerUserId = pupil.linked_learner_user_id;
  const [snaps, reportCount, parentsBlock, scoreHistory] = await Promise.all([
    listJourneySnapshotsByUserId(learnerUserId),
    countReportsByUserId(learnerUserId),
    loadParentActivityForLearner(learnerUserId),
    listScoreHistoryByUserId(learnerUserId),
  ]);

  const latest = snaps.length ? snaps[snaps.length - 1]! : null;
  const reportsNewestFirst = [...scoreHistory].reverse();

  return {
    pupil,
    learner: {
      name: pupil.pupil_name,
      email: pupil.pupil_email,
      latestScore: latest?.readiness_score ?? null,
      latestLabel: latest?.readiness_label ?? null,
      reportsCompleted: reportCount,
      lastAssessedAt: latest?.created_at ?? null,
    },
    parents: parentsBlock,
    reports: reportsNewestFirst,
    journeySnapshots: snaps,
  };
}

export async function getLinkedPupilReportForInstructor(
  pupilLinkId: string,
  reportId: string,
  instructorUserId: string,
) {
  const pupil = await getPupilLinkForInstructor(pupilLinkId, instructorUserId);
  if (!pupil || pupil.link_status !== "accepted" || !pupil.linked_learner_user_id) return null;

  const report = await getReportById(reportId);
  if (!report || report.user_id !== pupil.linked_learner_user_id) return null;

  return { pupil, report };
}

async function loadParentActivityForLearner(learnerUserId: string) {
  const supabase = getSupabaseServerClient();
  const { data: parentLinks, error } = await supabase
    .from("parent_learner_links")
    .select("id, learner_email, status, parent_user_id")
    .eq("learner_user_id", learnerUserId)
    .in("status", ["linked", "pending"]);

  if (error || !parentLinks?.length) return [];

  const results = [];
  for (const link of parentLinks as Array<{
    id: string;
    learner_email: string;
    status: string;
    parent_user_id: string;
  }>) {
    const { data: logs, count } = await supabase
      .from("practice_logs")
      .select("practiced_on, duration_minutes, road_type, confidence_rating", { count: "exact" })
      .eq("learner_link_id", link.id)
      .order("practiced_on", { ascending: false })
      .limit(5);

    const { data: parentProfile } = await supabase
      .from("parent_profiles")
      .select("display_name")
      .eq("user_id", link.parent_user_id)
      .maybeSingle();

    const parentName =
      (parentProfile as { display_name?: string | null } | null)?.display_name?.trim() ||
      "Parent / supervisor";

    const practiceRows = (logs ?? []) as Array<{
      practiced_on: string;
      duration_minutes: number;
      road_type: string;
      confidence_rating: number;
    }>;

    results.push({
      linkId: link.id,
      name: parentName,
      email: link.learner_email,
      status: link.status,
      practiceSessions: count ?? practiceRows.length,
      recentPractice: practiceRows.map((l) => ({
        practicedOn: l.practiced_on,
        durationMinutes: l.duration_minutes,
        roadType: l.road_type,
        confidenceRating: l.confidence_rating,
      })),
    });
  }

  return results;
}
