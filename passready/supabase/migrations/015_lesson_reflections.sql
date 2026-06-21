-- Lesson Reflections (additive). Run after migration 014.

CREATE TABLE IF NOT EXISTS public.lesson_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  lesson_date date NOT NULL,
  lesson_hours numeric(4, 1) NOT NULL CHECK (lesson_hours > 0 AND lesson_hours <= 8),
  lesson_type text NOT NULL CHECK (lesson_type IN ('instructor', 'parent_supervisor', 'private_practice')),
  topics_practised text[] NOT NULL DEFAULT '{}'::text[],
  confidence_before integer NOT NULL CHECK (confidence_before >= 1 AND confidence_before <= 5),
  confidence_after integer NOT NULL CHECK (confidence_after >= 1 AND confidence_after <= 5),
  strengths text[] NOT NULL DEFAULT '{}'::text[],
  difficulties text[] NOT NULL DEFAULT '{}'::text[],
  difficulty_notes text CHECK (difficulty_notes IS NULL OR char_length(difficulty_notes) <= 250),
  next_focus text[] NOT NULL DEFAULT '{}'::text[],
  private_practice_planned boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_reflections_user_idx
  ON public.lesson_reflections (user_id, lesson_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS lesson_reflections_created_by_idx
  ON public.lesson_reflections (created_by, created_at DESC);

ALTER TABLE public.lesson_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_reflections_learner_own" ON public.lesson_reflections;
CREATE POLICY "lesson_reflections_learner_own"
  ON public.lesson_reflections FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

DROP POLICY IF EXISTS "lesson_reflections_instructor_read" ON public.lesson_reflections;
CREATE POLICY "lesson_reflections_instructor_read"
  ON public.lesson_reflections FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.instructor_pupils ip
      WHERE ip.instructor_user_id = auth.uid()
        AND ip.linked_learner_user_id = lesson_reflections.user_id
        AND ip.link_status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "lesson_reflections_instructor_insert" ON public.lesson_reflections;
CREATE POLICY "lesson_reflections_instructor_insert"
  ON public.lesson_reflections FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM public.instructor_pupils ip
      WHERE ip.instructor_user_id = auth.uid()
        AND ip.linked_learner_user_id = lesson_reflections.user_id
        AND ip.link_status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "lesson_reflections_supervisor_read" ON public.lesson_reflections;
CREATE POLICY "lesson_reflections_supervisor_read"
  ON public.lesson_reflections FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parent_learner_links pll
      WHERE pll.parent_user_id = auth.uid()
        AND pll.learner_user_id = lesson_reflections.user_id
        AND pll.status = 'linked'
    )
  );

DROP POLICY IF EXISTS "lesson_reflections_supervisor_insert" ON public.lesson_reflections;
CREATE POLICY "lesson_reflections_supervisor_insert"
  ON public.lesson_reflections FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1
      FROM public.parent_learner_links pll
      WHERE pll.parent_user_id = auth.uid()
        AND pll.learner_user_id = lesson_reflections.user_id
        AND pll.status = 'linked'
    )
  );
