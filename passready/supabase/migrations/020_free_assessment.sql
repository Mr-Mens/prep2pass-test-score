-- Track one free assessment per learner (score + readiness band preview only).
ALTER TABLE public.user_entitlements
  ADD COLUMN IF NOT EXISTS free_assessment_used_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_assessment_score SMALLINT,
  ADD COLUMN IF NOT EXISTS free_assessment_label TEXT,
  ADD COLUMN IF NOT EXISTS free_assessment_data JSONB;
