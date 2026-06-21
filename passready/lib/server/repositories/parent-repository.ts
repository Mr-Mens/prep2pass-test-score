import "server-only";

import { randomUUID } from "node:crypto";

import { sendParentLearnerInviteEmail } from "@/lib/email/templates/parent-learner-invite";
import { EmailNotConfiguredError } from "@/lib/email/resend";
import { normalizeEmail } from "@/lib/normalize-email";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";
import { isMissingSupervisorTableError, SUPERVISOR_MIGRATION_HINT } from "@/lib/server/supervisor-schema";

import type { ParentLearnerLinkRow, ParentProfileRow } from "@/lib/supervisor/types";

async function resolveLearnerUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const normalized = normalizeEmail(email);

  const { data: reportRow } = await supabase
    .from("reports")
    .select("user_id")
    .ilike("email", normalized)
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportRow && (reportRow as { user_id: string | null }).user_id) {
    return (reportRow as { user_id: string }).user_id;
  }

  return null;
}

export async function getParentProfile(userId: string): Promise<ParentProfileRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("parent_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    if (isMissingSupervisorTableError(error)) return null;
    throw new Error(error.message);
  }
  return data as ParentProfileRow | null;
}

export async function upsertParentProfile(userId: string, displayName: string | null): Promise<ParentProfileRow> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("parent_profiles")
    .upsert(
      { user_id: userId, display_name: displayName, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error) {
    if (isMissingSupervisorTableError(error)) {
      throw new Error(`Parent profiles are not set up yet. ${SUPERVISOR_MIGRATION_HINT}`);
    }
    throw new Error(error.message);
  }
  return data as ParentProfileRow;
}

export async function listLearnerLinksForParent(parentUserId: string): Promise<ParentLearnerLinkRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("parent_learner_links")
    .select("*")
    .eq("parent_user_id", parentUserId)
    .neq("status", "revoked")
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingSupervisorTableError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as ParentLearnerLinkRow[];
}

export async function getActiveLearnerLinkForParent(parentUserId: string): Promise<ParentLearnerLinkRow | null> {
  if (!isSupabaseConfigured()) return null;
  const links = await listLearnerLinksForParent(parentUserId);
  return links.find((l) => l.status === "linked" || l.status === "pending") ?? null;
}

export async function createLearnerLink(input: {
  parentUserId: string;
  learnerName: string;
  learnerEmail: string;
}): Promise<ParentLearnerLinkRow> {
  const supabase = getSupabaseServerClient();
  const email = normalizeEmail(input.learnerEmail);
  const learnerUserId = await resolveLearnerUserIdByEmail(email);
  const now = new Date().toISOString();
  const status = learnerUserId ? "linked" : "pending";
  const invitationToken = randomUUID();

  const { data, error } = await supabase
    .from("parent_learner_links")
    .upsert(
      {
        parent_user_id: input.parentUserId,
        learner_email: email,
        learner_name: input.learnerName.trim() || null,
        learner_user_id: learnerUserId,
        status,
        invitation_token: invitationToken,
        linked_at: learnerUserId ? now : null,
        updated_at: now,
      },
      { onConflict: "parent_user_id,learner_email" },
    )
    .select("*")
    .single();

  if (error) {
    if (isMissingSupervisorTableError(error)) {
      throw new Error(`Learner linking is not set up yet. ${SUPERVISOR_MIGRATION_HINT}`);
    }
    throw new Error(error.message);
  }

  const link = data as ParentLearnerLinkRow;
  const parentProfile = await getParentProfile(input.parentUserId);
  const parentName = parentProfile?.display_name?.trim() || "A parent / supervisor";

  try {
    await sendParentLearnerInviteEmail({
      toEmail: email,
      learnerName: input.learnerName.trim() || "Learner",
      parentName,
      hasExistingAccount: Boolean(learnerUserId),
      alreadyLinked: status === "linked",
    });
  } catch (e) {
    if (process.env.NODE_ENV === "production" || e instanceof EmailNotConfiguredError) {
      throw e instanceof Error ? e : new Error("Could not send learner link email.");
    }
    console.warn("[parent-learner-invite] email skipped", e);
  }

  return link;
}

/** Re-attempt linking when a learner account appears after a pending link. */
export async function refreshLearnerLink(linkId: string, parentUserId: string): Promise<ParentLearnerLinkRow | null> {
  const supabase = getSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("parent_learner_links")
    .select("*")
    .eq("id", linkId)
    .eq("parent_user_id", parentUserId)
    .maybeSingle();

  if (fetchError) {
    if (isMissingSupervisorTableError(fetchError)) return null;
    throw new Error(fetchError.message);
  }
  if (!existing) return null;

  const row = existing as ParentLearnerLinkRow;
  if (row.status === "linked" && row.learner_user_id) return row;

  const learnerUserId = await resolveLearnerUserIdByEmail(row.learner_email);
  if (!learnerUserId) return row;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("parent_learner_links")
    .update({
      learner_user_id: learnerUserId,
      status: "linked",
      linked_at: now,
      updated_at: now,
    })
    .eq("id", linkId)
    .eq("parent_user_id", parentUserId)
    .select("*")
    .single();

  if (error) {
    if (isMissingSupervisorTableError(error)) return row;
    throw new Error(error.message);
  }
  return data as ParentLearnerLinkRow;
}

export async function getLearnerLinkForParent(
  linkId: string,
  parentUserId: string,
): Promise<ParentLearnerLinkRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("parent_learner_links")
    .select("*")
    .eq("id", linkId)
    .eq("parent_user_id", parentUserId)
    .maybeSingle();
  if (error) {
    if (isMissingSupervisorTableError(error)) return null;
    throw new Error(error.message);
  }
  return data as ParentLearnerLinkRow | null;
}
