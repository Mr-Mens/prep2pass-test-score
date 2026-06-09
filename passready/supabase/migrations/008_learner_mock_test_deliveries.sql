-- Instructor mock test delivery to linked learners (additive).

CREATE TABLE IF NOT EXISTS public.learner_mock_test_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id uuid NOT NULL REFERENCES public.instructor_mock_tests (id) ON DELETE CASCADE,
  learner_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  instructor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS learner_mock_test_deliveries_unique
  ON public.learner_mock_test_deliveries (mock_test_id, learner_user_id);

CREATE INDEX IF NOT EXISTS learner_mock_test_deliveries_learner_idx
  ON public.learner_mock_test_deliveries (learner_user_id, sent_at DESC);

ALTER TABLE public.learner_mock_test_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learner_mock_test_deliveries_own" ON public.learner_mock_test_deliveries;
CREATE POLICY "learner_mock_test_deliveries_own"
  ON public.learner_mock_test_deliveries FOR SELECT TO authenticated
  USING (auth.uid() = learner_user_id);
