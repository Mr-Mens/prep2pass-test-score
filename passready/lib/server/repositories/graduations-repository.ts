import "server-only";

import { isMissingCommercialTableError } from "@/lib/server/commercial-schema";
import { getSupabaseServerClient } from "@/lib/server/supabase";

export type LearnerGraduationRow = {
  user_id: string;
  pass_date: string;
  certificate_storage_path: string | null;
  recorded_at: string;
};

export async function getGraduationByUserId(userId: string): Promise<LearnerGraduationRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("learner_graduations").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    if (isMissingCommercialTableError(error)) return null;
    console.warn("[graduations] getGraduationByUserId failed", error.message);
    return null;
  }
  return data as LearnerGraduationRow | null;
}

export async function recordGraduation(input: {
  userId: string;
  passDate: string;
  certificateStoragePath?: string | null;
}): Promise<LearnerGraduationRow> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("learner_graduations")
    .upsert(
      {
        user_id: input.userId,
        pass_date: input.passDate,
        certificate_storage_path: input.certificateStoragePath ?? null,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not record graduation.");
  return data as LearnerGraduationRow;
}
