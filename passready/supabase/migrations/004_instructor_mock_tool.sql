-- Instructor mock test tool + roles (additive). Run in Supabase SQL Editor after prior migrations.

CREATE TABLE IF NOT EXISTS public.user_app_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'instructor', 'parent')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_app_profiles_role_idx ON public.user_app_profiles (role);

CREATE TABLE IF NOT EXISTS public.instructor_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text,
  adi_number_placeholder text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instructor_pupils (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pupil_name text NOT NULL DEFAULT '',
  pupil_email text NOT NULL,
  linked_learner_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS instructor_pupils_instructor_email_lower
  ON public.instructor_pupils (instructor_user_id, (lower(trim(pupil_email))));

CREATE INDEX IF NOT EXISTS instructor_pupils_instructor_idx ON public.instructor_pupils (instructor_user_id);

CREATE TABLE IF NOT EXISTS public.instructor_mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pupil_id uuid REFERENCES public.instructor_pupils (id) ON DELETE SET NULL,
  pupil_email_snapshot text,
  pupil_name_snapshot text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  minor_fault_threshold integer NOT NULL DEFAULT 15,
  driving_fault_count integer NOT NULL DEFAULT 0,
  minor_fault_count integer NOT NULL DEFAULT 0,
  serious_fault_count integer NOT NULL DEFAULT 0,
  dangerous_fault_count integer NOT NULL DEFAULT 0,
  outcome text NOT NULL CHECK (outcome IN ('pass', 'fail', 'undecided')),
  fail_reason text,
  form_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instructor_mock_tests_instructor_idx ON public.instructor_mock_tests (instructor_user_id);
CREATE INDEX IF NOT EXISTS instructor_mock_tests_status_idx ON public.instructor_mock_tests (status);

ALTER TABLE public.user_app_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_pupils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_mock_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_app_profiles_own" ON public.user_app_profiles;
CREATE POLICY "user_app_profiles_own"
  ON public.user_app_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "instructor_profiles_own" ON public.instructor_profiles;
CREATE POLICY "instructor_profiles_own"
  ON public.instructor_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "instructor_pupils_own" ON public.instructor_pupils;
CREATE POLICY "instructor_pupils_own"
  ON public.instructor_pupils FOR ALL TO authenticated
  USING (auth.uid() = instructor_user_id)
  WITH CHECK (auth.uid() = instructor_user_id);

DROP POLICY IF EXISTS "instructor_mock_tests_own" ON public.instructor_mock_tests;
CREATE POLICY "instructor_mock_tests_own"
  ON public.instructor_mock_tests FOR ALL TO authenticated
  USING (auth.uid() = instructor_user_id)
  WITH CHECK (auth.uid() = instructor_user_id);
