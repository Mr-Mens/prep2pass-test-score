import { NextResponse } from "next/server";

import {
  buildReflectionDashboardSummary,
  buildReflectionInsights,
} from "@/lib/lesson-reflections/insights";
import { createLessonReflectionSchema } from "@/lib/lesson-reflections/validation";
import { requireVerifiedApiUser } from "@/lib/server/api-auth";
import { getUserAppRole } from "@/lib/server/user-app-role";
import {
  createLessonReflection,
  listLessonReflectionsForInstructor,
  listLessonReflectionsForLearner,
  listLessonReflectionsForSupervisor,
} from "@/lib/server/repositories/lesson-reflections-repository";
import { getActiveLearnerLinkForParent } from "@/lib/server/repositories/parent-repository";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

async function resolveLearnerTarget(authUserId: string, requestedLearnerId?: string) {
  const role = await getUserAppRole(authUserId);
  if (role === "learner") {
    return { ok: true as const, learnerUserId: authUserId };
  }
  if (role === "instructor") {
    if (!requestedLearnerId) {
      return { ok: false as const, message: "Select a learner for this reflection." };
    }
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("instructor_pupils")
      .select("linked_learner_user_id")
      .eq("instructor_user_id", authUserId)
      .eq("link_status", "accepted")
      .eq("linked_learner_user_id", requestedLearnerId)
      .maybeSingle();
    if (!data?.linked_learner_user_id) {
      return { ok: false as const, message: "This learner is not linked to your instructor account." };
    }
    return { ok: true as const, learnerUserId: requestedLearnerId };
  }
  if (role === "parent") {
    const link = await getActiveLearnerLinkForParent(authUserId);
    if (!link?.learner_user_id) {
      return { ok: false as const, message: "Link a learner before saving reflections." };
    }
    if (requestedLearnerId && requestedLearnerId !== link.learner_user_id) {
      return { ok: false as const, message: "You can only reflect for your linked learner." };
    }
    return { ok: true as const, learnerUserId: link.learner_user_id };
  }
  return { ok: false as const, message: "You do not have permission to save reflections." };
}

export async function GET() {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true as const,
      reflections: [],
      summary: buildReflectionDashboardSummary([]),
      insights: buildReflectionInsights([]),
    });
  }

  try {
    const role = await getUserAppRole(auth.userId);
    const reflections =
      role === "instructor"
        ? await listLessonReflectionsForInstructor(auth.userId)
        : role === "parent"
          ? await listLessonReflectionsForSupervisor(auth.userId)
          : await listLessonReflectionsForLearner(auth.userId);

    const insightLearnerId =
      role === "learner"
        ? auth.userId
        : role === "parent"
          ? ((await getActiveLearnerLinkForParent(auth.userId))?.learner_user_id ?? auth.userId)
          : reflections[0]?.user_id ?? auth.userId;

    const insightRows = await listLessonReflectionsForLearner(insightLearnerId);

    return NextResponse.json({
      success: true as const,
      reflections,
      summary: buildReflectionDashboardSummary(insightRows),
      insights: buildReflectionInsights(insightRows),
    });
  } catch (e) {
    return jsonError(500, "REFLECTIONS_ERROR", e instanceof Error ? e.message : "Unable to load reflections.");
  }
}

export async function POST(request: Request) {
  const auth = await requireVerifiedApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return jsonError(503, "NOT_CONFIGURED", "Database not configured.");
  }

  try {
    const raw = await request.json();
    const parsed = createLessonReflectionSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION", parsed.error.issues[0]?.message ?? "Invalid reflection data.");
    }

    const target = await resolveLearnerTarget(auth.userId, parsed.data.learnerUserId);
    if (!target.ok) return jsonError(403, "FORBIDDEN", target.message);

    const reflection = await createLessonReflection({
      learnerUserId: target.learnerUserId,
      createdBy: auth.userId,
      payload: parsed.data,
    });

    return NextResponse.json({ success: true as const, reflection });
  } catch (e) {
    return jsonError(500, "REFLECTION_CREATE_ERROR", e instanceof Error ? e.message : "Unable to save reflection.");
  }
}
