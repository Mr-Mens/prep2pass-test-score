-- Lightweight instructor lessons (additive). Run after migration 016.

CREATE TABLE IF NOT EXISTS public.instructor_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pupil_id uuid NOT NULL REFERENCES public.instructor_pupils (id) ON DELETE CASCADE,
  lesson_date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  lesson_focus text[] NOT NULL DEFAULT '{}'::text[],
  location text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled', 'reflection_pending')),
  instructor_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instructor_lessons_instructor_date_idx
  ON public.instructor_lessons (instructor_user_id, lesson_date DESC, start_time DESC);

CREATE INDEX IF NOT EXISTS instructor_lessons_pupil_idx
  ON public.instructor_lessons (pupil_id, lesson_date DESC, start_time DESC);

CREATE INDEX IF NOT EXISTS instructor_lessons_status_idx
  ON public.instructor_lessons (instructor_user_id, status, lesson_date);

ALTER TABLE public.instructor_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "instructor_lessons_own" ON public.instructor_lessons;
CREATE POLICY "instructor_lessons_own"
  ON public.instructor_lessons FOR ALL TO authenticated
  USING (auth.uid() = instructor_user_id)
  WITH CHECK (
    auth.uid() = instructor_user_id
    AND EXISTS (
      SELECT 1
      FROM public.instructor_pupils ip
      WHERE ip.id = instructor_lessons.pupil_id
        AND ip.instructor_user_id = auth.uid()
    )
  );
