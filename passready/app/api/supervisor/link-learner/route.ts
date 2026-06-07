import { NextResponse } from "next/server";

import { requireParentApiUser } from "@/lib/server/api-auth";
import {
  createLearnerLink,
  listLearnerLinksForParent,
  refreshLearnerLink,
} from "@/lib/server/repositories/parent-repository";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function GET() {
  const auth = await requireParentApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true as const, links: [] as const });
  }
  try {
    const links = await listLearnerLinksForParent(auth.userId);
    const refreshed = await Promise.all(
      links.map(async (link) => {
        if (link.status !== "pending") return link;
        return (await refreshLearnerLink(link.id, auth.userId)) ?? link;
      }),
    );
    return NextResponse.json({ success: true as const, links: refreshed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to load learner links.";
    return jsonError(500, "LINKS_ERROR", msg);
  }
}

export async function POST(request: Request) {
  const auth = await requireParentApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) {
    return jsonError(503, "NOT_CONFIGURED", "Database not configured.");
  }
  try {
    const body = (await request.json()) as { learnerName?: string; learnerEmail?: string };
    const learnerName = typeof body.learnerName === "string" ? body.learnerName.trim() : "";
    const learnerEmail = typeof body.learnerEmail === "string" ? body.learnerEmail.trim() : "";
    if (!learnerName || !learnerEmail) {
      return jsonError(400, "VALIDATION", "Learner name and email are required.");
    }
    const link = await createLearnerLink({
      parentUserId: auth.userId,
      learnerName,
      learnerEmail,
    });
    return NextResponse.json({ success: true as const, link });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to link learner.";
    return jsonError(500, "LINK_ERROR", msg);
  }
}
