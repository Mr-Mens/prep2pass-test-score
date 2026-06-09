import "server-only";

import { normalizeEmail } from "@/lib/normalize-email";
import type { MockTestRow } from "@/lib/server/repositories/instructor-mock-repository";
import { getMockTestForInstructor } from "@/lib/server/repositories/instructor-mock-repository";
import { getPupilLinkById } from "@/lib/server/repositories/instructor-pupil-link-repository";
import { resolveLearnerUserIdByEmail } from "@/lib/server/resolve-learner-user-id";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type LearnerMockTestDeliveryRow = {
  id: string;
  mock_test_id: string;
  learner_user_id: string;
  instructor_user_id: string;
  recipient_email: string;
  sent_at: string;
  created_at: string;
};

export type LearnerMockTestListItem = {
  deliveryId: string;
  mockTestId: string;
  sentAt: string;
  pupilName: string;
  pupilEmail: string;
  outcome: string;
  minorFaultCount: number;
  seriousFaultCount: number;
  dangerousFaultCount: number;
  instructorName: string;
};

async function getInstructorDisplayName(instructorUserId: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("instructor_profiles")
    .select("display_name")
    .eq("user_id", instructorUserId)
    .maybeSingle();
  const fromProfile = (profile as { display_name?: string | null } | null)?.display_name?.trim();
  return fromProfile || "Your instructor";
}

async function resolveLearnerUserIdForMockTest(mockTest: MockTestRow, instructorUserId: string): Promise<string | null> {
  if (mockTest.pupil_id) {
    const pupil = await getPupilLinkById(mockTest.pupil_id);
    if (
      pupil &&
      pupil.instructor_user_id === instructorUserId &&
      pupil.link_status === "accepted" &&
      pupil.linked_learner_user_id
    ) {
      return pupil.linked_learner_user_id;
    }
  }

  const email = normalizeEmail(mockTest.pupil_email_snapshot ?? "");
  if (!email) return null;

  const supabase = getSupabaseServerClient();
  const { data: linkedPupil } = await supabase
    .from("instructor_pupils")
    .select("linked_learner_user_id")
    .eq("instructor_user_id", instructorUserId)
    .eq("link_status", "accepted")
    .ilike("pupil_email", email)
    .not("linked_learner_user_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (linkedPupil && (linkedPupil as { linked_learner_user_id: string }).linked_learner_user_id) {
    return (linkedPupil as { linked_learner_user_id: string }).linked_learner_user_id;
  }

  return resolveLearnerUserIdByEmail(email);
}

export async function getMockTestDeliveryForLearner(
  mockTestId: string,
  learnerUserId: string,
): Promise<(LearnerMockTestDeliveryRow & { mockTest: MockTestRow; instructorName: string }) | null> {
  const supabase = getSupabaseServerClient();
  const { data: delivery, error } = await supabase
    .from("learner_mock_test_deliveries")
    .select("*")
    .eq("mock_test_id", mockTestId)
    .eq("learner_user_id", learnerUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!delivery) return null;

  const { data: mockTest, error: mockError } = await supabase
    .from("instructor_mock_tests")
    .select("*")
    .eq("id", mockTestId)
    .eq("status", "completed")
    .maybeSingle();

  if (mockError) throw new Error(mockError.message);
  if (!mockTest) return null;

  const instructorName = await getInstructorDisplayName((delivery as LearnerMockTestDeliveryRow).instructor_user_id);

  return {
    ...(delivery as LearnerMockTestDeliveryRow),
    mockTest: mockTest as MockTestRow,
    instructorName,
  };
}

export async function listMockTestDeliveriesForLearner(learnerUserId: string): Promise<LearnerMockTestListItem[]> {
  const supabase = getSupabaseServerClient();
  const { data: deliveries, error } = await supabase
    .from("learner_mock_test_deliveries")
    .select("*")
    .eq("learner_user_id", learnerUserId)
    .order("sent_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return [];
    throw new Error(error.message);
  }
  if (!deliveries?.length) return [];

  const mockTestIds = deliveries.map((d) => (d as LearnerMockTestDeliveryRow).mock_test_id);
  const { data: mockTests, error: mockError } = await supabase
    .from("instructor_mock_tests")
    .select("*")
    .in("id", mockTestIds)
    .eq("status", "completed");

  if (mockError) throw new Error(mockError.message);
  const mockById = new Map((mockTests ?? []).map((m) => [(m as MockTestRow).id, m as MockTestRow]));

  const items: LearnerMockTestListItem[] = [];
  for (const row of deliveries as LearnerMockTestDeliveryRow[]) {
    const mockTest = mockById.get(row.mock_test_id);
    if (!mockTest) continue;
    const instructorName = await getInstructorDisplayName(row.instructor_user_id);
    items.push({
      deliveryId: row.id,
      mockTestId: row.mock_test_id,
      sentAt: row.sent_at,
      pupilName: mockTest.pupil_name_snapshot?.trim() || "Learner",
      pupilEmail: mockTest.pupil_email_snapshot ?? row.recipient_email,
      outcome: mockTest.outcome,
      minorFaultCount: mockTest.minor_fault_count,
      seriousFaultCount: mockTest.serious_fault_count,
      dangerousFaultCount: mockTest.dangerous_fault_count,
      instructorName,
    });
  }
  return items;
}

export async function getMockTestDeliveryStatus(
  mockTestId: string,
  instructorUserId: string,
): Promise<{ sentAt: string; recipientEmail: string } | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("learner_mock_test_deliveries")
    .select("sent_at, recipient_email")
    .eq("mock_test_id", mockTestId)
    .eq("instructor_user_id", instructorUserId)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  return {
    sentAt: (data as { sent_at: string }).sent_at,
    recipientEmail: (data as { recipient_email: string }).recipient_email,
  };
}

export async function sendMockTestToLearner(input: {
  mockTestId: string;
  instructorUserId: string;
}): Promise<{ delivery: LearnerMockTestDeliveryRow; learnerUserId: string; recipientEmail: string }> {
  const mockTest = await getMockTestForInstructor(input.mockTestId, input.instructorUserId);
  if (!mockTest) throw new Error("Mock test not found.");
  if (mockTest.status !== "completed") throw new Error("Complete the mock test before sending.");

  const recipientEmail = normalizeEmail(mockTest.pupil_email_snapshot ?? "");
  if (!recipientEmail) throw new Error("Add a pupil email before sending the report.");

  const learnerUserId = await resolveLearnerUserIdForMockTest(mockTest, input.instructorUserId);
  if (!learnerUserId) {
    throw new Error(
      "No linked Prep2Pass learner account found for this email. The pupil must accept your link invitation first, or have a saved report with this email.",
    );
  }

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("learner_mock_test_deliveries")
    .upsert(
      {
        mock_test_id: mockTest.id,
        learner_user_id: learnerUserId,
        instructor_user_id: input.instructorUserId,
        recipient_email: recipientEmail,
        sent_at: now,
      },
      { onConflict: "mock_test_id,learner_user_id" },
    )
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not deliver mock test.");

  return {
    delivery: data as LearnerMockTestDeliveryRow,
    learnerUserId,
    recipientEmail,
  };
}
