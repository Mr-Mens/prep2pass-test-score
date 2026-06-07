import "server-only";

import { redirect } from "next/navigation";

import { dashboardPathForAppRole } from "@/lib/auth/post-auth-destination";
import { getUserAppRole } from "@/lib/server/user-app-role";
import {
  getActiveLearnerLinkForParent,
  refreshLearnerLink,
} from "@/lib/server/repositories/parent-repository";
import { getServerAuthUser } from "@/lib/supabase/server";

import type { ParentLearnerLinkRow } from "@/lib/supervisor/types";

export async function requireParentSession() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/supervisor")}`);
  }
  if (!user.emailConfirmedAt) {
    redirect(`/verify-email?next=${encodeURIComponent("/supervisor")}`);
  }
  const role = await getUserAppRole(user.id);
  if (role !== "parent") {
    redirect(dashboardPathForAppRole(role));
  }
  return user;
}

export async function getLinkedLearnerForParent(parentUserId: string): Promise<ParentLearnerLinkRow | null> {
  let link = await getActiveLearnerLinkForParent(parentUserId);
  if (link && link.status === "pending") {
    link = (await refreshLearnerLink(link.id, parentUserId)) ?? link;
  }
  return link;
}

export async function requireLinkedLearnerUserId(parentUserId: string): Promise<string | null> {
  const link = await getLinkedLearnerForParent(parentUserId);
  return link?.learner_user_id ?? null;
}
