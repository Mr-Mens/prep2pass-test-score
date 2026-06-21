-- Per-topic confidence for lesson reflections (additive). Run after migration 015.

ALTER TABLE public.lesson_reflections
  ADD COLUMN IF NOT EXISTS topic_confidence jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.lesson_reflections.topic_confidence IS
  'Array of { topic_id, before, after } objects (1–5 each). Aggregate confidence_before/after remain as session averages.';
