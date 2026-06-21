import { NextResponse } from "next/server";

import { buildReflectionInsights } from "@/lib/lesson-reflections/insights";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getUserAppRole } from "@/lib/server/user-app-role";
import {
  getLessonReflectionById,
  listLessonReflectionsForLearner,
} from "@/lib/server/repositories/lesson-reflections-repository";
import { getActiveLearnerLinkForParent } from "@/lib/server/repositories/parent-repository";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

async function canAccessReflection(authUserId: string, learnerUserId: string): Promise<boolean> {
  const role = await getUserAppRole(authUserId);
  if (role === "learner") return authUserId === learnerUserId;
  if (role === "parent") {
    const link = await getActiveLearnerLinkForParent(authUserId);
    return link?.learner_user_id === learnerUserId;
  }
  if (role === "instructor") {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("instructor_pupils")
      .select("linked_learner_user_id")
      .eq("instructor_user_id", authUserId)
      .eq("link_status", "accepted")
      .eq("linked_learner_user_id", learnerUserId)
      .maybeSingle();
    return Boolean(data?.linked_learner_user_id);
  }
  return false;
}

export async function GET(_request: Request, context: { params: { id: string } }) {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  try {
    const reflection = await getLessonReflectionById(context.params.id);
    if (!reflection) return jsonError(404, "NOT_FOUND", "Reflection not found.");

    const allowed = await canAccessReflection(auth.userId, reflection.user_id);
    if (!allowed) return jsonError(403, "FORBIDDEN", "You cannot view this reflection.");

    const learnerRows = await listLessonReflectionsForLearner(reflection.user_id);
    return NextResponse.json({
      success: true as const,
      reflection,
      insights: buildReflectionInsights(learnerRows),
    });
  } catch (e) {
    return jsonError(500, "REFLECTION_ERROR", e instanceof Error ? e.message : "Unable to load reflection.");
  }
}
