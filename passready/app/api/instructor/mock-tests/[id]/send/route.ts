import { NextResponse } from "next/server";

import { requireInstructorApiUser } from "@/lib/server/api-auth";
import { getAppUrlForEmail } from "@/lib/email/app-url";
import { EmailNotConfiguredError } from "@/lib/email/resend";
import { getMockTestForInstructor } from "@/lib/server/repositories/instructor-mock-repository";
import { sendMockTestToLearner } from "@/lib/server/repositories/learner-mock-test-repository";
import { sendMockTestReportEmail } from "@/lib/server/send-mock-test-report-email";
import { isSupabaseConfigured } from "@/lib/server/supabase";

export const runtime = "nodejs";

type Props = { params: { id: string } };

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ success: false as const, error: { code, message } }, { status });
}

export async function POST(_request: Request, { params }: Props) {
  const auth = await requireInstructorApiUser();
  if (!auth.ok) return jsonError(auth.status, "AUTH", auth.message);
  if (!isSupabaseConfigured()) return jsonError(503, "NOT_CONFIGURED", "Database not configured.");

  try {
    const mockTest = await getMockTestForInstructor(params.id, auth.userId);
    if (!mockTest) return jsonError(404, "NOT_FOUND", "Mock test not found.");

    const { delivery, recipientEmail } = await sendMockTestToLearner({
      mockTestId: params.id,
      instructorUserId: auth.userId,
    });

    const supabase = (await import("@/lib/server/supabase")).getSupabaseServerClient();
    const { data: profile } = await supabase
      .from("instructor_profiles")
      .select("display_name")
      .eq("user_id", auth.userId)
      .maybeSingle();
    const instructorName =
      (profile as { display_name?: string | null } | null)?.display_name?.trim() || "Your instructor";

    await sendMockTestReportEmail({
      toEmail: recipientEmail,
      viewUrl: `${getAppUrlForEmail()}/mock-tests/${params.id}`,
      instructorName,
      outcome: mockTest.outcome,
      pupilName: mockTest.pupil_name_snapshot?.trim() || "Learner",
    });

    return NextResponse.json({
      success: true as const,
      sentAt: delivery.sent_at,
      recipientEmail,
    });
  } catch (e) {
    if (e instanceof EmailNotConfiguredError) {
      return jsonError(503, "EMAIL_NOT_CONFIGURED", e.message);
    }
    const msg = e instanceof Error ? e.message : "Unable to send mock test report.";
    return jsonError(500, "MOCK_SEND_ERROR", msg);
  }
}
